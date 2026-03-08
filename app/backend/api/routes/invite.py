import secrets
import dataclasses
from datetime import date

from fastapi import APIRouter, HTTPException

from app.backend.api import storage, models
from app.backend.engine.schemas import FarmNode
from app.backend.engine.scorer import build_yield_matrix
from app.backend.engine.router import build_reachability_matrix, compute_hub_routing
from app.backend.api.routes.nodes import _greedy_assign, _now

router = APIRouter()


@router.post('/invite/generate', response_model=models.InviteGenerateResponse)
def generate_invite():
    """Create a one-time invite token an admin can send to a new farmer."""
    token  = secrets.token_urlsafe(24)
    tokens = storage.load_invite_tokens()
    tokens[token] = {'used': False}
    storage.save_invite_tokens(tokens)
    return models.InviteGenerateResponse(token=token)


@router.post('/invite/claim', response_model=models.ClaimInviteResponse)
def claim_invite(req: models.ClaimInviteRequest):
    """Validate an invite token and register a new farm node in one step."""
    tokens = storage.load_invite_tokens()
    entry  = tokens.get(req.token)

    if not entry:
        raise HTTPException(status_code=401, detail='Invalid invite token')
    if entry.get('used'):
        raise HTTPException(status_code=410, detail='Invite token already used')

    farms, crops, hubs, config = storage.load_engine_state()
    new_id   = max((f.id for f in farms), default=-1) + 1
    today    = date.today()
    now_str  = _now()

    new_farm = FarmNode(
        id=new_id, name=req.name,
        lat=req.lat, lng=req.lng,
        plot_size_sqft=req.plot_size_sqft,
        plot_type=req.plot_type,
        tools=req.tools, budget=req.budget,
        pH=req.pH, moisture=req.moisture,
        temperature=req.temperature, humidity=req.humidity,
        sunlight_hours=req.sunlight_hours,
        status='new',
        preferred_crop_ids=req.preferred_crop_ids,
        max_delivery_distance_m=req.max_delivery_distance_m,
        cycle_start_date=today,
        cycle_number=1,
        joined_at=now_str,
    )

    assigned, _, _, _ = _greedy_assign(new_farm, farms, crops, hubs, config,
                                       build_yield_matrix(farms, crops),
                                       build_reachability_matrix(farms, hubs, config.max_travel_distance))

    farm_dicts = storage.load_farms()
    farm_dicts.append(dataclasses.asdict(new_farm))
    storage.save_farms(farm_dicts)

    assignments = storage.load_assignments()
    assignments[str(new_id)] = list(dict.fromkeys(assigned))
    storage.save_assignments(assignments)

    all_farms, _, all_hubs, all_config = storage.load_engine_state()
    routing = compute_hub_routing(all_farms, all_hubs, all_config.max_travel_distance)
    storage.save_hub_routing(routing)

    # Issue a node key for the new farm
    node_key = secrets.token_urlsafe(32)
    node_keys = storage.load_node_keys()
    node_keys[str(new_id)] = node_key
    storage.save_node_keys(node_keys)

    # Mark token as used
    tokens[req.token]['used'] = True
    storage.save_invite_tokens(tokens)

    return models.ClaimInviteResponse(farm_id=new_id, farm_name=req.name, key=node_key)
