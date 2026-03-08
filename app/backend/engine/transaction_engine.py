"""
Transaction engine — matching and pricing.

Called by: cron job (every 15 min) and after every hub confirmation.
Writes to: requests.json, current_rates.json
Never writes to: hub_inventory.json, ledger.json
"""
from app.backend.api.storage import (
    load_requests, save_requests,
    load_hub_inventory,
    load_current_rates, save_current_rates,
)
from app.backend.engine.router import haversine


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_inv(inventory: list[dict]) -> dict:
    """Returns {hub_id: {crop_id: quantity_kg}}."""
    inv = {}
    for e in inventory:
        inv.setdefault(e['hub_id'], {})[e['crop_id']] = e['quantity_kg']
    return inv


def _hub_total(hub_id: int, inv: dict) -> float:
    return sum(inv.get(hub_id, {}).values())


def _hard_constraints(req: dict, hub, inv: dict, farm_map: dict, rates: dict) -> bool:
    """Returns True if hub can satisfy req right now."""
    capacity_remaining = hub.capacity_kg - _hub_total(hub.id, inv)
    hub_inv_crop = inv.get(hub.id, {}).get(req['crop_id'], 0.0)

    if req['type'] == 'give':
        return capacity_remaining >= req['quantity_kg']
    else:
        node = farm_map.get(req['node_id'])
        if node is None:
            return False
        rate = rates.get(str(req['crop_id']), 1.0)
        cost = req['quantity_kg'] * float(rate)
        return hub_inv_crop >= req['quantity_kg'] and node.currency_balance >= cost


def _fit_score(req: dict, hub, inv: dict) -> float:
    """Compute how well this hub fits this request (higher = better)."""
    hub_inv_crop = inv.get(hub.id, {}).get(req['crop_id'], 0.0)
    capacity_remaining = max(hub.capacity_kg - _hub_total(hub.id, inv), 0.01)

    if req['type'] == 'give':
        demand = hub.local_demand.get(req['crop_id'], 0.0)
        demand_gap = max(demand - hub_inv_crop, 0.0)
        return demand_gap / capacity_remaining
    else:
        demand = max(hub.local_demand.get(req['crop_id'], 0.0), 0.01)
        return hub_inv_crop / demand


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def run(farms: list, hubs: list, crops: list, config) -> None:
    requests  = load_requests()
    inventory = load_hub_inventory()
    rates     = load_current_rates()

    inv      = _build_inv(inventory)
    farm_map = {f.id: f for f in farms}
    hub_map  = {h.id: h for h in hubs}

    # ------------------------------------------------------------------
    # Stale check: re-validate matched and options_ready requests
    # ------------------------------------------------------------------
    for req in requests:
        if req['status'] == 'matched':
            hub = hub_map.get(req.get('hub_id'))
            if hub is None or not _hard_constraints(req, hub, inv, farm_map, rates):
                req['status']      = 'pending'
                req['hub_id']      = None
                req['hub_options'] = []

        elif req['status'] == 'options_ready':
            still_valid = [
                opt for opt in req.get('hub_options', [])
                if opt['hub_id'] in hub_map
                and _hard_constraints(req, hub_map[opt['hub_id']], inv, farm_map, rates)
            ]
            if not still_valid:
                req['status']      = 'pending'
                req['hub_options'] = []

    # ------------------------------------------------------------------
    # Match pending requests → options_ready
    # Sort by viable hub count ascending: most constrained requests first
    # ------------------------------------------------------------------
    def _viable_count(req: dict) -> int:
        node = farm_map.get(req['node_id'])
        if node is None:
            return 0
        return sum(
            1 for hub in hubs
            if haversine(node.lat, node.lng, hub.lat, hub.lng) <= config.max_travel_distance
            and _hard_constraints(req, hub, inv, farm_map, rates)
        )

    pending = sorted(
        [r for r in requests if r['status'] == 'pending'],
        key=_viable_count
    )

    for req in pending:
        node = farm_map.get(req['node_id'])
        if node is None:
            continue

        candidates = []
        for hub in hubs:
            dist_m = haversine(node.lat, node.lng, hub.lat, hub.lng)
            if dist_m > config.max_travel_distance:
                continue
            if not _hard_constraints(req, hub, inv, farm_map, rates):
                continue

            dist_km      = dist_m / 1000.0
            fit          = _fit_score(req, hub, inv)
            dist_score   = 1.0 / max(dist_km, 0.1)
            score        = fit * dist_score
            candidates.append({
                'hub_id':      hub.id,
                'distance_km': round(dist_km, 2),
                'score':       round(score, 4),
            })

        if candidates:
            top3 = sorted(candidates, key=lambda x: x['score'], reverse=True)[:3]
            req['hub_options'] = top3
            req['status']      = 'options_ready'
        else:
            # Allow nearest hub that still passes constraints so select-hub can succeed
            in_range = []
            for hub in hubs:
                dist_m = haversine(node.lat, node.lng, hub.lat, hub.lng)
                if dist_m > config.max_travel_distance:
                    continue
                if not _hard_constraints(req, hub, inv, farm_map, rates):
                    continue
                dist_km = dist_m / 1000.0
                in_range.append({'hub_id': hub.id, 'distance_km': round(dist_km, 2), 'score': 0.0})
            if in_range:
                nearest_one = sorted(in_range, key=lambda x: x['distance_km'])[:1]
                req['hub_options'] = nearest_one
                req['status']      = 'options_ready'

    save_requests(requests)

    # ------------------------------------------------------------------
    # Pricing — recalculate current_rate per crop
    # ------------------------------------------------------------------
    new_rates = {}
    for crop in crops:
        net_supply = sum(inv.get(h.id, {}).get(crop.id, 0.0) for h in hubs)
        target     = config.food_targets.get(crop.id, 0.0)
        scarcity   = target / max(net_supply, 0.01)
        scarcity   = max(0.25, min(4.0, scarcity))
        new_rates[str(crop.id)] = round(crop.base_currency_rate * scarcity, 4)

    save_current_rates(new_rates)
