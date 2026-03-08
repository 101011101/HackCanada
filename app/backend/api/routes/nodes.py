import dataclasses
import secrets
import numpy as np
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from datetime import date, datetime, timezone, timedelta
from typing import Optional

from app.backend.api import storage, models
from app.backend.engine.schemas   import FarmNode
from app.backend.engine.scorer    import build_yield_matrix, compute_suitability, compute_risk_flags
from app.backend.engine.router    import build_reachability_matrix, haversine, compute_hub_routing
from app.backend.engine.scheduler import (classify_nodes, compute_locked_supply,
                                   compute_gap, compute_locked_supply_per_hub)
from app.backend.engine.optimizer import greedy_insert
from app.backend.engine.data         import CROP_GUIDES, CROP_TASKS
from app.backend.engine.gemini_tasks import generate_tasks_for_farm
from app.backend.api.ai_task_cache   import get_cached_tasks, set_cached_tasks, invalidate_farm_tasks

router = APIRouter()


def _get_primary_hub_info(farm_id: int) -> tuple[str, str]:
    """Return (hub_name, hub_priority) for the primary hub assigned to this farm."""
    routing = storage.load_hub_routing()
    hub_ids = routing.get(str(farm_id)) or routing.get(farm_id) or []
    if not hub_ids:
        return ('Unknown Hub', 'standard')
    hubs = storage.load_hubs()
    hub  = next((h for h in hubs if h['id'] == hub_ids[0]), None)
    if not hub:
        return ('Unknown Hub', 'standard')
    return (hub['name'], hub['priority'])


def _now() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat(timespec='seconds')


