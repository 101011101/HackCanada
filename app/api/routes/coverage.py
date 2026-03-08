from fastapi import APIRouter
from datetime import date

from app.api import storage, models
from app.engine.scorer    import build_yield_matrix
from app.engine.router    import build_reachability_matrix
from app.engine.scheduler import (classify_nodes, compute_locked_supply,
                                   compute_gap, compute_locked_supply_per_hub)
from app.engine.reporter  import generate_report

router = APIRouter()


@router.get('/coverage', response_model=models.AssignmentsResponse)
def get_coverage():
    farms, crops, hubs, config = storage.load_engine_state()
    M = len(crops)

    yield_matrix        = build_yield_matrix(farms, crops)
    reachability_matrix = build_reachability_matrix(farms, hubs, config.max_travel_distance)

    locked, available   = classify_nodes(farms, date.today())
    locked_supply       = compute_locked_supply(farms, locked, yield_matrix, M)
    locked_hub_supply   = compute_locked_supply_per_hub(
        farms, locked, yield_matrix, hubs, reachability_matrix, M)

    assignments_dict    = {int(k): v for k, v in storage.load_assignments().items()}

    # Build assignment list (index-keyed) for available farms that have been assigned
    assignment_indices  = []
    for i in available:
        if farms[i].id in assignments_dict:
            assignment_indices.append(assignments_dict[farms[i].id])
        else:
            assignment_indices.append(None)

    report = generate_report(
        farms, locked, available,
        [a if a is not None else 0 for a in assignment_indices],
        crops, hubs, yield_matrix, reachability_matrix, config,
    )

    # Build BundleResponse list for available farms with assignments
    bundles = []
    for i in available:
        crop_idx = assignments_dict.get(farms[i].id)
        if crop_idx is None:
            continue
        crop         = crops[crop_idx]
        from app.engine.scorer import compute_suitability
        suitability  = compute_suitability(farms[i], crop)
        qty_kg       = round(float(yield_matrix[i][crop_idx]), 1)
        target       = config.food_targets.get(crop_idx, 0)
        gap_vec      = compute_gap(config, locked_supply, list(range(M)))
        gap_pct      = max(0.0, gap_vec[crop_idx] / target * 100) if target > 0 else 0.0
        bundles.append(models.BundleResponse(
            farm_id=farms[i].id,
            farm_name=farms[i].name,
            crop_id=crop.id,
            crop_name=crop.name,
            quantity_kg=qty_kg,
            grow_weeks=crop.grow_weeks,
            reason=(
                f"Suitability {suitability:.0%} for {crop.name} — "
                f"network gap {gap_pct:.0f}% unfilled"
            ),
        ))

    # Locked farms summary
    locked_list = []
    for i in locked:
        farm = farms[i]
        crop_id = farm.current_crop_id
        crop_name = crops[crop_id].name if crop_id is not None and crop_id < len(crops) else 'unknown'
        locked_list.append(models.LockedFarmResponse(
            farm_id=farm.id,
            farm_name=farm.name,
            crop_name=crop_name,
            cycle_end_date=str(farm.cycle_end_date) if farm.cycle_end_date else '',
        ))

    return models.AssignmentsResponse(
        assignments=bundles,
        locked_farms=locked_list,
        network_health_pct=report['network_health_pct'],
    )


@router.get('/assignments')
def get_assignments():
    """Raw assignment map: {farm_id: crop_id}"""
    return storage.load_assignments()
