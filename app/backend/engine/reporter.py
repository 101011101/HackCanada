import numpy as np
from .schemas import FarmNode, Crop, HubNode, NetworkConfig


def generate_report(farms: list,
                    locked_indices: list,
                    available_indices: list,
                    assignment: list,
                    crops: list,
                    hubs: list,
                    yield_matrix: np.ndarray,
                    reachability_matrix: np.ndarray,
                    config: NetworkConfig) -> dict:
    """
    Returns a dict summarising network state after optimization:
      - total_yield_kg
      - coverage_by_crop  {crop_name: {target_kg, supplied_kg, gap_pct, met}}
      - hub_coverage       {hub_name: {crop_name: {demand_kg, supplied_kg, met}}}
      - farms_assigned, farms_locked, network_health_pct

    assignment — list of lists: assignment[idx] = [crop_id, ...] for available_indices[idx]
    Yield is split equally across crops when a farm grows multiple.
    """
    M = len(crops)
    H = len(hubs)

    # Total supply per crop (locked + newly assigned)
    supply = np.zeros(M, dtype=float)
    for i in locked_indices:
        crop_ids = farms[i].current_crop_ids
        if not crop_ids:
            continue
        n = len(crop_ids)
        for c in crop_ids:
            supply[c] += yield_matrix[i][c] / n
    for idx, farm_i in enumerate(available_indices):
        crop_ids = assignment[idx]
        n = len(crop_ids)
        for c in crop_ids:
            supply[c] += yield_matrix[farm_i][c] / n

    # Coverage by crop
    coverage_by_crop = {}
    for c, crop in enumerate(crops):
        target   = config.food_targets.get(c, 0.0)
        supplied = supply[c]
        gap_pct  = max(0.0, (target - supplied) / target * 100) if target > 0 else 0.0
        coverage_by_crop[crop.name] = {
            'target_kg':  round(target,   1),
            'supplied_kg': round(supplied, 1),
            'gap_pct':    round(gap_pct,  1),
            'surplus_kg': round(max(0.0, supplied - target), 1),
            'met':        supplied >= target,
        }

    # Hub supply per (hub, crop)
    hub_supply = np.zeros((H, M), dtype=float)
    for i in locked_indices:
        crop_ids = farms[i].current_crop_ids
        if not crop_ids:
            continue
        n = len(crop_ids)
        for c in crop_ids:
            for h in range(H):
                if reachability_matrix[i][h]:
                    hub_supply[h][c] += yield_matrix[i][c] / n
    for idx, farm_i in enumerate(available_indices):
        crop_ids = assignment[idx]
        n = len(crop_ids)
        for c in crop_ids:
            for h in range(H):
                if reachability_matrix[farm_i][h]:
                    hub_supply[h][c] += yield_matrix[farm_i][c] / n

    # Hub coverage report
    hub_coverage = {}
    for h, hub in enumerate(hubs):
        crops_data = {}
        for c, crop in enumerate(crops):
            demand = hub.local_demand.get(c, 0.0)
            if demand > 0:
                crops_data[crop.name] = {
                    'demand_kg':   round(demand,           1),
                    'supplied_kg': round(hub_supply[h][c], 1),
                    'met':         hub_supply[h][c] >= demand,
                }
        hub_coverage[hub.name] = crops_data

    crops_met          = sum(1 for v in coverage_by_crop.values() if v['met'])
    network_health_pct = round(crops_met / M * 100, 1)

    return {
        'total_yield_kg':    round(float(supply.sum()), 1),
        'coverage_by_crop':  coverage_by_crop,
        'hub_coverage':      hub_coverage,
        'farms_assigned':    len(available_indices),
        'farms_locked':      len(locked_indices),
        'network_health_pct': network_health_pct,
    }
