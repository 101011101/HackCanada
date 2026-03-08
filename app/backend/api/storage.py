"""
JSON storage layer — all file reads and writes go through here.
No other file touches the filesystem directly.
"""
import json
import dataclasses
from pathlib import Path
from datetime import date

from app.backend.engine.schemas import FarmNode, Crop, HubNode, NetworkConfig, HubInventoryEntry, Request, LedgerEntry

DATA_DIR = Path(__file__).parent.parent.parent / 'data'


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

def load_requests() -> list[dict]:
    try:
        return _load('requests.json')
    except FileNotFoundError:
        return []

def load_ledger() -> list[dict]:
    try:
        return _load('ledger.json')
    except FileNotFoundError:
        return []

def load_hub_inventory() -> list[dict]:
    try:
        return _load('hub_inventory.json')
    except FileNotFoundError:
        return []

def load_current_rates() -> dict:
    try:
        return _load('current_rates.json')
    except FileNotFoundError:
        return {}

def load_assignments() -> dict:
    try:
        data = _load('assignments.json')
        # Migrate old format {farm_id: int} → {farm_id: [int]}
        return {k: v if isinstance(v, list) else [v] for k, v in data.items()}
    except FileNotFoundError:
        return {}

def load_readings() -> list[dict]:
    try:
        return _load('readings.json')
    except FileNotFoundError:
        return []


# ---------------------------------------------------------------------------
# Savers
# ---------------------------------------------------------------------------

def save_farms(farms: list[dict]) -> None:
    _save('farms.json', farms)

def save_assignments(assignments: dict) -> None:
    _save('assignments.json', assignments)

def save_requests(requests: list[dict]) -> None:
    _save('requests.json', requests)

def save_ledger(entries: list[dict]) -> None:
    _save('ledger.json', entries)

def save_hub_inventory(inventory: list[dict]) -> None:
    _save('hub_inventory.json', inventory)

def save_current_rates(rates: dict) -> None:
    _save('current_rates.json', rates)

def save_hubs(hubs: list[dict]) -> None:
    _save('hubs.json', hubs)

def save_config(config: dict) -> None:
    _save('config.json', config)

def save_readings(readings: list[dict]) -> None:
    _save('readings.json', readings)


# ---------------------------------------------------------------------------
# Dict → engine type converters
# ---------------------------------------------------------------------------

def dict_to_farmnode(d: dict) -> FarmNode:
    cycle_end   = None
    cycle_start = None
    if d.get('cycle_end_date'):
        cycle_end   = date.fromisoformat(d['cycle_end_date'])
    if d.get('cycle_start_date'):
        cycle_start = date.fromisoformat(d['cycle_start_date'])
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
        cycle_start_date = cycle_start,
        cycle_number     = d.get('cycle_number', 1),
        joined_at        = d.get('joined_at'),
        yield_history    = {int(k): v for k, v in d.get('yield_history', {}).items()},
        current_crop_ids = d.get('current_crop_ids', []),
        preferred_crop_ids = d.get('preferred_crop_ids', []),
        currency_balance = d.get('currency_balance', 0.0),
        crops_on_hand    = {int(k): v for k, v in d.get('crops_on_hand', {}).items()},
        crops_lifetime   = {int(k): v for k, v in d.get('crops_lifetime', {}).items()},
        # DataKit fields
        soil_texture          = d.get('soil_texture'),
        soil_depth_cm         = d.get('soil_depth_cm'),
        drainage              = d.get('drainage'),
        organic_matter_pct    = d.get('organic_matter_pct'),
        nitrogen_ppm          = d.get('nitrogen_ppm'),
        phosphorus_ppm        = d.get('phosphorus_ppm'),
        potassium_ppm         = d.get('potassium_ppm'),
        salinity_ds_m         = d.get('salinity_ds_m'),
        growing_season_days   = d.get('growing_season_days'),
        rainfall_distribution = d.get('rainfall_distribution'),
        sunlight_hours_day    = d.get('sunlight_hours_day'),
        water_availability    = d.get('water_availability'),
        water_quality_ec      = d.get('water_quality_ec'),
        aspect                = d.get('aspect'),
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
        base_currency_rate   = d.get('base_currency_rate', 1.0),
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
    from app.backend.engine.data import (farms as seed_farms, crops as seed_crops,
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

    if not (DATA_DIR / 'requests.json').exists():
        _save('requests.json', [])

    if not (DATA_DIR / 'ledger.json').exists():
        _save('ledger.json', [])

    if not (DATA_DIR / 'readings.json').exists():
        _save('readings.json', [])

    if not (DATA_DIR / 'hub_inventory.json').exists():
        from app.backend.engine.data import hubs as seed_hubs, crops as seed_crops
        inventory = [
            {'hub_id': h.id, 'crop_id': c.id, 'quantity_kg': 0.0, 'last_updated': '2026-03-07T00:00:00'}
            for h in seed_hubs for c in seed_crops
        ]
        _save('hub_inventory.json', inventory)

    if not (DATA_DIR / 'current_rates.json').exists():
        from app.backend.engine.data import crops as seed_crops
        rates = {str(c.id): 1.0 for c in seed_crops}
        _save('current_rates.json', rates)
