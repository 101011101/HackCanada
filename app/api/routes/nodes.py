import dataclasses
import numpy as np
from fastapi import APIRouter, HTTPException
from datetime import date

from app.api import storage, models
from app.engine.schemas   import FarmNode
from app.engine.scorer    import build_yield_matrix, compute_suitability
from app.engine.router    import build_reachability_matrix, haversine
from app.engine.scheduler import (classify_nodes, compute_locked_supply,
                                   compute_gap, compute_locked_supply_per_hub)
from app.engine.optimizer import greedy_insert

router = APIRouter()


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
    storage.save_farms(farms)
    return {'crops_on_hand': crops_on_hand}


@router.post('/nodes', response_model=list[models.BundleResponse])
def add_node(req: models.NewFarmRequest):
    farms, crops, hubs, config = storage.load_engine_state()
    M = len(crops)
    H = len(hubs)

    # Create new farm
    new_id   = max(f.id for f in farms) + 1
    new_farm = FarmNode(
        id=new_id, name=req.name,
        lat=req.lat, lng=req.lng,
        plot_size_sqft=req.plot_size_sqft,
        plot_type=req.plot_type,
        tools=req.tools, budget=req.budget,
        pH=req.pH, moisture=req.moisture,
        temperature=req.temperature, humidity=req.humidity,
        status='new',
        preferred_crop_ids=req.preferred_crop_ids,
    )

    # Matrices for existing farms (needed for gap + hub supply)
    yield_matrix        = build_yield_matrix(farms, crops)
    reachability_matrix = build_reachability_matrix(farms, hubs, config.max_travel_distance)

    locked, available   = classify_nodes(farms, date.today())
    locked_supply       = compute_locked_supply(farms, locked, yield_matrix, M)
    gap_vector          = compute_gap(config, locked_supply, list(range(M)))
    locked_hub_supply   = compute_locked_supply_per_hub(
        farms, locked, yield_matrix, hubs, reachability_matrix, M)

    # Current hub supply = locked + already-assigned available farms
    existing_assignments = storage.load_assignments()  # {farm_id_str: [crop_id, ...]}
    current_hub_supply   = locked_hub_supply.copy()
    for i in available:
        crop_ids = existing_assignments.get(str(farms[i].id), [])
        n = len(crop_ids) if crop_ids else 1
        for c in crop_ids:
            for h in range(H):
                if reachability_matrix[i][h]:
                    current_hub_supply[h][c] += yield_matrix[i][c] / n

    # Yield row and reachability row for the new farm
    new_yield_row = np.array([
        compute_suitability(new_farm, crop) * crop.base_yield_per_sqft * new_farm.plot_size_sqft
        for crop in crops
    ], dtype=float)
    new_reach_row = np.array([
        haversine(new_farm.lat, new_farm.lng, hub.lat, hub.lng) <= config.max_travel_distance
        for hub in hubs
    ], dtype=bool)

    # Multi-crop greedy assignment
    num_slots   = max(1, int(new_farm.plot_size_sqft // config.min_slot_sqft))
    assigned    = []
    running_supply = current_hub_supply.copy()

    for slot in range(num_slots):
        modified_yield_row = new_yield_row.copy()
        for already in assigned:
            modified_yield_row[already] = 0.0
        crop_idx = greedy_insert(
            modified_yield_row, new_reach_row, crops, hubs,
            gap_vector, running_supply,
            preferred_crop_ids=new_farm.preferred_crop_ids,
        )
        assigned.append(crop_idx)
        slot_yield = new_yield_row[crop_idx] / num_slots
        for h in range(H):
            if new_reach_row[h]:
                running_supply[h][crop_idx] += slot_yield

    # Persist
    farm_dicts = storage.load_farms()
    farm_dicts.append(dataclasses.asdict(new_farm))
    storage.save_farms(farm_dicts)

    assignments = storage.load_assignments()
    assignments[str(new_id)] = assigned
    storage.save_assignments(assignments)

    # Build response — one BundleResponse per assigned crop
    sqft_per = round(new_farm.plot_size_sqft / num_slots, 1)
    bundles  = []
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
            reason=(
                f"Suitability {suitability:.0%} for {crop.name} — "
                f"soil pH {new_farm.pH:.1f} "
                f"(optimal {crop.optimal_pH[0]}–{crop.optimal_pH[1]}), "
                f"network gap {gap_pct:.0f}% unfilled"
            ),
        ))
    return bundles


@router.patch('/nodes/{farm_id}/data')
def update_soil(farm_id: int, req: models.SoilUpdateRequest):
    farm_dicts = storage.load_farms()
    for d in farm_dicts:
        if d['id'] == farm_id:
            d['pH']          = req.pH
            d['moisture']    = req.moisture
            d['temperature'] = req.temperature
            d['humidity']    = req.humidity
            storage.save_farms(farm_dicts)
            return {'status': 'ok', 'farm_id': farm_id}
    raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')


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
        # Fall back to locked farm's current_crop_ids
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
            reason=(
                f"Suitability {suitability:.0%} for {crop.name} — "
                f"soil pH {farm.pH:.1f} (optimal {crop.optimal_pH[0]}–{crop.optimal_pH[1]})"
            ),
        ))
    return bundles
