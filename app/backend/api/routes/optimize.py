from fastapi import APIRouter
from datetime import date

from app.backend.api import storage, models
from app.backend.engine.scorer    import build_yield_matrix
from app.backend.engine.router    import build_reachability_matrix
from app.backend.engine.scheduler import (classify_nodes, compute_locked_supply,
                                   compute_gap, compute_locked_supply_per_hub)
from app.backend.engine.optimizer import run_ilp, compute_multi_crop_assignments
from app.backend.engine.reporter  import generate_report

router = APIRouter()


@router.post('/optimize', response_model=models.OptimizeResponse)
def optimize():
    farms, crops, hubs, config = storage.load_engine_state()
    M = len(crops)

    yield_matrix        = build_yield_matrix(farms, crops)
    reachability_matrix = build_reachability_matrix(farms, hubs, config.max_travel_distance)

    locked, available   = classify_nodes(farms, date.today())
    locked_supply       = compute_locked_supply(farms, locked, yield_matrix, M)
    gap_vector          = compute_gap(config, locked_supply, list(range(M)))
    locked_hub_supply   = compute_locked_supply_per_hub(
        farms, locked, yield_matrix, hubs, reachability_matrix, M)

    primary_assignment = run_ilp(
        available, farms, crops, hubs,
        yield_matrix, reachability_matrix,
        gap_vector, config, locked_hub_supply,
    )

    # Post-process: expand large farms to multiple crops
    full_assignments = compute_multi_crop_assignments(
        available, farms, crops, hubs,
        yield_matrix, reachability_matrix,
        gap_vector, config, primary_assignment, locked_hub_supply,
    )

    report = generate_report(
        farms, locked, available, full_assignments,
        crops, hubs, yield_matrix, reachability_matrix, config,
    )

    # Persist assignments: {str(farm_id): [crop_id, ...]}
    assignments_dict = {
        str(farms[i].id): full_assignments[idx]
        for idx, i in enumerate(available)
    }
    storage.save_assignments(assignments_dict)

    return models.OptimizeResponse(
        status='ok',
        farms_optimized=len(available),
        network_health_pct=report['network_health_pct'],
    )
