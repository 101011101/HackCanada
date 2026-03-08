from fastapi import APIRouter, HTTPException

from app.backend.api import storage, models
from app.backend.engine.data import CROP_TASKS

router = APIRouter()


@router.get('/hubs')
def get_hubs():
    """All hub nodes with location + capacity."""
    return storage.load_hubs()


@router.get('/farms')
def get_farms():
    """All farms (nodes) for admin lookups — id, name, etc."""
    return storage.load_farms()


@router.get('/crops')
def get_crops():
    """All crop definitions (id, name, grow_weeks, color, etc.)."""
    return storage.load_crops()


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
