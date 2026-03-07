"""
MyCelium Optimization Engine — Demo Runner
Run from project root: python -m app.engine.main
"""
from datetime import date
import numpy as np

from .data      import farms, crops, hubs, config
from .scorer    import build_yield_matrix, compute_suitability
from .router    import build_reachability_matrix, haversine
from .scheduler import (classify_nodes, compute_locked_supply,
                        compute_gap, compute_locked_supply_per_hub)
from .optimizer import run_ilp, greedy_insert
from .packager  import package_instructions
from .reporter  import generate_report
from .schemas   import FarmNode

TODAY = date(2026, 3, 3)
W = 62   # print column width


def _divider(char='─'): print(char * W)


def run_demo():
    M = len(crops)
    H = len(hubs)

    _divider('=')
    print("  MYCELIUM OPTIMIZATION ENGINE — DEMO")
    _divider('=')

    # 1. Build matrices
    yield_matrix       = build_yield_matrix(farms, crops)
    reachability_matrix = build_reachability_matrix(farms, hubs, config.max_travel_distance)

    print(f"\n  Network : {len(farms)} farms  |  {M} crops  |  {H} hubs")
    print(f"  Max distance : {config.max_travel_distance/1000:.0f} km")

    # 2. Classify nodes
    locked, available = classify_nodes(farms, TODAY)
    print(f"  Locked (mid-cycle) : {len(locked)} farms")
    print(f"  Available          : {len(available)} farms")

    # 3. Compute supply gap
    locked_supply     = compute_locked_supply(farms, locked, yield_matrix, M)
    gap_vector        = compute_gap(config, locked_supply, list(range(M)))
    locked_hub_supply = compute_locked_supply_per_hub(
        farms, locked, yield_matrix, hubs, reachability_matrix, M)

    # 4. Run ILP
    print(f"\n  Running ILP optimizer on {len(available)} available farms...")
    assignment = run_ilp(
        available, farms, crops, hubs,
        yield_matrix, reachability_matrix,
        gap_vector, config, locked_hub_supply
    )
    print("  Done.\n")

    # 5. Package instructions
    bundles = package_instructions(
        farms, available, assignment, crops, yield_matrix, gap_vector, config)

    # 6. Coverage report
    report = generate_report(
        farms, locked, available, assignment, crops, hubs,
        yield_matrix, reachability_matrix, config)

    # ── Print: assignments ──────────────────────────────────────────────────
    _divider()
    print(f"  {'FARM ASSIGNMENTS':}")
    _divider()
    print(f"  {'Farm':<24} {'Crop':<14} {'Qty kg':>7}  Reason")
    _divider()
    for b in bundles:
        print(f"  {b.farm_name:<24} {b.crop_name:<14} {b.quantity_kg:>7.1f}  {b.reason}")

    # ── Print: locked farms ─────────────────────────────────────────────────
    print()
    _divider()
    print(f"  LOCKED FARMS (current cycle, cannot be reassigned)")
    _divider()
    for i in locked:
        farm      = farms[i]
        crop_name = crops[farm.current_crop_id].name if farm.current_crop_id is not None else '—'
        print(f"  {farm.name:<24} growing {crop_name:<14} until {farm.cycle_end_date}")

    # ── Print: network coverage ─────────────────────────────────────────────
    print()
    _divider()
    print(f"  NETWORK COVERAGE  (health: {report['network_health_pct']}%  |  "
          f"total yield: {report['total_yield_kg']} kg)")
    _divider()
    print(f"  {'Crop':<14} {'Target':>8} {'Supplied':>10} {'Gap%':>6}  Met")
    _divider()
    for name, d in report['coverage_by_crop'].items():
        met = '✓' if d['met'] else '✗'
        print(f"  {name:<14} {d['target_kg']:>8.0f} {d['supplied_kg']:>10.1f} "
              f"{d['gap_pct']:>5.0f}%  {met}")

    # ── Print: hub coverage ─────────────────────────────────────────────────
    print()
    _divider()
    print("  HUB COVERAGE")
    _divider()
    for hub in hubs:
        tag = 'CRITICAL' if hub.priority == 'critical' else 'standard'
        print(f"\n  {hub.name} [{tag}]")
        crops_data = report['hub_coverage'][hub.name]
        for crop_name, d in crops_data.items():
            met = '✓' if d['met'] else '✗'
            print(f"    {crop_name:<14} demand {d['demand_kg']:>5.0f} kg  "
                  f"supplied {d['supplied_kg']:>7.1f} kg  {met}")

    # ── Demo: new node joining mid-cycle ────────────────────────────────────
    print()
    _divider()
    print("  DEMO — NEW FARM JOINS MID-CYCLE (greedy insert)")
    _divider()

    new_farm = FarmNode(
        id=20, name='New Farm #21 — Rooftop',
        lat=43.6515, lng=-79.3810,
        plot_size_sqft=60,
        plot_type='rooftop',
        tools='intermediate',
        budget='medium',
        pH=6.4, moisture=65, temperature=21, humidity=62,
        status='new',
    )

    # Compute yield + reachability rows for the new farm
    new_yield_row = np.array(
        [compute_suitability(new_farm, crop) * crop.base_yield_per_sqft * new_farm.plot_size_sqft
         for crop in crops],
        dtype=float
    )
    new_reach_row = np.array(
        [haversine(new_farm.lat, new_farm.lng, hub.lat, hub.lng) <= config.max_travel_distance
         for hub in hubs],
        dtype=bool
    )

    # Current hub supply = locked + assigned
    current_hub_supply = locked_hub_supply.copy()
    for idx, farm_i in enumerate(available):
        c = int(assignment[idx])
        for h in range(H):
            if reachability_matrix[farm_i][h]:
                current_hub_supply[h][c] += yield_matrix[farm_i][c]

    new_crop_idx = greedy_insert(
        new_yield_row, new_reach_row,
        crops, hubs, gap_vector, current_hub_supply
    )
    assigned_crop   = crops[new_crop_idx]
    expected_yield  = new_yield_row[new_crop_idx]
    suitability     = compute_suitability(new_farm, assigned_crop)

    print(f"\n  New farm  : {new_farm.name}")
    print(f"  Size      : {new_farm.plot_size_sqft} sqft  |  tools: {new_farm.tools}  |  budget: {new_farm.budget}")
    print(f"  Soil      : pH {new_farm.pH}  moisture {new_farm.moisture}%  temp {new_farm.temperature}°C")
    print(f"\n  Assigned  : {assigned_crop.name}")
    print(f"  Expected  : {expected_yield:.1f} kg over {assigned_crop.grow_weeks} weeks")
    print(f"  Suitability: {suitability:.0%}")
    print(f"  Reason    : fills network gap, best match given current supply\n")
    _divider('=')


if __name__ == '__main__':
    run_demo()
