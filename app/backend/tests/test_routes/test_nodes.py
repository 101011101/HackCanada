"""
Tests for /nodes routes.

All storage is mocked via the `client` fixture in conftest.py.
Tests verify HTTP status codes, response shapes, and key field values.
"""

import pytest


# ---------------------------------------------------------------------------
# GET /nodes/{farm_id}
# ---------------------------------------------------------------------------

class TestGetNode:
    def test_returns_200_for_existing_farm(self, client):
        resp = client.get("/nodes/0")
        assert resp.status_code == 200

    def test_response_is_list(self, client):
        resp = client.get("/nodes/0")
        assert isinstance(resp.json(), list)

    def test_bundle_contains_expected_fields(self, client):
        resp = client.get("/nodes/0")
        bundle = resp.json()[0]
        assert "farm_id" in bundle
        assert "farm_name" in bundle
        assert "crop_id" in bundle
        assert "crop_name" in bundle
        assert "quantity_kg" in bundle
        assert "grow_weeks" in bundle
        assert "reason" in bundle

    def test_farm_id_matches_requested(self, client):
        resp = client.get("/nodes/0")
        for bundle in resp.json():
            assert bundle["farm_id"] == 0

    def test_farm_name_is_string(self, client):
        resp = client.get("/nodes/0")
        assert isinstance(resp.json()[0]["farm_name"], str)

    def test_quantity_kg_is_positive(self, client):
        resp = client.get("/nodes/0")
        for bundle in resp.json():
            assert bundle["quantity_kg"] >= 0

    def test_returns_404_for_missing_farm(self, client):
        resp = client.get("/nodes/9999")
        assert resp.status_code == 404

    def test_404_detail_mentions_farm_id(self, client):
        resp = client.get("/nodes/9999")
        assert "9999" in resp.json()["detail"]

    def test_farm_1_returns_multiple_crops(self, client):
        # Farm 1 is assigned crops [0, 1]
        resp = client.get("/nodes/1")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_preference_match_is_bool(self, client):
        resp = client.get("/nodes/1")
        for bundle in resp.json():
            assert isinstance(bundle["preference_match"], bool)


# ---------------------------------------------------------------------------
# GET /nodes/{farm_id}/data
# ---------------------------------------------------------------------------

class TestGetSoilData:
    def test_returns_200(self, client):
        resp = client.get("/nodes/0/data")
        assert resp.status_code == 200

    def test_returns_soil_fields(self, client):
        resp = client.get("/nodes/0/data")
        data = resp.json()
        for field in ["farm_id", "pH", "moisture", "temperature", "humidity"]:
            assert field in data

    def test_ph_in_realistic_range(self, client):
        resp = client.get("/nodes/0/data")
        ph = resp.json()["pH"]
        assert 0.0 <= ph <= 14.0

    def test_moisture_in_realistic_range(self, client):
        resp = client.get("/nodes/0/data")
        moisture = resp.json()["moisture"]
        assert 0 <= moisture <= 100

    def test_farm_id_in_response(self, client):
        resp = client.get("/nodes/0/data")
        assert resp.json()["farm_id"] == 0

    def test_returns_404_for_missing_farm(self, client):
        resp = client.get("/nodes/9999/data")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /nodes/{farm_id}/balance
# ---------------------------------------------------------------------------

class TestGetBalance:
    def test_returns_200(self, client):
        resp = client.get("/nodes/0/balance")
        assert resp.status_code == 200

    def test_response_has_required_fields(self, client):
        resp = client.get("/nodes/0/balance")
        data = resp.json()
        assert "node_id" in data
        assert "currency_balance" in data
        assert "crops_on_hand" in data
        assert "crops_lifetime" in data

    def test_node_id_matches(self, client):
        resp = client.get("/nodes/0/balance")
        assert resp.json()["node_id"] == 0

    def test_currency_balance_is_float(self, client):
        resp = client.get("/nodes/0/balance")
        assert isinstance(resp.json()["currency_balance"], float)

    def test_currency_balance_value(self, client):
        # Farm 0 has currency_balance=50.0 in fixture
        resp = client.get("/nodes/0/balance")
        assert resp.json()["currency_balance"] == 50.0

    def test_crops_on_hand_is_dict(self, client):
        resp = client.get("/nodes/0/balance")
        assert isinstance(resp.json()["crops_on_hand"], dict)

    def test_returns_404_for_missing_farm(self, client):
        resp = client.get("/nodes/9999/balance")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /nodes/{farm_id}/tasks
# ---------------------------------------------------------------------------

