from fastapi import APIRouter, Query
from typing import Optional

from app.api import storage, models

router = APIRouter()


@router.get('/ledger', response_model=list[models.LedgerEntryResponse])
def get_ledger(node_id: Optional[int] = Query(None)):
    entries = storage.load_ledger()
    if node_id is not None:
        entries = [e for e in entries if e['node_id'] == node_id]
    return sorted(entries, key=lambda e: e['created_at'], reverse=True)
