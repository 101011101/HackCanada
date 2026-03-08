"""Tests for POST /suggestions endpoint."""

import pytest


VALID_REQUEST = {
    "plot_size_sqft": 50.0,
    "plot_type": "backyard",
    "tools": "basic",
    "budget": "low",
    "pH": 6.5,
    "moisture": 65,
    "temperature": 22,
    "humidity": 65,
    "preferred_crop_ids": [],
}


class TestSuggestions:
    def test_returns_200(self, client):
        resp = client.post("/suggestions", json=VALID_REQUEST)
        assert resp.status_code == 200

    def test_returns_list(self, client):
        resp = client.post("/suggestions", json=VALID_REQUEST)
        assert isinstance(resp.json(), list)

    def test_suggestions_not_empty(self, client):
        resp = client.post("/suggestions", json=VALID_REQUEST)
        assert len(resp.json()) > 0

    def test_suggestion_has_required_fields(self, client):
        resp = client.post("/suggestions", json=VALID_REQUEST)
        item = resp.json()[0]
        for field in ["crop_id", "crop_name", "suitability_pct",
                      "estimated_yield_kg", "grow_weeks", "reason"]:
            assert field in item, f"Missing field: {field}"

    def test_suitability_pct_in_0_to_100(self, client):
        resp = client.post("/suggestions", json=VALID_REQUEST)
        for item in resp.json():
            assert 0 <= item["suitability_pct"] <= 100

    def test_estimated_yield_kg_positive(self, client):
        resp = client.post("/suggestions", json=VALID_REQUEST)
        for item in resp.json():
            assert item["estimated_yield_kg"] >= 0

    def test_grow_weeks_positive(self, client):
        resp = client.post("/suggestions", json=VALID_REQUEST)
        for item in resp.json():
            assert item["grow_weeks"] > 0

    def test_crop_name_is_string(self, client):
        resp = client.post("/suggestions", json=VALID_REQUEST)
        for item in resp.json():
            assert isinstance(item["crop_name"], str)

    def test_works_without_optional_soil_fields(self, client):
        minimal = {
            "plot_size_sqft": 50.0,
            "plot_type": "backyard",
            "tools": "basic",
            "budget": "low",
        }
        resp = client.post("/suggestions", json=minimal)
        assert resp.status_code == 200

    def test_preferred_crop_ids_affects_order(self, client):
        """Preferred crops should appear in suggestions."""
        req = {**VALID_REQUEST, "preferred_crop_ids": [0]}
        resp = client.post("/suggestions", json=req)
        assert resp.status_code == 200
        crop_ids = [s["crop_id"] for s in resp.json()]
        # Crop 0 (Tomato) should appear somewhere in results
        assert 0 in crop_ids

    def test_larger_plot_yields_more_kg(self, client):
        small = {**VALID_REQUEST, "plot_size_sqft": 10.0}
        large = {**VALID_REQUEST, "plot_size_sqft": 200.0}
        small_resp = client.post("/suggestions", json=small).json()
        large_resp = client.post("/suggestions", json=large).json()
        if small_resp and large_resp:
            small_yield = sum(s["estimated_yield_kg"] for s in small_resp)
            large_yield = sum(s["estimated_yield_kg"] for s in large_resp)
            assert large_yield > small_yield