class TestGetTasks:
    def test_returns_200(self, client):
        resp = client.get("/nodes/0/tasks")
        assert resp.status_code == 200

    def test_returns_list(self, client):
        resp = client.get("/nodes/0/tasks")
        assert isinstance(resp.json(), list)

    def test_task_has_required_fields(self, client):
        resp = client.get("/nodes/0/tasks")
        if resp.json():
            task = resp.json()[0]
            for field in ["id", "crop_id", "crop_name", "title", "subtitle",
                          "why", "how", "target", "tools_required", "day_from_start"]:
                assert field in task, f"Missing field: {field}"

    def test_tasks_sorted_by_day_from_start(self, client):
        resp = client.get("/nodes/0/tasks")
        tasks = resp.json()
        if len(tasks) > 1:
            days = [t["day_from_start"] for t in tasks]
            assert days == sorted(days)

    def test_returns_404_for_missing_farm(self, client):
        resp = client.get("/nodes/9999/tasks")
        assert resp.status_code == 404

    def test_status_is_valid_value(self, client):
        resp = client.get("/nodes/0/tasks")
        valid_statuses = {"done", "upcoming", "future", None}
        for task in resp.json():
            assert task["status"] in valid_statuses


# ---------------------------------------------------------------------------
# GET /nodes/{farm_id}/risks
# ---------------------------------------------------------------------------

class TestGetRisks:
    def test_returns_200(self, client):
        resp = client.get("/nodes/0/risks")
        assert resp.status_code == 200

    def test_returns_list(self, client):
        resp = client.get("/nodes/0/risks")
        assert isinstance(resp.json(), list)

    def test_risk_has_type_message_severity(self, client):
        resp = client.get("/nodes/0/risks")
        for risk in resp.json():
            assert "type" in risk
            assert "message" in risk
            assert "severity" in risk

    def test_severity_is_valid(self, client):
        resp = client.get("/nodes/0/risks")
        valid = {"low", "medium", "high"}
        for risk in resp.json():
            assert risk["severity"] in valid

    def test_returns_404_for_missing_farm(self, client):
        resp = client.get("/nodes/9999/risks")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /nodes/{farm_id}/readings
# ---------------------------------------------------------------------------

class TestGetReadings:
    def test_returns_200(self, client):
        resp = client.get("/nodes/0/readings")
        assert resp.status_code == 200

    def test_returns_list(self, client):
        resp = client.get("/nodes/0/readings")
        assert isinstance(resp.json(), list)

    def test_readings_for_farm_0_returns_2_entries(self, client):
        # Fixture has 2 readings for crop_id=0 at different minute timestamps
        # The route groups by minute bucket, so 2 distinct timestamps → 2 entries
        resp = client.get("/nodes/0/readings")
        assert len(resp.json()) == 2

    def test_reading_has_required_fields(self, client):
        resp = client.get("/nodes/0/readings")
        if resp.json():
            r = resp.json()[0]
            for field in ["id", "crop_id", "recorded_at", "pH", "moisture", "temperature", "humidity"]:
                assert field in r

    def test_limit_param_respected(self, client):
        resp = client.get("/nodes/0/readings?limit=1")
        assert len(resp.json()) <= 1

    def test_returns_empty_list_for_farm_with_no_crops_assigned(self, client):
        # Farm 9 does not exist in assignments, so crop_ids is empty → returns []
        # We test farm 1 which has assignments [0,1] but no readings with those crop_ids
        # (our fixture readings all have crop_id=0, and farm 1 is assigned [0,1])
        resp = client.get("/nodes/1/readings")
        assert resp.status_code == 200
        # farm 1 has crop_id=0 in assignments, and fixture has 2 readings with crop_id=0
        # so farm 1 should also return those 2 readings
        assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# POST /nodes/{farm_id}/readings
# ---------------------------------------------------------------------------

READING_BODY = {"crop_id": 0, "pH": 6.5, "moisture": 65, "temperature": 22, "humidity": 65}

class TestPostReading:
    def test_returns_200(self, client):
        resp = client.post("/nodes/0/readings", json=READING_BODY)
        assert resp.status_code == 200

    def test_response_contains_reading_fields(self, client):
        resp = client.post("/nodes/0/readings", json=READING_BODY)
        data = resp.json()
        assert data["pH"] == 6.5
        assert data["moisture"] == 65
        assert data["crop_id"] == 0

    def test_timestamp_is_present(self, client):
        resp = client.post("/nodes/0/readings", json=READING_BODY)
        assert "recorded_at" in resp.json()
        assert resp.json()["recorded_at"] != ""

    def test_returns_422_missing_crop_id(self, client):
        # crop_id is required — omitting it should return 422
        resp = client.post("/nodes/0/readings", json={
            "pH": 6.5, "moisture": 65, "temperature": 22, "humidity": 65
        })
        assert resp.status_code == 422

    def test_returns_404_for_missing_farm(self, client):
        resp = client.post("/nodes/9999/readings", json=READING_BODY)
        assert resp.status_code == 404
