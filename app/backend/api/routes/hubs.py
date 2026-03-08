from fastapi import APIRouter, HTTPException

from app.backend.api import storage, models

router = APIRouter()


@router.get('/hubs')
def get_hubs():
    """All hub nodes with location + capacity."""
    return storage.load_hubs()


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
