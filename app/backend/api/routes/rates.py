from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.backend.api import storage

router = APIRouter()


@router.get('/rates')
def get_rates():
    """Return current exchange rate for every crop."""
    rates = storage.load_current_rates()
    crops = storage.load_crops()
    crop_names = {c['id']: c['name'] for c in crops}
    return [
        {
            'crop_id':   int(crop_id),
            'crop_name': crop_names.get(int(crop_id), f'Crop #{crop_id}'),
            'rate':      rate,
        }
        for crop_id, rate in rates.items()
    ]


@router.get('/rates/cost')
def get_cost(
    crop_id:     int   = Query(...),
    quantity_kg: float = Query(...),
    action:      str   = Query('receive'),  # 'give' | 'receive'
):
    """Calculate currency earn (give) or cost (receive) for a crop and quantity."""
    if quantity_kg <= 0:
        raise HTTPException(status_code=422, detail='quantity_kg must be > 0')
    if action not in ('give', 'receive'):
        raise HTTPException(status_code=422, detail="action must be 'give' or 'receive'")

    crops = storage.load_crops()
    if not any(c['id'] == crop_id for c in crops):
        raise HTTPException(status_code=404, detail=f'Crop {crop_id} not found')

    rates  = storage.load_current_rates()
    rate   = rates.get(str(crop_id), 1.0)
    amount = round(quantity_kg * float(rate), 4)

    result = {
        'crop_id':     crop_id,
        'quantity_kg': quantity_kg,
        'action':      action,
        'rate':        rate,
    }
    if action == 'give':
        result['earn'] = amount
    else:
        result['cost'] = amount
    return result
