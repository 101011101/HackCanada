from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.backend.api import storage, models
from app.backend.engine import transaction_engine

router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat(timespec='seconds')


def _next_id(records: list[dict]) -> int:
    return max((r['id'] for r in records), default=0) + 1


# ---------------------------------------------------------------------------
# POST /requests — submit a give or receive request
# ---------------------------------------------------------------------------

@router.post('/requests', response_model=models.RequestResponse)
def submit_request(body: models.RequestBody):
    if body.type not in ('give', 'receive'):
        raise HTTPException(status_code=422, detail="type must be 'give' or 'receive'")
    if body.quantity_kg <= 0:
        raise HTTPException(status_code=422, detail='quantity_kg must be > 0')

    hubs  = storage.load_hubs()
    crops = storage.load_crops()

    if body.hub_id is not None and not any(h['id'] == body.hub_id for h in hubs):
        raise HTTPException(status_code=404, detail=f'Hub {body.hub_id} not found')
    if not any(c['id'] == body.crop_id for c in crops):
        raise HTTPException(status_code=404, detail=f'Crop {body.crop_id} not found')

    if body.type == 'receive':
        farms = storage.load_farms()
        farm  = next((f for f in farms if f['id'] == body.node_id), None)
        if not farm:
            raise HTTPException(status_code=404, detail=f'Node {body.node_id} not found')
        rates = storage.load_current_rates()
        rate  = rates.get(str(body.crop_id), 1.0)
        cost  = body.quantity_kg * rate
        if farm.get('currency_balance', 0.0) < cost:
            raise HTTPException(
                status_code=422,
                detail=f'Insufficient balance. Cost: {cost:.2f}, balance: {farm.get("currency_balance", 0.0):.2f}'
            )

    requests = storage.load_requests()
    new_request = {
        'id':           _next_id(requests),
        'type':         body.type,
        'node_id':      body.node_id,
        'hub_id':       body.hub_id,
        'crop_id':      body.crop_id,
        'quantity_kg':  body.quantity_kg,
        'status':       'pending',
        'hub_options':  [],
        'created_at':   _now(),
        'matched_at':   None,
        'confirmed_at': None,
    }
    requests.append(new_request)
    storage.save_requests(requests)
    return new_request


# ---------------------------------------------------------------------------
# GET /requests — list with optional filters
# ---------------------------------------------------------------------------

@router.get('/requests', response_model=list[models.RequestResponse])
def list_requests(
    node_id: Optional[int] = Query(None),
    hub_id:  Optional[int] = Query(None),
    status:  Optional[str] = Query(None),
    type:    Optional[str] = Query(None),
):
    results = storage.load_requests()
    if node_id is not None:
        results = [r for r in results if r['node_id'] == node_id]
    if hub_id is not None:
        results = [r for r in results if r['hub_id'] == hub_id]
    if status is not None:
        results = [r for r in results if r['status'] == status]
    if type is not None:
        results = [r for r in results if r['type'] == type]
    return results


# ---------------------------------------------------------------------------
# GET /requests/{request_id}
# ---------------------------------------------------------------------------

