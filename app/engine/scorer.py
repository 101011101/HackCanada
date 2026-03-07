import numpy as np
from .schemas import FarmNode, Crop, TOOL_RANK, BUDGET_RANK


def range_score(value: float, low: float, high: float) -> float:
    """1.0 if value is within [low, high], decays linearly outside."""
    if low <= value <= high:
        return 1.0
    elif value < low:
        return max(0.0, 1.0 - (low - value) / low)
    else:
        return max(0.0, 1.0 - (value - high) / high)


def compute_suitability(farm: FarmNode, crop: Crop) -> float:
    """
    Returns 0.0 if any hard gate fails.
    Otherwise returns weighted soft score in [0, 1].
    """
    # Hard gates — must all pass
    if farm.plot_size_sqft < crop.min_sqft:
        return 0.0
    if TOOL_RANK[farm.tools] < TOOL_RANK[crop.tool_requirement]:
        return 0.0
    if BUDGET_RANK[farm.budget] < BUDGET_RANK[crop.budget_requirement]:
        return 0.0

    # Soft score — weighted average of condition fits
    ph_score       = range_score(farm.pH,          *crop.optimal_pH)
    moisture_score = range_score(farm.moisture,     *crop.optimal_moisture)
    temp_score     = range_score(farm.temperature,  *crop.optimal_temp)
    size_score     = min(1.0, farm.plot_size_sqft / crop.min_sqft)

    return 0.25 * ph_score + 0.25 * moisture_score + 0.25 * temp_score + 0.25 * size_score


def build_yield_matrix(farms: list, crops: list) -> np.ndarray:
    """
    Returns float array of shape [N, M].
    yield_matrix[i][c] = expected kg output if farm i grows crop c.
    """
    N, M = len(farms), len(crops)
    matrix = np.zeros((N, M), dtype=float)
    for i, farm in enumerate(farms):
        for c, crop in enumerate(crops):
            s = compute_suitability(farm, crop)
            matrix[i][c] = s * crop.base_yield_per_sqft * farm.plot_size_sqft
    return matrix
