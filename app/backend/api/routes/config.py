from fastapi import APIRouter, HTTPException

from app.backend.api import storage, models

router = APIRouter()


@router.get('/config')
def get_config():
    """Current NetworkConfig."""
    return storage.load_config()


@router.put('/config')
def update_config(req: models.ConfigUpdateRequest):
    """Update any NetworkConfig fields. Merges into existing config."""
    cfg = storage.load_config()
    if req.max_travel_distance is not None:
        cfg['max_travel_distance'] = req.max_travel_distance
    if req.food_targets is not None:
        # Merge — caller sends {str(crop_id): kg}
        cfg['food_targets'].update({str(k): v for k, v in req.food_targets.items()})
    if req.epoch_weeks is not None:
        cfg['epoch_weeks'] = req.epoch_weeks
    if req.inertia_weight is not None:
        cfg['inertia_weight'] = req.inertia_weight
    if req.overproduction_buffer is not None:
        cfg['overproduction_buffer'] = req.overproduction_buffer
    if req.preference_weight is not None:
        cfg['preference_weight'] = req.preference_weight
    if req.min_slot_sqft is not None:
        cfg['min_slot_sqft'] = req.min_slot_sqft
    storage.save_config(cfg)
    return {'status': 'ok'}


@router.put('/hubs/{hub_id}')
def update_hub(hub_id: int, req: models.HubUpdateRequest):
    """Update a hub's local_demand, capacity_kg, and/or priority."""
    hubs = storage.load_hubs()
    for hub in hubs:
        if hub['id'] == hub_id:
            if req.local_demand is not None:
                hub['local_demand'] = {str(k): v for k, v in req.local_demand.items()}
            if req.capacity_kg is not None:
                hub['capacity_kg'] = req.capacity_kg
            if req.priority is not None:
                hub['priority'] = req.priority
            storage.save_hubs(hubs)
            return {'status': 'ok', 'hub_id': hub_id}
    raise HTTPException(status_code=404, detail=f'Hub {hub_id} not found')
