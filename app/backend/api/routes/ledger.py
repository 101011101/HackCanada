from fastapi import APIRouter, Query
from typing import Optional

from app.backend.api import storage, models

router = APIRouter()


@router.get('/ledger', response_model=list[models.LedgerEntryResponse])
def get_ledger(
    node_id: Optional[int] = Query(None),
    hub_id:  Optional[int] = Query(None),
):
    entries = storage.load_ledger()
    if node_id is not None:
        entries = [e for e in entries if e['node_id'] == node_id]
    if hub_id is not None:
        requests = {r['id']: r for r in storage.load_requests()}
        entries = [e for e in entries if requests.get(e['request_id'], {}).get('hub_id') == hub_id]
    return sorted(entries, key=lambda e: e['created_at'], reverse=True)
