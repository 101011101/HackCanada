import numpy as np
from scipy.optimize import milp, LinearConstraint, Bounds
from scipy.sparse import lil_matrix

from .schemas import FarmNode, Crop, HubNode, NetworkConfig


def run_ilp(available_indices: list,
            farms: list,
            crops: list,
            hubs: list,
            yield_matrix: np.ndarray,
            reachability_matrix: np.ndarray,
            gap_vector: np.ndarray,
            config: NetworkConfig,
            locked_hub_supply: np.ndarray = None) -> np.ndarray:
    """
    Full epoch optimizer. Assigns one crop to every available farm.

    Returns int array of shape [N_free] where each value is a crop index.
    Uses scipy.optimize.milp (ILP via branch-and-bound).
    Falls back to greedy argmax if ILP is infeasible.
    """
    N_free = len(available_indices)
    M      = len(crops)

    if N_free == 0:
        return np.array([], dtype=int)

    n_vars = N_free * M

    # --- Objective: minimize -(gap-weighted yield) + inertia reward ----------
    targets = np.array([config.food_targets.get(c, 1.0) for c in range(M)])
    # crops with bigger gaps get higher weight so they're filled first
    gap_weights = np.where(
        targets > 0,
        np.maximum(1.0, gap_vector / np.maximum(targets, 1e-9) + 1.0),
        1.0
    )

    c_obj = np.zeros(n_vars, dtype=float)
    for idx, farm_i in enumerate(available_indices):
        for c in range(M):
            c_obj[idx * M + c] = -yield_matrix[farm_i][c] * gap_weights[c]
        # inertia: discount objective cost for keeping previous crop
        prev = farms[farm_i].current_crop_id
        if prev is not None and 0 <= prev < M:
            c_obj[idx * M + prev] -= config.inertia_weight * yield_matrix[farm_i][prev]

    # --- Constraint 1: each farm grows exactly one crop ----------------------
    A_assign = lil_matrix((N_free, n_vars), dtype=float)
    for idx in range(N_free):
        A_assign[idx, idx * M:(idx + 1) * M] = 1.0
    c1 = LinearConstraint(A_assign.tocsr(), lb=1.0, ub=1.0)

    # --- Constraint 2: critical hub coverage ---------------------------------
    hub_rows, lb_hub, ub_hub = [], [], []
    for h, hub in enumerate(hubs):
        if hub.priority != 'critical':
            continue
        for c in range(M):
            demand = hub.local_demand.get(c, 0.0)
            if demand <= 0:
                continue
            locked_contrib = float(locked_hub_supply[h][c]) if locked_hub_supply is not None else 0.0
            remaining = max(0.0, demand - locked_contrib)
            if remaining <= 0:
                continue
            row = np.zeros(n_vars, dtype=float)
            for idx, farm_i in enumerate(available_indices):
                if reachability_matrix[farm_i][h]:
                    row[idx * M + c] = yield_matrix[farm_i][c]
            if row.sum() > 0:
                hub_rows.append(row)
                lb_hub.append(remaining)
                ub_hub.append(np.inf)

    constraints = [c1]
    if hub_rows:
        constraints.append(LinearConstraint(
            np.array(hub_rows),
            lb=np.array(lb_hub),
            ub=np.array(ub_hub)
        ))

    # --- Solve ---------------------------------------------------------------
    bounds      = Bounds(lb=0.0, ub=1.0)
    integrality = np.ones(n_vars, dtype=int)

    result = milp(c_obj, constraints=constraints,
                  integrality=integrality, bounds=bounds)

    if result.status != 0:
        # Relax hub coverage constraints and retry with assignment only
        result = milp(c_obj, constraints=[c1],
                      integrality=integrality, bounds=bounds)

    if result.status != 0 or result.x is None:
        # Last resort: assign each farm its highest-yield eligible crop
        return np.array(
            [int(np.argmax(yield_matrix[farm_i])) for farm_i in available_indices],
            dtype=int
        )

    x = result.x.reshape(N_free, M)
    return np.argmax(x, axis=1).astype(int)


def greedy_insert(yield_row: np.ndarray,
                  reach_row: np.ndarray,
                  crops: list,
                  hubs: list,
                  gap_vector: np.ndarray,
                  current_hub_supply: np.ndarray = None) -> int:
    """
    Fast O(M) assignment for a single new node joining mid-cycle.

    yield_row  — precomputed yield for the new farm across all crops [M]
    reach_row  — precomputed reachability for the new farm across all hubs [H]
    Returns the index of the assigned crop.
    """
    M = len(crops)
    scores = np.zeros(M, dtype=float)

    for c in range(M):
        if yield_row[c] == 0:
            continue
        gap_weight = max(0.0, float(gap_vector[c]))

        # Hub urgency: shortfall across reachable hubs for this crop
        hub_urgency = 0.0
        for h, hub in enumerate(hubs):
            if reach_row[h]:
                demand    = hub.local_demand.get(c, 0.0)
                supplied  = float(current_hub_supply[h][c]) if current_hub_supply is not None else 0.0
                hub_urgency += max(0.0, demand - supplied)

        scores[c] = yield_row[c] * (gap_weight + 1.0) * (1.0 + hub_urgency)

    return int(np.argmax(scores))
