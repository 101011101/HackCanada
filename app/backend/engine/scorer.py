import numpy as np
from .schemas import FarmNode, Crop, TOOL_RANK, BUDGET_RANK

# Score assigned to a dimension when the crop requires it but the farm hasn't measured it.
# Slightly optimistic (farmer may just not have tested yet) but below 1.0 to prevent
# data-poor farms from outscoring data-rich farms with honest weak readings.
_UNKNOWN_DEFAULT = 0.6


def range_score(value: float, low: float, high: float) -> float:
    """1.0 if value is within [low, high], decays linearly outside."""
    if low <= value <= high:
        return 1.0
    elif value < low:
        return max(0.0, 1.0 - (low - value) / low)
    else:
        return max(0.0, 1.0 - (value - high) / high)


def _evaluate_dims(farm: FarmNode, crop: Crop) -> tuple:
    """
    Returns (scores, known_count) where:
      scores      — list of per-dimension scores for every dim the crop cares about.
                    Actual score if farm has data; _UNKNOWN_DEFAULT if farm has None.
      known_count — number of dims where the farm provided actual data.

    Only dimensions where the crop has an optimal range / preference are included.
    Hard gates (size, tools, budget) are handled separately by the caller.
    """
    scores = []
    known = 0

    # Size — always present, always scored
    size_score = min(1.0, farm.plot_size_sqft / crop.min_sqft)
    scores.append(size_score)
    known += 1

    # Continuous dimensions: (farm_value, crop_optimal_range)
    continuous = [
        (farm.pH,                   crop.optimal_pH),
        (farm.moisture,             crop.optimal_moisture),
        (farm.temperature,          crop.optimal_temp),
        (farm.soil_depth_cm,        crop.optimal_soil_depth_cm),
        (farm.organic_matter_pct,   crop.optimal_organic_matter),
        (farm.nitrogen_ppm,         crop.optimal_nitrogen_ppm),
        (farm.phosphorus_ppm,       crop.optimal_phosphorus_ppm),
        (farm.potassium_ppm,        crop.optimal_potassium_ppm),
        (farm.salinity_ds_m,        crop.optimal_salinity_ds_m),
        (farm.growing_season_days,  crop.optimal_growing_season_days),
        (farm.sunlight_hours_day,   crop.optimal_sunlight_hours),
        (farm.water_quality_ec,     crop.optimal_water_quality_ec),
    ]
    for farm_val, crop_range in continuous:
        if crop_range is None:
            continue  # crop has no preference for this dimension
        if farm_val is None:
            scores.append(_UNKNOWN_DEFAULT)
        else:
            scores.append(range_score(farm_val, *crop_range))
            known += 1

    # Categorical dimensions: (farm_value, crop_preferred_set)
    categorical = [
        (farm.soil_texture,          crop.optimal_soil_textures),
        (farm.drainage,              crop.preferred_drainage),
        (farm.rainfall_distribution, crop.preferred_rainfall),
        (farm.water_availability,    crop.preferred_water_availability),
        (farm.aspect,                crop.preferred_aspects),
    ]
    for farm_val, crop_pref in categorical:
        if crop_pref is None:
            continue  # crop has no preference for this dimension
        if farm_val is None:
            scores.append(_UNKNOWN_DEFAULT)
        else:
            scores.append(1.0 if farm_val in crop_pref else 0.0)
            known += 1

    return scores, known


def compute_suitability(farm: FarmNode, crop: Crop) -> float:
    """
    Returns 0.0 if any hard gate fails.
    Otherwise returns mean soft score across all crop-relevant dimensions.
    Unknown farm dimensions (None) score _UNKNOWN_DEFAULT rather than being skipped,
    preventing data-poor farms from inflating their scores over data-rich ones.
    """
    # Hard gates — must all pass
    if farm.plot_size_sqft < crop.min_sqft:
        return 0.0
    if TOOL_RANK[farm.tools] < TOOL_RANK[crop.tool_requirement]:
        return 0.0
    if BUDGET_RANK[farm.budget] < BUDGET_RANK[crop.budget_requirement]:
        return 0.0

    scores, _ = _evaluate_dims(farm, crop)
    return sum(scores) / len(scores) if scores else 0.5


def compute_data_completeness(farm: FarmNode, crop: Crop) -> float:
    """
    Returns fraction of crop-relevant dimensions where the farm has actual data.
    1.0 = fully measured for this crop. 0.0 = no relevant data at all.
    Hard gate failures return 1.0 (score is definitive; completeness is irrelevant).
    """
    if (farm.plot_size_sqft < crop.min_sqft
            or TOOL_RANK[farm.tools] < TOOL_RANK[crop.tool_requirement]
            or BUDGET_RANK[farm.budget] < BUDGET_RANK[crop.budget_requirement]):
        return 1.0

    scores, known = _evaluate_dims(farm, crop)
    return known / len(scores) if scores else 0.0


def compute_risk_flags(farm: FarmNode, assigned_crops: list) -> list:
    """
    Returns list of {type, message, severity} risk flags for a farm
    given its current soil readings and assigned crops.
    """
    flags = []
    seen  = set()

    def add(type_: str, message: str, severity: str):
        if type_ not in seen:
            seen.add(type_)
            flags.append({'type': type_, 'message': message, 'severity': severity})

    # Frost risk — temp at or below 2°C for crops with optimal_temp min >= 15°C
    if farm.temperature <= 2:
        frost_sensitive = [c for c in assigned_crops if c.optimal_temp[0] >= 15]
        if frost_sensitive:
            names = ', '.join(c.name for c in frost_sensitive)
            add('frost', f'Temperature {farm.temperature}°C risks frost damage to {names}.', 'high')

    # Overwatering risk
    if farm.moisture > 85:
        add('overwatering', f'Soil moisture {farm.moisture:.0f}% is too high — risk of root rot.', 'medium')

    # Drought risk
    if farm.moisture < 30:
        add('drought', f'Soil moisture {farm.moisture:.0f}% is critically low.', 'high')

    # Soil pH drift — outside crop optimal_pH range by more than 0.5
    # Skip if pH is outside the physically valid range (guards against corrupted data)
    if 0 <= farm.pH <= 14:
        for crop in assigned_crops:
            lo, hi = crop.optimal_pH
            if farm.pH < lo - 0.5 or farm.pH > hi + 0.5:
                add('soil_ph', f'Soil pH {farm.pH:.1f} is outside optimal range for {crop.name} ({lo}–{hi}).', 'medium')
                break  # one pH flag is enough

    return flags


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
