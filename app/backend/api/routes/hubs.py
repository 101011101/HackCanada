import secrets
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.backend.api import storage, models
from app.backend.engine.data import CROP_TASKS
from app.backend.engine.router import compute_hub_routing

router = APIRouter()


@router.get('/farms')
def get_farms():
    """All farm nodes with coordinates and soil data."""
    return storage.load_farms()


@router.get('/hubs')
def get_hubs():
    """All hub nodes with location + capacity."""
    return storage.load_hubs()


@router.get('/crops')
def get_crops():
    """All crop definitions (id, name, grow_weeks, color, etc.)."""
    return storage.load_crops()


@router.get('/hubs/routing')
def get_hub_routing():
    """Stored hub routing: {farm_id: [hub_id, ...]} for all farms."""
    return storage.load_hub_routing()


@router.post('/hubs/routing/compute')
def compute_routing():
    """Recompute hub routing from current farm/hub state and persist to hub_routing.json."""
    farms, _, hubs, config = storage.load_engine_state()
    routing = compute_hub_routing(farms, hubs, config.max_travel_distance)
    storage.save_hub_routing(routing)
    return routing


@router.get('/hubs/{hub_id}/inventory', response_model=models.HubInventoryResponse)
def get_hub_inventory(hub_id: int):
    hubs = storage.load_hubs()
    hub  = next((h for h in hubs if h['id'] == hub_id), None)
    if not hub:
        raise HTTPException(status_code=404, detail=f'Hub {hub_id} not found')

    crops     = storage.load_crops()
    crop_map  = {c['id']: c['name'] for c in crops}
    inventory = storage.load_hub_inventory()

    items = [
        models.HubInventoryItemResponse(
            crop_id     = e['crop_id'],
            crop_name   = crop_map.get(e['crop_id'], str(e['crop_id'])),
            quantity_kg = e['quantity_kg'],
        )
        for e in inventory if e['hub_id'] == hub_id
    ]
    total_kg = round(sum(i.quantity_kg for i in items), 4)

    return models.HubInventoryResponse(
        hub_id      = hub_id,
        inventory   = items,
        total_kg    = total_kg,
        capacity_kg = hub['capacity_kg'],
    )


@router.post('/hubs', status_code=201)
def create_hub(body: models.NewHubRequest):
    """Create a new distribution hub."""
    hubs = storage.load_hubs()
    new_id = max((h['id'] for h in hubs), default=-1) + 1
    new_hub = {
        'id':           new_id,
        'name':         body.name,
        'lat':          body.lat,
        'lng':          body.lng,
        'priority':     body.priority,
        'capacity_kg':  body.capacity_kg,
        'local_demand': {str(k): v for k, v in body.local_demand.items()},
    }
    hubs.append(new_hub)
    storage.save_hubs(hubs)

    crops     = storage.load_crops()
    inventory = storage.load_hub_inventory()
    now       = datetime.utcnow().isoformat()
    for crop in crops:
        inventory.append({'hub_id': new_id, 'crop_id': crop['id'], 'quantity_kg': 0.0, 'last_updated': now})
    storage.save_hub_inventory(inventory)

    farms, _, hub_nodes, config = storage.load_engine_state()
    routing = compute_hub_routing(farms, hub_nodes, config.max_travel_distance)
    storage.save_hub_routing(routing)

    return new_hub


@router.delete('/hubs/{hub_id}')
def delete_hub(hub_id: int):
    """Delete a distribution hub and recompute routing."""
    hubs = storage.load_hubs()
    hub  = next((h for h in hubs if h['id'] == hub_id), None)
    if not hub:
        raise HTTPException(status_code=404, detail=f'Hub {hub_id} not found')
    hubs = [h for h in hubs if h['id'] != hub_id]
    storage.save_hubs(hubs)

    inventory = [e for e in storage.load_hub_inventory() if e['hub_id'] != hub_id]
    storage.save_hub_inventory(inventory)

    farms, _, hub_nodes, config = storage.load_engine_state()
    routing = compute_hub_routing(farms, hub_nodes, config.max_travel_distance)
    storage.save_hub_routing(routing)

    return {'status': 'deleted', 'hub_id': hub_id}


@router.get('/hubs/keys')
def get_hub_keys():
    """Return all hub keys (admin use)."""
    return storage.load_keys()


@router.post('/hubs/{hub_id}/key/generate', response_model=models.HubKeyResponse)
def generate_hub_key(hub_id: int):
    """Generate (or regenerate) the access key for a hub."""
    hubs = storage.load_hubs()
    hub  = next((h for h in hubs if h['id'] == hub_id), None)
    if not hub:
        raise HTTPException(status_code=404, detail=f'Hub {hub_id} not found')
    keys    = storage.load_keys()
    new_key = secrets.token_urlsafe(12)
    keys[str(hub_id)] = new_key
    storage.save_keys(keys)
    return models.HubKeyResponse(hub_id=hub_id, key=new_key)


@router.post('/auth/hub', response_model=models.HubAuthResponse)
def auth_hub(body: models.HubAuthRequest):
    """Validate a hub key and return the associated hub's id and name."""
    keys       = storage.load_keys()
    hub_id_str = next((hid for hid, k in keys.items() if k == body.key), None)
    if hub_id_str is None:
        raise HTTPException(status_code=401, detail='Invalid hub key')
    hub_id = int(hub_id_str)
    hubs   = storage.load_hubs()
    hub    = next((h for h in hubs if h['id'] == hub_id), None)
    if not hub:
        raise HTTPException(status_code=404, detail='Hub not found')
    return models.HubAuthResponse(hub_id=hub_id, hub_name=hub['name'])


@router.get('/crops/{crop_id}/tasks', response_model=list[models.TaskItem])
def get_crop_tasks(crop_id: int):
    tasks = CROP_TASKS.get(crop_id)
    if tasks is None:
        raise HTTPException(status_code=404, detail=f'No tasks found for crop {crop_id}')
    crops     = storage.load_crops()
    crop_dict = next((c for c in crops if c['id'] == crop_id), None)
    crop_name = crop_dict['name'] if crop_dict else str(crop_id)
    return [
        models.TaskItem(
            id             = t['id'],
            crop_id        = crop_id,
            crop_name      = crop_name,
            title          = t['title'],
            subtitle       = t['subtitle'],
            why            = t['why'],
            how            = t['how'],
            target         = t['target'],
            tools_required = t['tools_required'],
            day_from_start = t['day_from_start'],
        )
        for t in tasks
    ]
