from pydantic import BaseModel
from typing import Optional


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class NewFarmRequest(BaseModel):
    name:           str
    lat:            float
    lng:            float
    plot_size_sqft: float
    plot_type:      str     # 'balcony' | 'rooftop' | 'backyard' | 'community'
    tools:          str     # 'basic' | 'intermediate' | 'advanced'
    budget:         str     # 'low' | 'medium' | 'high'
    pH:             float
    moisture:       float
    temperature:    float
    humidity:       float


class SoilUpdateRequest(BaseModel):
    pH:          float
    moisture:    float
    temperature: float
    humidity:    float


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class BundleResponse(BaseModel):
    farm_id:     int
    farm_name:   str
    crop_id:     int
    crop_name:   str
    quantity_kg: float
    grow_weeks:  int
    reason:      str


class LockedFarmResponse(BaseModel):
    farm_id:        int
    farm_name:      str
    crop_name:      str
    cycle_end_date: str


class AssignmentsResponse(BaseModel):
    assignments:        list[BundleResponse]
    locked_farms:       list[LockedFarmResponse]
    network_health_pct: float


class OptimizeResponse(BaseModel):
    status:             str
    farms_optimized:    int
    network_health_pct: float


# ---------------------------------------------------------------------------
# Config / Hub update requests
# ---------------------------------------------------------------------------

class ConfigUpdateRequest(BaseModel):
    max_travel_distance:   Optional[float] = None
    food_targets:          Optional[dict]  = None   # {str(crop_id): kg}
    epoch_weeks:           Optional[int]   = None
    inertia_weight:        Optional[float] = None
    overproduction_buffer: Optional[float] = None


class HubUpdateRequest(BaseModel):
    local_demand: Optional[dict]  = None   # {str(crop_id): kg}
    capacity_kg:  Optional[float] = None
    priority:     Optional[str]   = None   # 'critical' | 'standard'


# ---------------------------------------------------------------------------
# Report response types
# ---------------------------------------------------------------------------

class UnlockingSoonItem(BaseModel):
    farm_id:        int
    farm_name:      str
    crop_name:      str
    cycle_end_date: str
    days_remaining: int


class OverproductionAlert(BaseModel):
    crop_name:    str
    target_kg:    float
    supplied_kg:  float
    surplus_kg:   float
    surplus_ratio: float   # supplied / target


class ReportResponse(BaseModel):
    network_health_pct:    float
    total_yield_kg:        float
    farms_total:           int
    farms_assigned:        int
    farms_locked:          int
    coverage_by_crop:      dict   # {crop_name: {target_kg, supplied_kg, gap_pct, surplus_kg, met}}
    hub_coverage:          dict   # {hub_name: {priority, capacity_kg, crops: {...}}}
    unlocking_soon:        list[UnlockingSoonItem]
    overproduction_alerts: list[OverproductionAlert]
