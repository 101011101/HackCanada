from fastapi import APIRouter
from datetime import date

from app.api import storage, models
from app.engine.scorer    import build_yield_matrix
from app.engine.router    import build_reachability_matrix
from app.engine.scheduler import (classify_nodes, compute_locked_supply,
                                   compute_locked_supply_per_hub)
from app.engine.reporter  import generate_report

router = APIRouter()


def _build_report() -> dict:
    """Run generate_report() and augment with unlocking_soon + overproduction_alerts."""
    farms, crops, hubs, config = storage.load_engine_state()
    M = len(crops)

    yield_matrix        = build_yield_matrix(farms, crops)
    reachability_matrix = build_reachability_matrix(farms, hubs, config.max_travel_distance)
    locked, available   = classify_nodes(farms, date.today())
    locked_supply       = compute_locked_supply(farms, locked, yield_matrix, M)
    locked_hub_supply   = compute_locked_supply_per_hub(
        farms, locked, yield_matrix, hubs, reachability_matrix, M)

    # Load persisted assignments for available farms
    saved = {int(k): v for k, v in storage.load_assignments().items()}
    assignment = []
    for i in available:
        assignment.append(saved.get(farms[i].id, 0))

    import numpy as np
    report = generate_report(
        farms, locked, available,
        np.array(assignment, dtype=int),
        crops, hubs, yield_matrix, reachability_matrix, config,
    )

    # Unlocking soon — locked farms whose cycle ends within 7 days
    today = date.today()
    unlocking_soon = []
    for i in locked:
        farm = farms[i]
        if farm.cycle_end_date is None:
            continue
        days = (farm.cycle_end_date - today).days
        if days <= 7:
            crop_name = crops[farm.current_crop_id].name if farm.current_crop_id is not None else 'unknown'
            unlocking_soon.append(models.UnlockingSoonItem(
                farm_id=farm.id,
                farm_name=farm.name,
                crop_name=crop_name,
                cycle_end_date=str(farm.cycle_end_date),
                days_remaining=days,
            ))
    unlocking_soon.sort(key=lambda x: x.days_remaining)

    # Overproduction alerts — crops where supplied > target * (1 + buffer)
    overproduction_alerts = []
    for crop_name, data in report['coverage_by_crop'].items():
        target   = data['target_kg']
        supplied = data['supplied_kg']
        if target > 0 and supplied > target * (1 + config.overproduction_buffer):
            overproduction_alerts.append(models.OverproductionAlert(
                crop_name=crop_name,
                target_kg=target,
                supplied_kg=supplied,
                surplus_kg=data['surplus_kg'],
                surplus_ratio=round(supplied / target, 2),
            ))

    # Coerce coverage_by_crop values to plain Python types (numpy.bool_ → bool)
    clean_coverage = {}
    for crop_name, data in report['coverage_by_crop'].items():
        clean_coverage[crop_name] = {
            'target_kg':   float(data['target_kg']),
            'supplied_kg': float(data['supplied_kg']),
            'gap_pct':     float(data['gap_pct']),
            'surplus_kg':  float(data['surplus_kg']),
            'met':         bool(data['met']),
        }

    # Enrich hub_coverage with priority + capacity_kg, coerce types
    hub_dicts = {h.name: h for h in hubs}
    enriched_hubs = {}
    for hub_name, crops_data in report['hub_coverage'].items():
        hub = hub_dicts.get(hub_name)
        clean_crops = {}
        for crop_name, cdata in crops_data.items():
            clean_crops[crop_name] = {
                'demand_kg':   float(cdata['demand_kg']),
                'supplied_kg': float(cdata['supplied_kg']),
                'met':         bool(cdata['met']),
            }
        enriched_hubs[hub_name] = {
            'priority':    hub.priority    if hub else 'standard',
            'capacity_kg': hub.capacity_kg if hub else 0.0,
            'crops':       clean_crops,
        }

    return {
        'network_health_pct':    float(report['network_health_pct']),
        'total_yield_kg':        float(report['total_yield_kg']),
        'farms_total':           len(farms),
        'farms_assigned':        int(report['farms_assigned']),
        'farms_locked':          int(report['farms_locked']),
        'coverage_by_crop':      clean_coverage,
        'hub_coverage':          enriched_hubs,
        'unlocking_soon':        unlocking_soon,
        'overproduction_alerts': overproduction_alerts,
    }


@router.get('/report', response_model=models.ReportResponse)
def get_report():
    """Full network report — everything in one call."""
    return _build_report()


@router.get('/coverage/summary')
def get_coverage_summary():
    """Network-level headline stats only."""
    r = _build_report()
    return {
        'network_health_pct': r['network_health_pct'],
        'total_yield_kg':     r['total_yield_kg'],
        'farms_total':        r['farms_total'],
        'farms_assigned':     r['farms_assigned'],
        'farms_locked':       r['farms_locked'],
        'crop_count':         len(r['coverage_by_crop']),
        'hub_count':          len(r['hub_coverage']),
    }


@router.get('/coverage/crops')
def get_coverage_crops():
    """Per-crop target vs supplied breakdown."""
    return {'coverage_by_crop': _build_report()['coverage_by_crop']}


@router.get('/coverage/hubs')
def get_coverage_hubs():
    """Per-hub per-crop demand vs supplied breakdown."""
    return {'hub_coverage': _build_report()['hub_coverage']}
