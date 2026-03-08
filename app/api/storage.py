"""
JSON storage layer — all file reads and writes go through here.
No other file touches the filesystem directly.
"""
import json
import dataclasses
from pathlib import Path
from datetime import date

from app.engine.schemas import FarmNode, Crop, HubNode, NetworkConfig

DATA_DIR = Path(__file__).parent.parent / 'data'


# ---------------------------------------------------------------------------
# Raw I/O
# ---------------------------------------------------------------------------

def _load(filename: str):
    return json.loads((DATA_DIR / filename).read_text())


def _save(filename: str, data) -> None:
    DATA_DIR.mkdir(exist_ok=True)
    (DATA_DIR / filename).write_text(json.dumps(data, indent=2, default=str))


# ---------------------------------------------------------------------------
# Typed loaders (return plain dicts/lists — fast, no conversion)
# ---------------------------------------------------------------------------

def load_farms() -> list[dict]:
    return _load('farms.json')

def load_crops() -> list[dict]:
    return _load('crops.json')

def load_hubs() -> list[dict]:
    return _load('hubs.json')

def load_config() -> dict:
    return _load('config.json')

def load_assignments() -> dict:
    try:
        data = _load('assignments.json')
        # Migrate old format {farm_id: int} → {farm_id: [int]}
        return {k: v if isinstance(v, list) else [v] for k, v in data.items()}
    except FileNotFoundError:
        return {}


# ---------------------------------------------------------------------------
# Savers
# ---------------------------------------------------------------------------

def save_farms(farms: list[dict]) -> None:
    _save('farms.json', farms)

def save_assignments(assignments: dict) -> None:
    _save('assignments.json', assignments)

def save_hubs(hubs: list[dict]) -> None:
    _save('hubs.json', hubs)

def save_config(config: dict) -> None:
    _save('config.json', config)


# ---------------------------------------------------------------------------
# Dict → engine type converters
# ---------------------------------------------------------------------------

def dict_to_farmnode(d: dict) -> FarmNode:
    cycle_end = None
    if d.get('cycle_end_date'):
        cycle_end = date.fromisoformat(d['cycle_end_date'])
    return FarmNode(
        id             = d['id'],
        name           = d['name'],
        lat            = d['lat'],
        lng            = d['lng'],
        plot_size_sqft = d['plot_size_sqft'],
        plot_type      = d['plot_type'],
        tools          = d['tools'],
        budget         = d['budget'],
        pH             = d['pH'],
        moisture       = d['moisture'],
        temperature    = d['temperature'],
        humidity       = d['humidity'],
        status         = d['status'],
        current_crop_id  = d.get('current_crop_id'),
        cycle_end_date   = cycle_end,
        yield_history    = {int(k): v for k, v in d.get('yield_history', {}).items()},
        current_crop_ids = d.get('current_crop_ids', []),
        preferred_crop_ids = d.get('preferred_crop_ids', []),
    )


def dict_to_crop(d: dict) -> Crop:
    return Crop(
        id                   = d['id'],
        name                 = d['name'],
        color                = d['color'],
        min_sqft             = d['min_sqft'],
        tool_requirement     = d['tool_requirement'],
        budget_requirement   = d['budget_requirement'],
        optimal_pH           = tuple(d['optimal_pH']),
        optimal_moisture     = tuple(d['optimal_moisture']),
        optimal_temp         = tuple(d['optimal_temp']),
        base_yield_per_sqft  = d['base_yield_per_sqft'],
        grow_weeks           = d['grow_weeks'],
        network_target_share = d['network_target_share'],
    )


def dict_to_hub(d: dict) -> HubNode:
    return HubNode(
        id           = d['id'],
        name         = d['name'],
        lat          = d['lat'],
        lng          = d['lng'],
        priority     = d['priority'],
        capacity_kg  = d['capacity_kg'],
        local_demand = {int(k): v for k, v in d['local_demand'].items()},
    )


def dict_to_config(d: dict) -> NetworkConfig:
    return NetworkConfig(
        max_travel_distance   = d['max_travel_distance'],
        food_targets          = {int(k): v for k, v in d['food_targets'].items()},
        epoch_weeks           = d['epoch_weeks'],
        inertia_weight        = d['inertia_weight'],
        overproduction_buffer = d['overproduction_buffer'],
    )


# ---------------------------------------------------------------------------
# Convenience: load all state as engine types in one call
# ---------------------------------------------------------------------------

def load_engine_state():
    farms  = [dict_to_farmnode(d) for d in load_farms()]
    crops  = [dict_to_crop(d)     for d in load_crops()]
    hubs   = [dict_to_hub(d)      for d in load_hubs()]
    config = dict_to_config(load_config())
    return farms, crops, hubs, config


# ---------------------------------------------------------------------------
# Seeding — called on startup, only writes if file is missing
# ---------------------------------------------------------------------------

def seed_if_missing() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    from app.engine.data import (farms as seed_farms, crops as seed_crops,
                                  hubs as seed_hubs, config as seed_config)

    if not (DATA_DIR / 'farms.json').exists():
        _save('farms.json',  [dataclasses.asdict(f) for f in seed_farms])

    if not (DATA_DIR / 'crops.json').exists():
        _save('crops.json',  [dataclasses.asdict(c) for c in seed_crops])

    if not (DATA_DIR / 'hubs.json').exists():
        _save('hubs.json',   [dataclasses.asdict(h) for h in seed_hubs])

    if not (DATA_DIR / 'config.json').exists():
        _save('config.json', dataclasses.asdict(seed_config))

    if not (DATA_DIR / 'assignments.json').exists():
        _save('assignments.json', {})
