"""
Pytest fixtures for HackCanada backend tests.

Uses FastAPI TestClient with a patched storage layer so tests run
against isolated in-memory data and never touch app/data/*.json files.
"""

import json
import copy
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.backend.api.main import app

# ---------------------------------------------------------------------------
# Baseline data that tests run against — copied fresh for each test
# ---------------------------------------------------------------------------

FARMS_DATA = [
    {
        "id": 0,
        "name": "Test Balcony Farm",
        "lat": 43.652,
        "lng": -79.382,
        "plot_size_sqft": 25,
        "plot_type": "balcony",
        "tools": "basic",
        "budget": "low",
        "pH": 6.5,
        "moisture": 65,
        "temperature": 22,
        "humidity": 65,
        "status": "available",
        "current_crop_ids": [],
        "current_crop_id": None,
        "cycle_end_date": None,
        "cycle_start_date": "2026-01-01",
        "cycle_number": 1,
        "joined_at": "2026-01-01T00:00:00",
        "yield_history": {},
        "currency_balance": 50.0,
        "crops_on_hand": {"0": 2.5},
        "crops_lifetime": {"0": 10.0},
        "preferred_crop_ids": [],
    },
    {
        "id": 1,
        "name": "Test Backyard Farm",
        "lat": 43.660,
        "lng": -79.390,
        "plot_size_sqft": 200,
        "plot_type": "backyard",
        "tools": "intermediate",
        "budget": "medium",
        "pH": 6.8,
        "moisture": 70,
        "temperature": 21,
        "humidity": 62,
        "status": "available",
        "current_crop_ids": [],
        "current_crop_id": None,
        "cycle_end_date": None,
        "cycle_start_date": "2026-01-01",
        "cycle_number": 2,
        "joined_at": "2025-09-01T00:00:00",
        "yield_history": {"0": [15.0, 18.0]},
        "currency_balance": 125.0,
        "crops_on_hand": {},
        "crops_lifetime": {"0": 33.0},
        "preferred_crop_ids": [0, 1],
    },
]

CROPS_DATA = [
    {
        "id": 0,
        "name": "Tomato",
        "color": "#e74c3c",
        "min_sqft": 10,
        "tool_requirement": "basic",
        "budget_requirement": "low",
        "optimal_pH": [6.0, 7.0],
        "optimal_moisture": [60, 80],
        "optimal_temp": [18, 27],
        "base_yield_per_sqft": 2.5,
        "grow_weeks": 10,
        "network_target_share": 0.15,
    },
    {
        "id": 1,
        "name": "Lettuce",
        "color": "#2ecc71",
        "min_sqft": 5,
        "tool_requirement": "basic",
        "budget_requirement": "low",
        "optimal_pH": [6.0, 7.0],
        "optimal_moisture": [60, 80],
        "optimal_temp": [15, 22],
        "base_yield_per_sqft": 1.5,
        "grow_weeks": 6,
        "network_target_share": 0.12,
    },
    {
        "id": 2,
        "name": "Spinach",
        "color": "#27ae60",
        "min_sqft": 5,
        "tool_requirement": "basic",
        "budget_requirement": "low",
        "optimal_pH": [6.0, 7.0],
        "optimal_moisture": [60, 75],
        "optimal_temp": [10, 20],
        "base_yield_per_sqft": 1.2,
        "grow_weeks": 5,
        "network_target_share": 0.10,
    },
]

HUBS_DATA = [
    {
        "id": 0,
        "name": "Greenwood Hub",
        "lat": 43.6532,
        "lng": -79.3832,
        "priority": "critical",
        "capacity_kg": 500.0,
        "local_demand": {"0": 30, "1": 25, "2": 20},
    }
]

ASSIGNMENTS_DATA = {"0": [0], "1": [0, 1]}

CONFIG_DATA = {
    "max_travel_distance": 5.0,
    "food_targets": {"0": 200, "1": 150, "2": 100},
    "epoch_weeks": 10,
    "inertia_weight": 0.7,
    "overproduction_buffer": 1.2,
    "preference_weight": 0.3,
    "min_slot_sqft": 20.0,
}

READINGS_DATA = [
    {
        "id": 0,
        "crop_id": 0,
        "recorded_at": "2026-02-01T08:00:00",
        "pH": 6.4,
        "moisture": 62,
        "temperature": 20,
        "humidity": 63,
    },
    {
        "id": 1,
        "crop_id": 0,
        "recorded_at": "2026-02-08T08:00:00",
        "pH": 6.5,
        "moisture": 65,
        "temperature": 22,
        "humidity": 65,
    },
]

HUB_INVENTORY_DATA = [
    {"hub_id": 0, "crop_id": 0, "quantity_kg": 12.5},
]

LEDGER_DATA = []
REQUESTS_DATA = []
CURRENT_RATES_DATA = {"0": 3.50, "1": 2.00, "2": 2.50}


# ---------------------------------------------------------------------------
# Fixture: fresh client per test with all storage patched
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """
    Returns a FastAPI TestClient with storage fully mocked.
    Each test gets its own independent data copy.
    """
    farms    = copy.deepcopy(FARMS_DATA)
    crops    = copy.deepcopy(CROPS_DATA)
    hubs     = copy.deepcopy(HUBS_DATA)
    assign   = copy.deepcopy(ASSIGNMENTS_DATA)
    config   = copy.deepcopy(CONFIG_DATA)
    readings = copy.deepcopy(READINGS_DATA)
    ledger   = copy.deepcopy(LEDGER_DATA)
    requests = copy.deepcopy(REQUESTS_DATA)
    rates    = copy.deepcopy(CURRENT_RATES_DATA)
    inv      = copy.deepcopy(HUB_INVENTORY_DATA)

    with patch("app.backend.api.storage.load_farms",       return_value=copy.deepcopy(farms)), \
         patch("app.backend.api.storage.save_farms",       return_value=None), \
         patch("app.backend.api.storage.load_crops",       return_value=copy.deepcopy(crops)), \
         patch("app.backend.api.storage.load_hubs",        return_value=copy.deepcopy(hubs)), \
         patch("app.backend.api.storage.load_assignments", return_value=copy.deepcopy(assign)), \
         patch("app.backend.api.storage.save_assignments", return_value=None), \
         patch("app.backend.api.storage.load_config",      return_value=copy.deepcopy(config)), \
         patch("app.backend.api.storage.load_readings",    return_value=copy.deepcopy(readings)), \
         patch("app.backend.api.storage.save_readings",    return_value=None), \
         patch("app.backend.api.storage.load_ledger",      return_value=copy.deepcopy(ledger)), \
         patch("app.backend.api.storage.save_ledger",      return_value=None), \
         patch("app.backend.api.storage.load_requests",    return_value=copy.deepcopy(requests)), \
         patch("app.backend.api.storage.save_requests",    return_value=None), \
         patch("app.backend.api.storage.load_current_rates", return_value=copy.deepcopy(rates)), \
         patch("app.backend.api.storage.load_hub_inventory", return_value=copy.deepcopy(inv)), \
         patch("app.backend.api.storage.save_hub_inventory", return_value=None):
        yield TestClient(app)
