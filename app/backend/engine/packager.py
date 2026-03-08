import numpy as np
from .schemas import FarmNode, Crop, NetworkConfig, InstructionBundle
from .scorer import compute_suitability


def _build_reason(farm: FarmNode, crop: Crop, suitability: float,
                  gap_vector: np.ndarray, config: NetworkConfig) -> str:
    target = config.food_targets.get(crop.id, 0)
    gap_pct = max(0.0, gap_vector[crop.id] / target * 100) if target > 0 else 0.0
    return (
        f"Suitability {suitability:.0%} for {crop.name} — "
        f"soil pH {farm.pH:.1f} (optimal {crop.optimal_pH[0]}–{crop.optimal_pH[1]}), "
        f"network gap {gap_pct:.0f}% unfilled"
    )


def package_instructions(farms: list,
                          available_indices: list,
                          assignment: list,
                          crops: list,
                          yield_matrix: np.ndarray,
                          gap_vector: np.ndarray,
                          config: NetworkConfig) -> list:
    """
    Returns one InstructionBundle per (farm, crop) pair.
    assignment — list of lists: assignment[idx] = [crop_id, ...] for available_indices[idx]
    Yield and sqft are split equally across crops for multi-crop farms.
    """
    bundles = []
    for idx, farm_i in enumerate(available_indices):
        farm     = farms[farm_i]
        crop_ids = assignment[idx]
        n        = len(crop_ids)
        sqft_per = farm.plot_size_sqft / n
        for c in crop_ids:
            crop        = crops[c]
            suitability = compute_suitability(farm, crop)
            bundles.append(InstructionBundle(
                farm_id        = farm.id,
                farm_name      = farm.name,
                crop_id        = crop.id,
                crop_name      = crop.name,
                quantity_kg    = round(float(yield_matrix[farm_i][c]) / n, 1),
                grow_weeks     = crop.grow_weeks,
                reason         = _build_reason(farm, crop, suitability, gap_vector, config),
                sqft_allocated = round(sqft_per, 1),
            ))
    return bundles
