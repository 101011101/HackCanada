from fastapi import APIRouter

from app.backend.api import storage
from app.backend.engine import transaction_engine

router = APIRouter()


@router.post('/engine/run')
def run_engine():
    """Manually trigger a full transaction engine run."""
    farms, crops, hubs, config = storage.load_engine_state()
    transaction_engine.run(farms, hubs, crops, config)
    return {'status': 'ok', 'message': 'Engine run complete.'}
