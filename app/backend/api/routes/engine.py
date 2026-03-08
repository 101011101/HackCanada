from fastapi import APIRouter

from app.backend.api import storage
from app.backend.engine import transaction_engine
from app.backend.engine.router import compute_hub_routing

router = APIRouter()


@router.post('/engine/run')
def run_engine():
    """Manually trigger a full transaction engine run."""
    farms, crops, hubs, config = storage.load_engine_state()
    transaction_engine.run(farms, hubs, crops, config)
    # Recompute hub routing after engine mutates farm states
    farms_updated, _, hubs_updated, _ = storage.load_engine_state()
    routing = compute_hub_routing(farms_updated, hubs_updated, config.max_travel_distance)
    storage.save_hub_routing(routing)
    return {'status': 'ok', 'message': 'Engine run complete.'}