@router.get('/requests/{request_id}', response_model=models.RequestResponse)
def get_request(request_id: int):
    requests = storage.load_requests()
    req = next((r for r in requests if r['id'] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail=f'Request {request_id} not found')
    return req


# ---------------------------------------------------------------------------
# DELETE /requests/{request_id} — cancel
# ---------------------------------------------------------------------------

@router.delete('/requests/{request_id}')
def cancel_request(request_id: int):
    requests = storage.load_requests()
    req = next((r for r in requests if r['id'] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail=f'Request {request_id} not found')
    if req['status'] not in ('pending', 'options_ready', 'matched'):
        raise HTTPException(status_code=400, detail=f"Cannot cancel request with status '{req['status']}'")
    req['status'] = 'cancelled'
    storage.save_requests(requests)
    return {'status': 'cancelled', 'request_id': request_id}


# ---------------------------------------------------------------------------
# POST /requests/{request_id}/confirm — hub confirms physical exchange
# ---------------------------------------------------------------------------

@router.post('/requests/{request_id}/confirm', response_model=models.ConfirmResponse)
def confirm_request(request_id: int, body: models.ConfirmBody):
    if body.actual_quantity_kg <= 0:
        raise HTTPException(status_code=422, detail='actual_quantity_kg must be > 0')

    requests = storage.load_requests()
    req = next((r for r in requests if r['id'] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail=f'Request {request_id} not found')
    if req['status'] in ('confirmed', 'cancelled'):
        raise HTTPException(status_code=400, detail=f"Request already {req['status']}")

    rates         = storage.load_current_rates()
    rate          = rates.get(str(req['crop_id']), 1.0)
    currency_delta = round(body.actual_quantity_kg * rate, 4)

    # Update hub inventory
    inventory = storage.load_hub_inventory()
    entry = next(
        (e for e in inventory if e['hub_id'] == req['hub_id'] and e['crop_id'] == req['crop_id']),
        None
    )
    if entry is None:
        entry = {'hub_id': req['hub_id'], 'crop_id': req['crop_id'], 'quantity_kg': 0.0, 'last_updated': _now()}
        inventory.append(entry)

    if req['type'] == 'give':
        entry['quantity_kg'] = round(entry['quantity_kg'] + body.actual_quantity_kg, 4)
    else:
        entry['quantity_kg'] = round(max(0.0, entry['quantity_kg'] - body.actual_quantity_kg), 4)
    entry['last_updated'] = _now()
    storage.save_hub_inventory(inventory)

    # Update node currency balance
    farms = storage.load_farms()
    farm  = next((f for f in farms if f['id'] == req['node_id']), None)
    if not farm:
        raise HTTPException(status_code=404, detail=f"Node {req['node_id']} not found")

    if req['type'] == 'give':
        farm['currency_balance'] = round(farm.get('currency_balance', 0.0) + currency_delta, 4)
        # Decrement crops_on_hand if present
        crops_on_hand = farm.get('crops_on_hand', {})
        key = str(req['crop_id'])
        if key in crops_on_hand:
            crops_on_hand[key] = round(max(0.0, crops_on_hand[key] - body.actual_quantity_kg), 4)
        farm['crops_on_hand'] = crops_on_hand
    else:
        farm['currency_balance'] = round(max(0.0, farm.get('currency_balance', 0.0) - currency_delta), 4)

    balance_after = farm['currency_balance']
    storage.save_farms(farms)

    # Append ledger entry
    ledger = storage.load_ledger()
    ledger.append({
        'id':            _next_id(ledger),
        'type':          'credit' if req['type'] == 'give' else 'debit',
        'node_id':       req['node_id'],
        'request_id':    request_id,
        'amount':        currency_delta,
        'balance_after': balance_after,
        'created_at':    _now(),
        'note':          f"{'Deposit' if req['type'] == 'give' else 'Withdrawal'} "
                         f"{body.actual_quantity_kg}kg crop#{req['crop_id']} at hub#{req['hub_id']}",
    })
    storage.save_ledger(ledger)

    # Mark request confirmed
    req['status']       = 'confirmed'
    req['confirmed_at'] = _now()
    storage.save_requests(requests)

    # Trigger engine — confirmation may unblock pending requests
    farms_obj, crops_obj, hubs_obj, config_obj = storage.load_engine_state()
    transaction_engine.run(farms_obj, hubs_obj, crops_obj, config_obj)

    return models.ConfirmResponse(
        status='confirmed',
        currency_delta=currency_delta,
        node_balance_after=balance_after,
        hub_inventory_after=entry['quantity_kg'],
    )


# ---------------------------------------------------------------------------
# POST /requests/{request_id}/select-hub — node picks a hub from hub_options
# ---------------------------------------------------------------------------

@router.post('/requests/{request_id}/select-hub', response_model=models.SelectHubResponse)
def select_hub(request_id: int, body: models.SelectHubBody):
    requests = storage.load_requests()
    req = next((r for r in requests if r['id'] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail=f'Request {request_id} not found')
    if req['status'] != 'options_ready':
        raise HTTPException(status_code=400, detail="Request must be in 'options_ready' status")

    hub_options = req.get('hub_options', [])
    if not any(opt['hub_id'] == body.hub_id for opt in hub_options):
        raise HTTPException(status_code=400, detail=f'Hub {body.hub_id} is not in hub_options for this request')

    # Re-check hard constraints at selection time
    hubs_raw  = storage.load_hubs()
    hub_dict  = next((h for h in hubs_raw if h['id'] == body.hub_id), None)
    if not hub_dict:
        raise HTTPException(status_code=404, detail=f'Hub {body.hub_id} not found')
    hub = storage.dict_to_hub(hub_dict)

    inventory = storage.load_hub_inventory()
    inv = {}
    for e in inventory:
        inv.setdefault(e['hub_id'], {})[e['crop_id']] = e['quantity_kg']

    hub_total     = sum(inv.get(hub.id, {}).values())
    cap_remaining = hub.capacity_kg - hub_total
    hub_inv_crop  = inv.get(hub.id, {}).get(req['crop_id'], 0.0)

    if req['type'] == 'give':
        if cap_remaining < req['quantity_kg']:
            raise HTTPException(status_code=400, detail='Hub no longer has capacity for this request')
    else:
        rates = storage.load_current_rates()
        rate  = rates.get(str(req['crop_id']), 1.0)
        cost  = req['quantity_kg'] * float(rate)
        if hub_inv_crop < req['quantity_kg']:
            raise HTTPException(status_code=400, detail='Hub no longer has sufficient stock')
        farms = storage.load_farms()
        farm  = next((f for f in farms if f['id'] == req['node_id']), None)
        balance = farm.get('currency_balance', 0.0) if farm else 0.0
        if balance < cost:
            raise HTTPException(status_code=400, detail=f'Insufficient balance. Cost: {cost:.2f}, balance: {balance:.2f}')

    req['hub_id']     = body.hub_id
    req['status']     = 'matched'
    req['matched_at'] = _now()
    storage.save_requests(requests)

    return models.SelectHubResponse(
        status='matched',
        hub_id=body.hub_id,
        message=f'Hub selected. Proceed to Hub #{body.hub_id} for exchange.',
    )