def _greedy_assign(farm: FarmNode, farms, crops, hubs, config,
                   yield_matrix, reachability_matrix) -> tuple[list[int], np.ndarray]:
    """Shared greedy multi-slot assignment for a single farm. Returns (assigned_crop_ids, new_yield_row)."""
    M = len(crops)
    H = len(hubs)
    locked, available = classify_nodes(farms, date.today())
    locked_supply     = compute_locked_supply(farms, locked, yield_matrix, M)
    gap_vector        = compute_gap(config, locked_supply, list(range(M)))
    locked_hub_supply = compute_locked_supply_per_hub(
        farms, locked, yield_matrix, hubs, reachability_matrix, M)

    existing_assignments = storage.load_assignments()
    current_hub_supply   = locked_hub_supply.copy()
    for i in available:
        crop_ids = existing_assignments.get(str(farms[i].id), [])
        n = len(crop_ids) if crop_ids else 1
        for c in crop_ids:
            for h in range(H):
                if reachability_matrix[i][h]:
                    current_hub_supply[h][c] += yield_matrix[i][c] / n

    new_yield_row = np.array([
        compute_suitability(farm, crop) * crop.base_yield_per_sqft * farm.plot_size_sqft
        for crop in crops
    ], dtype=float)
    new_reach_row = np.array([
        haversine(farm.lat, farm.lng, hub.lat, hub.lng) <= config.max_travel_distance
        for hub in hubs
    ], dtype=bool)

    num_slots      = max(1, int(farm.plot_size_sqft // getattr(config, 'min_slot_sqft', 50.0)))
    assigned       = []
    running_supply = current_hub_supply.copy()

    # Honour user's explicit crop selections: seed the first slots with preferred
    # crops (filtered to those that have positive suitability).
    viable_preferred = [c for c in farm.preferred_crop_ids
                        if 0 <= c < M and new_yield_row[c] > 0]
    for crop_idx in viable_preferred[:num_slots]:
        assigned.append(crop_idx)
        slot_yield = new_yield_row[crop_idx] / num_slots
        for h in range(H):
            if new_reach_row[h]:
                running_supply[h][crop_idx] += slot_yield

    # Fill remaining slots with greedy optimizer
    for slot in range(len(assigned), num_slots):
        modified = new_yield_row.copy()
        for already in assigned:
            modified[already] = 0.0
        crop_idx = greedy_insert(
            modified, new_reach_row, crops, hubs,
            gap_vector, running_supply,
            preferred_crop_ids=farm.preferred_crop_ids,
        )
        assigned.append(crop_idx)
        slot_yield = new_yield_row[crop_idx] / num_slots
        for h in range(H):
            if new_reach_row[h]:
                running_supply[h][crop_idx] += slot_yield

    return assigned, new_yield_row, gap_vector, num_slots


# ---------------------------------------------------------------------------
# Balance / crops-on-hand
# ---------------------------------------------------------------------------

@router.get('/nodes/{node_id}/balance', response_model=models.BalanceResponse)
def get_balance(node_id: int):
    farms = storage.load_farms()
    farm  = next((f for f in farms if f['id'] == node_id), None)
    if not farm:
        raise HTTPException(status_code=404, detail=f'Node {node_id} not found')
    return models.BalanceResponse(
        node_id          = node_id,
        currency_balance = farm.get('currency_balance', 0.0),
        crops_on_hand    = farm.get('crops_on_hand', {}),
        crops_lifetime   = farm.get('crops_lifetime', {}),
    )


@router.patch('/nodes/{node_id}/crops-on-hand')
def update_crops_on_hand(node_id: int, body: models.CropsOnHandBody):
    farms = storage.load_farms()
    farm  = next((f for f in farms if f['id'] == node_id), None)
    if not farm:
        raise HTTPException(status_code=404, detail=f'Node {node_id} not found')
    crops_on_hand = farm.get('crops_on_hand', {})
    crops_on_hand[str(body.crop_id)] = body.quantity_kg
    farm['crops_on_hand'] = crops_on_hand

    crops_lifetime = farm.get('crops_lifetime', {})
    key = str(body.crop_id)
    crops_lifetime[key] = round(crops_lifetime.get(key, 0.0) + body.quantity_kg, 4)
    farm['crops_lifetime'] = crops_lifetime

    storage.save_farms(farms)
    return {'crops_on_hand': crops_on_hand, 'crops_lifetime': crops_lifetime}


# ---------------------------------------------------------------------------
# Create farm
# ---------------------------------------------------------------------------

@router.get('/nodes/keys')
def get_node_keys():
    """Return all node keys (admin use)."""
    return storage.load_node_keys()


@router.post('/nodes', response_model=list[models.BundleResponse])
def add_node(req: models.NewFarmRequest, background_tasks: BackgroundTasks):
    farms, crops, hubs, config = storage.load_engine_state()

    new_id   = max(f.id for f in farms) + 1
    today    = date.today()
    now_str  = _now()
    new_farm = FarmNode(
        id=new_id, name=req.name,
        lat=req.lat, lng=req.lng,
        plot_size_sqft=req.plot_size_sqft,
        plot_type=req.plot_type,
        tools=req.tools, budget=req.budget,
        pH=req.pH, moisture=req.moisture,
        temperature=req.temperature, humidity=req.humidity,
        sunlight_hours=req.sunlight_hours,
        status='new',
        preferred_crop_ids=req.preferred_crop_ids,
        max_delivery_distance_m=req.max_delivery_distance_m,
        cycle_start_date=today,
        cycle_number=1,
        joined_at=now_str,
    )

    yield_matrix        = build_yield_matrix(farms, crops)
    reachability_matrix = build_reachability_matrix(farms, hubs, config.max_travel_distance)
    assigned, new_yield_row, gap_vector, num_slots = _greedy_assign(
        new_farm, farms, crops, hubs, config, yield_matrix, reachability_matrix)

    farm_dict = dataclasses.asdict(new_farm)
    farm_dicts = storage.load_farms()
    farm_dicts.append(farm_dict)
    storage.save_farms(farm_dicts)

    assignments = storage.load_assignments()
    assignments[str(new_id)] = list(dict.fromkeys(assigned))  # deduplicate crop slots
    storage.save_assignments(assignments)

    # Update hub routing so the new node is immediately wired into the network
    all_farms, _, all_hubs, all_config = storage.load_engine_state()
    routing = compute_hub_routing(all_farms, all_hubs, all_config.max_travel_distance)
    storage.save_hub_routing(routing)

    sqft_per = round(new_farm.plot_size_sqft / num_slots, 1)
    bundles  = []
    crops_for_ai = []
    for c in assigned:
        crop        = crops[c]
        suitability = compute_suitability(new_farm, crop)
        qty_kg      = round(float(new_yield_row[c]) / num_slots, 1)
        target      = config.food_targets.get(c, 0)
        gap_pct     = max(0.0, gap_vector[c] / target * 100) if target > 0 else 0.0
        bundles.append(models.BundleResponse(
            farm_id          = new_id,
            farm_name        = new_farm.name,
            crop_id          = crop.id,
            crop_name        = crop.name,
            quantity_kg      = qty_kg,
            grow_weeks       = crop.grow_weeks,
            sqft_allocated   = sqft_per,
            preference_match = c in new_farm.preferred_crop_ids,
            cycle_start_date = str(today),
            cycle_number     = 1,
            joined_at        = now_str,
            reason=(
                f"Suitability {suitability:.0%} for {crop.name} — "
                f"soil pH {new_farm.pH:.1f} "
                f"(optimal {crop.optimal_pH[0]}–{crop.optimal_pH[1]}), "
                f"network gap {gap_pct:.0f}% unfilled"
            ),
        ))
        crops_for_ai.append((crop, qty_kg))

    def _generate_tasks_bg():
        try:
            hub_name, hub_priority = _get_primary_hub_info(new_id)
            for crop, qty_kg in crops_for_ai:
                ai_tasks = generate_tasks_for_farm(new_farm, crop, sqft_per, qty_kg, hub_name, hub_priority)
                if ai_tasks is not None:
                    set_cached_tasks(new_id, crop.id, 1, ai_tasks)
        except Exception as e:
            print(f"[task-gen] failed for new farm {new_id}: {e}")

    background_tasks.add_task(_generate_tasks_bg)
    return bundles


# ---------------------------------------------------------------------------
# Update crop assignments on an existing farm
# ---------------------------------------------------------------------------

@router.patch('/nodes/{farm_id}/crops', response_model=list[models.BundleResponse])
def update_farm_crops(farm_id: int, req: models.UpdateCropsRequest, background_tasks: BackgroundTasks):
    """Add or replace crop assignments for an existing farm without creating a new one.

    replace=True  → set assignments to exactly req.crop_ids (used by initial setup)
    replace=False → append req.crop_ids to existing assignments, deduplicating
    """
    farm_dicts = storage.load_farms()
    farm_dict  = next((d for d in farm_dicts if d['id'] == farm_id), None)
    if not farm_dict:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')

    assignments = storage.load_assignments()
    existing    = assignments.get(str(farm_id), [])

    if req.replace:
        new_crop_ids = list(dict.fromkeys(req.crop_ids))
    else:
        combined     = existing + [c for c in req.crop_ids if c not in existing]
        new_crop_ids = list(dict.fromkeys(combined))

    if not new_crop_ids:
        raise HTTPException(status_code=400, detail='crop_ids must not be empty')

    assignments[str(farm_id)] = new_crop_ids
    storage.save_assignments(assignments)

    farm_dict['preferred_crop_ids'] = new_crop_ids
    storage.save_farms(farm_dicts)

    farm       = storage.dict_to_farmnode(farm_dict)
    crop_dicts = storage.load_crops()
    n          = len(new_crop_ids)
    sqft_per   = round(farm.plot_size_sqft / n, 1)
    cycle_number = farm_dict.get('cycle_number', 1)
    bundles    = []
    crops_for_ai = []  # collect (crop, qty_kg) for background generation
    for crop_id in new_crop_ids:
        crop_dict = next((d for d in crop_dicts if d['id'] == crop_id), None)
        if not crop_dict:
            continue
        crop        = storage.dict_to_crop(crop_dict)
        suitability = compute_suitability(farm, crop)
        qty_kg      = round(suitability * crop.base_yield_per_sqft * sqft_per, 1)
        bundles.append(models.BundleResponse(
            farm_id          = farm.id,
            farm_name        = farm.name,
            crop_id          = crop.id,
            crop_name        = crop.name,
            quantity_kg      = qty_kg,
            grow_weeks       = crop.grow_weeks,
            sqft_allocated   = sqft_per,
            preference_match = True,
            cycle_start_date = str(farm.cycle_start_date) if farm.cycle_start_date else None,
            cycle_number     = farm.cycle_number,
            joined_at        = farm.joined_at,
            reason           = (
                f"Suitability {suitability:.0%} for {crop.name} — "
                f"soil pH {farm.pH:.1f} (optimal {crop.optimal_pH[0]}–{crop.optimal_pH[1]})"
            ),
        ))
        crops_for_ai.append((crop, qty_kg))

    def _generate_tasks_bg():
        try:
            invalidate_farm_tasks(farm_id)
            hub_name, hub_priority = _get_primary_hub_info(farm_id)
            for crop, qty_kg in crops_for_ai:
                ai_tasks = generate_tasks_for_farm(farm, crop, sqft_per, qty_kg, hub_name, hub_priority)
                if ai_tasks is not None:
                    set_cached_tasks(farm_id, crop.id, cycle_number, ai_tasks)
        except Exception as e:
            print(f"[task-gen] failed for farm {farm_id}: {e}")

    background_tasks.add_task(_generate_tasks_bg)
    return bundles


# ---------------------------------------------------------------------------
# Soil readings
# ---------------------------------------------------------------------------

@router.get('/nodes/{farm_id}/data', response_model=models.SoilReadingResponse)
def get_soil_data(farm_id: int):
    farm_dicts = storage.load_farms()
    d = next((f for f in farm_dicts if f['id'] == farm_id), None)
    if not d:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')
    return models.SoilReadingResponse(
        farm_id=farm_id, pH=d['pH'], moisture=d['moisture'],
        temperature=d['temperature'], humidity=d['humidity'],
        sunlight_hours=d.get('sunlight_hours'),
    )


@router.patch('/nodes/{farm_id}/data')
def update_soil(farm_id: int, req: models.SoilUpdateRequest):
    farm_dicts = storage.load_farms()
    for d in farm_dicts:
        if d['id'] == farm_id:
            d['pH']          = req.pH
            d['moisture']    = req.moisture
            d['temperature'] = req.temperature
            d['humidity']    = req.humidity
            if req.sunlight_hours is not None:
                d['sunlight_hours'] = req.sunlight_hours
            storage.save_farms(farm_dicts)
            return {'status': 'ok', 'farm_id': farm_id}
    raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')


@router.post('/nodes/{farm_id}/readings', response_model=models.ReadingEntryResponse)
def post_reading(farm_id: int, body: models.ReadingEntry):
    farm_dicts = storage.load_farms()
    farm = next((d for d in farm_dicts if d['id'] == farm_id), None)
    if not farm:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')

    # Update live soil values on farm
    farm['pH']          = body.pH
    farm['moisture']    = body.moisture
    farm['temperature'] = body.temperature
    farm['humidity']    = body.humidity
    storage.save_farms(farm_dicts)

    # Append to readings log (scoped per farm + crop)
    readings = storage.load_readings()
    entry = {
        'id':          len(readings),
        'farm_id':     farm_id,
        'crop_id':     body.crop_id,
        'recorded_at': _now(),
        'pH':          body.pH,
        'moisture':    body.moisture,
        'temperature': body.temperature,
        'humidity':    body.humidity,
    }
    readings.append(entry)
    storage.save_readings(readings)
    return entry


@router.get('/nodes/{farm_id}/readings', response_model=list[models.ReadingEntryResponse])
def get_readings(
    farm_id: int,
    limit:   int            = Query(default=30, ge=1, le=500),
    crop_id: Optional[int]  = Query(default=None),
):
    assignments = storage.load_assignments()
    farm_crop_ids = set(assignments.get(str(farm_id), []))

    readings = storage.load_readings()

    if crop_id is not None:
        # Return only this crop's readings for this farm, unaveraged
        relevant = [r for r in readings if r.get('farm_id') == farm_id and r.get('crop_id') == crop_id]
        relevant.sort(key=lambda r: r['recorded_at'])
        return relevant[-limit:]

    # Default: average across all crops by minute bucket, scoped to this farm
    # If farm has no assignment yet, include all readings for the farm regardless of crop
    from collections import defaultdict
    if farm_crop_ids:
        relevant = [r for r in readings if r.get('farm_id') == farm_id and r.get('crop_id') in farm_crop_ids]
    else:
        relevant = [r for r in readings if r.get('farm_id') == farm_id]
    buckets: dict[str, list] = defaultdict(list)
    for r in relevant:
        bucket = datetime.fromisoformat(r['recorded_at']).strftime('%Y-%m-%dT%H:%M')
        buckets[bucket].append(r)

    averaged = []
    for bucket in sorted(buckets.keys()):
        group = buckets[bucket]
        n = len(group)
        averaged.append({
            'id':          group[0]['id'],
            'farm_id':     farm_id,
            'crop_id':     0,
            'recorded_at': group[0]['recorded_at'],
            'pH':          round(sum(r['pH'] for r in group) / n, 2),
            'moisture':    round(sum(r['moisture'] for r in group) / n, 2),
            'temperature': round(sum(r['temperature'] for r in group) / n, 2),
            'humidity':    round(sum(r['humidity'] for r in group) / n, 2),
        })

    return averaged[-limit:]


# ---------------------------------------------------------------------------
# Get node assignment
# ---------------------------------------------------------------------------

@router.get('/nodes/{farm_id}', response_model=list[models.BundleResponse])
def get_node(farm_id: int):
    farm_dicts  = storage.load_farms()
    crop_dicts  = storage.load_crops()
    assignments = storage.load_assignments()

    farm_dict = next((d for d in farm_dicts if d['id'] == farm_id), None)
    if not farm_dict:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')

    farm     = storage.dict_to_farmnode(farm_dict)
    crop_ids = assignments.get(str(farm_id))

    if not crop_ids:
        if farm.current_crop_ids:
            crop_ids = farm.current_crop_ids
        else:
            raise HTTPException(status_code=404,
                                detail=f'No assignment for farm {farm_id} — run /optimize first')

    sqft_per = round(farm.plot_size_sqft / len(crop_ids), 1)
    bundles  = []
    for crop_id in crop_ids:
        crop_dict = next((d for d in crop_dicts if d['id'] == crop_id), None)
        if not crop_dict:
            raise HTTPException(status_code=404, detail=f'Crop {crop_id} not found')
        crop        = storage.dict_to_crop(crop_dict)
        suitability = compute_suitability(farm, crop)
        qty_kg      = round(suitability * crop.base_yield_per_sqft * sqft_per, 1)
        bundles.append(models.BundleResponse(
            farm_id          = farm.id,
            farm_name        = farm.name,
            crop_id          = crop.id,
            crop_name        = crop.name,
            quantity_kg      = qty_kg,
            grow_weeks       = crop.grow_weeks,
            sqft_allocated   = sqft_per,
            preference_match = crop_id in farm.preferred_crop_ids,
            cycle_start_date = str(farm.cycle_start_date) if farm.cycle_start_date else None,
            cycle_number     = farm.cycle_number,
            joined_at        = farm.joined_at,
            reason=(
                f"Suitability {suitability:.0%} for {crop.name} — "
                f"soil pH {farm.pH:.1f} (optimal {crop.optimal_pH[0]}–{crop.optimal_pH[1]})"
            ),
        ))
    return bundles


# ---------------------------------------------------------------------------
# Cycle end
# ---------------------------------------------------------------------------

@router.post('/nodes/{farm_id}/cycle-end', response_model=list[models.BundleResponse])
def cycle_end(farm_id: int, body: models.CycleEndRequest):
    farm_dicts = storage.load_farms()
    farm_dict  = next((d for d in farm_dicts if d['id'] == farm_id), None)
    if not farm_dict:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')

    # Write actual yield into yield_history and crops_lifetime
    yield_history  = farm_dict.get('yield_history', {})
    crops_lifetime = farm_dict.get('crops_lifetime', {})
    for crop_id_str, kg in body.actual_yield_kg.items():
        prev = yield_history.get(crop_id_str, [])
        prev.append(round(float(kg), 4))
        yield_history[crop_id_str]  = prev
        crops_lifetime[crop_id_str] = round(crops_lifetime.get(crop_id_str, 0.0) + float(kg), 4)

    today = date.today()
    farm_dict['yield_history']   = yield_history
    farm_dict['crops_lifetime']  = crops_lifetime
    farm_dict['cycle_number']    = farm_dict.get('cycle_number', 1) + 1
    farm_dict['cycle_start_date'] = str(today)
    farm_dict['cycle_end_date']  = None
    farm_dict['status']          = 'available'
    storage.save_farms(farm_dicts)

    # Re-run greedy assignment
    farms, crops, hubs, config = storage.load_engine_state()
    farm = storage.dict_to_farmnode(farm_dict)
    yield_matrix        = build_yield_matrix(farms, crops)
    reachability_matrix = build_reachability_matrix(farms, hubs, config.max_travel_distance)
    assigned, new_yield_row, gap_vector, num_slots = _greedy_assign(
        farm, farms, crops, hubs, config, yield_matrix, reachability_matrix)

    assignments = storage.load_assignments()
    assignments[str(farm_id)] = assigned
    storage.save_assignments(assignments)

    sqft_per = round(farm.plot_size_sqft / num_slots, 1)
    bundles  = []
    for c in assigned:
        crop        = crops[c]
        suitability = compute_suitability(farm, crop)
        qty_kg      = round(float(new_yield_row[c]) / num_slots, 1)
        target      = config.food_targets.get(c, 0)
        gap_pct     = max(0.0, gap_vector[c] / target * 100) if target > 0 else 0.0
        bundles.append(models.BundleResponse(
            farm_id          = farm_id,
            farm_name        = farm.name,
            crop_id          = crop.id,
            crop_name        = crop.name,
            quantity_kg      = qty_kg,
            grow_weeks       = crop.grow_weeks,
            sqft_allocated   = sqft_per,
            preference_match = c in farm.preferred_crop_ids,
            cycle_start_date = str(today),
            cycle_number     = farm_dict['cycle_number'],
            joined_at        = farm.joined_at,
            reason=(
                f"Suitability {suitability:.0%} for {crop.name} — "
                f"network gap {gap_pct:.0f}% unfilled"
            ),
        ))
    return bundles


# ---------------------------------------------------------------------------
# Guide
# ---------------------------------------------------------------------------

@router.get('/nodes/{farm_id}/guide')
def get_guide(farm_id: int):
    farm_dicts  = storage.load_farms()
    farm_dict   = next((d for d in farm_dicts if d['id'] == farm_id), None)
    if not farm_dict:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')

    assignments = storage.load_assignments()
    crop_ids    = assignments.get(str(farm_id)) or farm_dict.get('current_crop_ids') or []
    if not crop_ids:
        raise HTTPException(status_code=404,
                            detail=f'No assignment for farm {farm_id} — run /optimize first')

    crop_dicts = storage.load_crops()
    guides = []
    for crop_id in crop_ids:
        crop_dict = next((d for d in crop_dicts if d['id'] == crop_id), None)
        crop_name = crop_dict['name'] if crop_dict else str(crop_id)
        guides.append({
            'crop_id':   crop_id,
            'crop_name': crop_name,
            'guide':     CROP_GUIDES.get(crop_id, 'No guide available for this crop yet.'),
        })
    return {'farm_id': farm_id, 'guides': guides}


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@router.get('/nodes/{farm_id}/tasks', response_model=list[models.TaskItem])
def get_farm_tasks(farm_id: int):
    farm_dicts  = storage.load_farms()
    farm_dict   = next((d for d in farm_dicts if d['id'] == farm_id), None)
    if not farm_dict:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')

    assignments = storage.load_assignments()
    crop_ids    = assignments.get(str(farm_id)) or farm_dict.get('current_crop_ids') or []
    if not crop_ids:
        raise HTTPException(status_code=404,
                            detail=f'No assignment for farm {farm_id} — run /optimize first')

    crop_dicts       = storage.load_crops()
    cycle_start_str  = farm_dict.get('cycle_start_date')
    cycle_start      = date.fromisoformat(cycle_start_str) if cycle_start_str else None
    cycle_number     = farm_dict.get('cycle_number', 1)
    today            = date.today()

    items = []
    for crop_id in dict.fromkeys(crop_ids):  # deduplicate while preserving order
        crop_dict = next((d for d in crop_dicts if d['id'] == crop_id), None)
        crop_name = crop_dict['name'] if crop_dict else str(crop_id)

        # Cache-first: use AI tasks if available, otherwise fall back to static
        cached = get_cached_tasks(farm_id, crop_id, cycle_number)
        task_source = cached if cached is not None else CROP_TASKS.get(crop_id, [])

        for task in task_source:
            due_date = None
            status   = None
            if cycle_start:
                due      = cycle_start + timedelta(days=task['day_from_start'])
                due_date = str(due)
                days_out = (due - today).days
                if days_out < 0:
                    status = 'done'
                elif days_out <= 7:
                    status = 'upcoming'
                else:
                    status = 'future'
            items.append(models.TaskItem(
                id             = task['id'],
                crop_id        = task.get('crop_id', crop_id),
                crop_name      = task.get('crop_name', crop_name),
                title          = task['title'],
                subtitle       = task['subtitle'],
                why            = task['why'],
                how            = task['how'],
                target         = task['target'],
                tools_required = task['tools_required'],
                day_from_start = task['day_from_start'],
                due_date       = due_date,
                status         = status,
            ))
    items.sort(key=lambda t: t.day_from_start)
    return items


# ---------------------------------------------------------------------------
# Risks
# ---------------------------------------------------------------------------

@router.get('/nodes/{farm_id}/risks', response_model=list[models.RiskFlag])
def get_risks(farm_id: int):
    farm_dicts  = storage.load_farms()
    farm_dict   = next((d for d in farm_dicts if d['id'] == farm_id), None)
    if not farm_dict:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')

    farm        = storage.dict_to_farmnode(farm_dict)
    assignments = storage.load_assignments()
    crop_ids    = assignments.get(str(farm_id)) or farm.current_crop_ids or []

    if not crop_ids:
        return []

    crop_dicts = storage.load_crops()
    assigned_crops = [
        storage.dict_to_crop(d) for d in crop_dicts if d['id'] in crop_ids
    ]
    flags = compute_risk_flags(farm, assigned_crops)
    return [models.RiskFlag(**f) for f in flags]


# ---------------------------------------------------------------------------
# Delete farm node
# ---------------------------------------------------------------------------

@router.delete('/nodes/{farm_id}')
def delete_node(farm_id: int):
    """Remove a farm node and its assignments from the network."""
    farm_dicts = storage.load_farms()
    original_len = len(farm_dicts)
    farm_dicts = [f for f in farm_dicts if f['id'] != farm_id]
    if len(farm_dicts) == original_len:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')
    storage.save_farms(farm_dicts)

    assignments = storage.load_assignments()
    assignments.pop(str(farm_id), None)
    storage.save_assignments(assignments)

    # Update hub routing to remove the deleted node
    all_farms, _, all_hubs, all_config = storage.load_engine_state()
    routing = compute_hub_routing(all_farms, all_hubs, all_config.max_travel_distance)
    storage.save_hub_routing(routing)

    return {'status': 'deleted', 'farm_id': farm_id}


@router.post('/nodes/{farm_id}/key/generate', response_model=models.NodeKeyResponse)
def generate_node_key(farm_id: int):
    """Generate (or regenerate) the access key for a node."""
    farms = storage.load_farms()
    farm  = next((f for f in farms if f['id'] == farm_id), None)
    if not farm:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')
    keys    = storage.load_node_keys()
    new_key = secrets.token_urlsafe(12)
    keys[str(farm_id)] = new_key
    storage.save_node_keys(keys)
    return models.NodeKeyResponse(farm_id=farm_id, key=new_key)


@router.post('/auth/node', response_model=models.NodeAuthResponse)
def auth_node(body: models.NodeAuthRequest):
    """Validate a node key and return the associated farm's id and name."""
    keys       = storage.load_node_keys()
    farm_id_str = next((fid for fid, k in keys.items() if k == body.key), None)
    if farm_id_str is None:
        raise HTTPException(status_code=401, detail='Invalid node key')
    farm_id = int(farm_id_str)
    farms   = storage.load_farms()
    farm    = next((f for f in farms if f['id'] == farm_id), None)
    if not farm:
        raise HTTPException(status_code=404, detail='Farm not found')
    return models.NodeAuthResponse(farm_id=farm_id, farm_name=farm['name'])
