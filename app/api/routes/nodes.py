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


@router.post('/nodes', response_model=models.BundleResponse)
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
    existing_assignments = {int(k): v for k, v in storage.load_assignments().items()}
    current_hub_supply   = locked_hub_supply.copy()
    for i in available:
        crop_id = existing_assignments.get(farms[i].id)
        if crop_id is not None:
            for h in range(H):
                if reachability_matrix[i][h]:
                    current_hub_supply[h][crop_id] += yield_matrix[i][crop_id]

    # Yield row and reachability row for the new farm
    new_yield_row = np.array([
        compute_suitability(new_farm, crop) * crop.base_yield_per_sqft * new_farm.plot_size_sqft
        for crop in crops
    ], dtype=float)
    new_reach_row = np.array([
        haversine(new_farm.lat, new_farm.lng, hub.lat, hub.lng) <= config.max_travel_distance
        for hub in hubs
    ], dtype=bool)

    # Greedy assignment
    crop_idx      = greedy_insert(new_yield_row, new_reach_row, crops, hubs,
                                  gap_vector, current_hub_supply)
    assigned_crop = crops[crop_idx]
    suitability   = compute_suitability(new_farm, assigned_crop)
    qty_kg        = round(float(new_yield_row[crop_idx]), 1)
    target        = config.food_targets.get(crop_idx, 0)
    gap_pct       = max(0.0, gap_vector[crop_idx] / target * 100) if target > 0 else 0.0

    # Persist
    farm_dicts = storage.load_farms()
    farm_dicts.append(dataclasses.asdict(new_farm))
    storage.save_farms(farm_dicts)

    assignments = storage.load_assignments()
    assignments[str(new_id)] = crop_idx
    storage.save_assignments(assignments)

    return models.BundleResponse(
        farm_id=new_id,
        farm_name=new_farm.name,
        crop_id=assigned_crop.id,
        crop_name=assigned_crop.name,
        quantity_kg=qty_kg,
        grow_weeks=assigned_crop.grow_weeks,
        reason=(
            f"Suitability {suitability:.0%} for {assigned_crop.name} — "
            f"soil pH {new_farm.pH:.1f} "
            f"(optimal {assigned_crop.optimal_pH[0]}–{assigned_crop.optimal_pH[1]}), "
            f"network gap {gap_pct:.0f}% unfilled"
        ),
    )


@router.post('/nodes/{farm_id}/data')
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


@router.get('/nodes/{farm_id}', response_model=models.BundleResponse)
def get_node(farm_id: int):
    farm_dicts  = storage.load_farms()
    crop_dicts  = storage.load_crops()
    assignments = storage.load_assignments()

    farm_dict = next((d for d in farm_dicts if d['id'] == farm_id), None)
    if not farm_dict:
        raise HTTPException(status_code=404, detail=f'Farm {farm_id} not found')

    farm    = storage.dict_to_farmnode(farm_dict)
    crop_id = assignments.get(str(farm_id))

    if crop_id is None:
        # Fall back to locked farm's current crop
        if farm.current_crop_id is not None:
            crop_id = farm.current_crop_id
        else:
            raise HTTPException(status_code=404,
                                detail=f'No assignment for farm {farm_id} — run /optimize first')

    crop_dict = next((d for d in crop_dicts if d['id'] == crop_id), None)
    if not crop_dict:
        raise HTTPException(status_code=404, detail=f'Crop {crop_id} not found')

    crop        = storage.dict_to_crop(crop_dict)
    suitability = compute_suitability(farm, crop)
    qty_kg      = round(suitability * crop.base_yield_per_sqft * farm.plot_size_sqft, 1)

    return models.BundleResponse(
        farm_id=farm.id,
        farm_name=farm.name,
        crop_id=crop.id,
        crop_name=crop.name,
        quantity_kg=qty_kg,
        grow_weeks=crop.grow_weeks,
        reason=(
            f"Suitability {suitability:.0%} for {crop.name} — "
            f"soil pH {farm.pH:.1f} (optimal {crop.optimal_pH[0]}–{crop.optimal_pH[1]})"
        ),
    )
