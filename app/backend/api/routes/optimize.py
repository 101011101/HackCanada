from fastapi import APIRouter
from datetime import date

from app.backend.api import storage, models
from app.backend.engine.scorer       import build_yield_matrix
from app.backend.engine.router       import build_reachability_matrix, compute_hub_routing
from app.backend.engine.scheduler    import (classify_nodes, compute_locked_supply,
                                      compute_gap, compute_locked_supply_per_hub)
from app.backend.engine.optimizer    import run_ilp, compute_multi_crop_assignments
from app.backend.engine.reporter     import generate_report
from app.backend.engine.gemini_tasks import generate_tasks_for_farm
from app.backend.api.ai_task_cache   import invalidate_farm_tasks, set_cached_tasks

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

    routing = compute_hub_routing(farms, hubs, config.max_travel_distance)
    storage.save_hub_routing(routing)

    # Eagerly generate AI tasks for all newly assigned farms (sequential to avoid rate limits)
    hub_routing = storage.load_hub_routing()
    hub_dicts   = storage.load_hubs()
    for idx, i in enumerate(available):
        farm       = farms[i]
        crop_ids   = full_assignments[idx]
        num_slots  = len(crop_ids)
        sqft_per   = round(farm.plot_size_sqft / num_slots, 1) if num_slots else farm.plot_size_sqft
        cycle_num  = farm.cycle_number or 1

        # Resolve primary hub for this farm
        hub_ids   = hub_routing.get(str(farm.id)) or hub_routing.get(farm.id) or []
        hub_dict  = next((h for h in hub_dicts if h['id'] == hub_ids[0]), None) if hub_ids else None
        hub_name  = hub_dict['name']     if hub_dict else 'Unknown Hub'
        hub_pri   = hub_dict['priority'] if hub_dict else 'standard'

        invalidate_farm_tasks(farm.id)
        for crop_id in crop_ids:
            crop     = next((c for c in crops if c.id == crop_id), None)
            if crop is None:
                continue
            qty_kg   = round(yield_matrix[i][crop_id] / num_slots, 1)
            ai_tasks = generate_tasks_for_farm(farm, crop, sqft_per, qty_kg, hub_name, hub_pri)
            if ai_tasks is not None:
                set_cached_tasks(farm.id, crop_id, cycle_num, ai_tasks)

    return models.OptimizeResponse(
        status='ok',
        farms_optimized=len(available),
        network_health_pct=report['network_health_pct'],
    )
