import numpy as np
from datetime import date
from .schemas import FarmNode, NetworkConfig


def classify_nodes(farms: list, today: date) -> tuple:
    """
    Returns (locked_indices, available_indices).
    Locked = currently growing and cycle not yet finished.
    Available = harvested, idle, or new.
    """
    locked, available = [], []
    for i, farm in enumerate(farms):
        if (farm.status == 'growing'
                and farm.cycle_end_date is not None
                and farm.cycle_end_date > today):
            locked.append(i)
        else:
            available.append(i)
    return locked, available


def compute_locked_supply(farms: list, locked_indices: list,
                          yield_matrix: np.ndarray, num_crops: int) -> np.ndarray:
    """
    Returns float array of shape [M].
    locked_supply[c] = total kg of crop c already committed by locked farms.
    """
    supply = np.zeros(num_crops, dtype=float)
    for i in locked_indices:
        c = farms[i].current_crop_id
        if c is not None:
            supply[c] += yield_matrix[i][c]
    return supply


def compute_gap(config: NetworkConfig, locked_supply: np.ndarray,
                crop_ids: list) -> np.ndarray:
    """
    Returns float array of shape [M].
    gap[c] = food_targets[c] - locked_supply[c].
    Positive = network still needs this crop.
    Negative = already covered by locked farms.
    """
    return np.array([
        config.food_targets.get(c, 0.0) - locked_supply[c]
        for c in crop_ids
    ], dtype=float)


def compute_locked_supply_per_hub(farms: list, locked_indices: list,
                                  yield_matrix: np.ndarray,
                                  hubs: list, reachability_matrix: np.ndarray,
                                  num_crops: int) -> np.ndarray:
    """
    Returns float array of shape [H, M].
    hub_supply[h][c] = kg of crop c that locked farms will deliver to hub h.
    """
    H = len(hubs)
    hub_supply = np.zeros((H, num_crops), dtype=float)
    for i in locked_indices:
        c = farms[i].current_crop_id
        if c is not None:
            for h in range(H):
                if reachability_matrix[i][h]:
                    hub_supply[h][c] += yield_matrix[i][c]
    return hub_supply
