from pydantic import BaseModel, Field
from typing import Optional


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class NewFarmRequest(BaseModel):
    name:               str
    lat:                float
    lng:                float
    plot_size_sqft:     float
    plot_type:          str     # 'balcony' | 'rooftop' | 'backyard' | 'community'
    tools:              str     # 'basic' | 'intermediate' | 'advanced'
    budget:             str     # 'low' | 'medium' | 'high'
    pH:                 float
    moisture:           float
    temperature:        float
    humidity:           float
    sunlight_hours:            Optional[float] = None
    preferred_crop_ids:        list[int]       = []
    max_delivery_distance_m:   Optional[float] = None  # metres; None = use network default


class SoilUpdateRequest(BaseModel):
    pH:             float = Field(ge=0, le=14)
    moisture:       float = Field(ge=0, le=100)
    temperature:    float
    humidity:       float = Field(ge=0, le=100)
    sunlight_hours: Optional[float] = None


class SoilReadingResponse(BaseModel):
    farm_id:        int
    pH:             float
    moisture:       float
    temperature:    float
    humidity:       float
    sunlight_hours: Optional[float] = None


class ReadingEntry(BaseModel):
    crop_id:     int
    pH:          float = Field(ge=0, le=14)
    moisture:    float = Field(ge=0, le=100)
    temperature: float
    humidity:    float = Field(ge=0, le=100)


class ReadingEntryResponse(BaseModel):
    id:          int
    farm_id:     int
    crop_id:     int   # 0 for averaged GET responses
    recorded_at: str
    pH:          float
    moisture:    float
    temperature: float
    humidity:    float


class SuggestionRequest(BaseModel):
    plot_size_sqft:     float
    plot_type:          str
    tools:              str
    budget:             str
    pH:                 Optional[float] = None
    moisture:           Optional[float] = None
    temperature:        Optional[float] = None
    humidity:           Optional[float] = None
    preferred_crop_ids: list[int]       = []


class SuggestionItem(BaseModel):
    crop_id:            int
    crop_name:          str
    suitability_pct:    float
    estimated_yield_kg: float
    grow_weeks:         int
    reason:             str


class CycleEndRequest(BaseModel):
    actual_yield_kg: dict   # {str(crop_id): kg}


class UpdateCropsRequest(BaseModel):
    crop_ids: list[int]
    replace:  bool = False   # True = replace current assignments; False = append & deduplicate


class TaskItem(BaseModel):
    id:             int
    crop_id:        int
    crop_name:      str
    title:          str
    subtitle:       str
    why:            str
    how:            str
    target:         str
    tools_required: str
    day_from_start: int
    due_date:       Optional[str] = None
    status:         Optional[str] = None   # 'done' | 'upcoming' | 'future'


class RiskFlag(BaseModel):
    type:     str
    message:  str
    severity: str   # 'low' | 'medium' | 'high'


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class BundleResponse(BaseModel):
    farm_id:           int
    farm_name:         str
    crop_id:           int
    crop_name:         str
    quantity_kg:       float
    grow_weeks:        int
    reason:            str
    preference_match:  bool           = False
    sqft_allocated:    Optional[float] = None
    cycle_start_date:  Optional[str]  = None
    cycle_number:      Optional[int]  = None
    joined_at:         Optional[str]  = None


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
    preference_weight:     Optional[float] = None
    min_slot_sqft:         Optional[float] = None


class HubUpdateRequest(BaseModel):
    local_demand: Optional[dict]  = None   # {str(crop_id): kg}
    capacity_kg:  Optional[float] = None
    priority:     Optional[str]   = None   # 'critical' | 'standard'


# ---------------------------------------------------------------------------
# Transaction — request bodies & responses
# ---------------------------------------------------------------------------

class RequestBody(BaseModel):
    type:        str    # 'give' | 'receive'
    node_id:     int
    hub_id:      Optional[int] = None
    crop_id:     int
    quantity_kg: float


class RequestResponse(BaseModel):
    id:           int
    type:         str
    node_id:      int
    hub_id:       Optional[int]
    crop_id:      int
    quantity_kg:  float
    status:       str
    hub_options:  list = []
    created_at:   str
    matched_at:   Optional[str] = None
    confirmed_at: Optional[str] = None


class SelectHubBody(BaseModel):
    hub_id: int


class SelectHubResponse(BaseModel):
    status:  str
    hub_id:  int
    message: str


class ConfirmBody(BaseModel):
    actual_quantity_kg: float


class ConfirmResponse(BaseModel):
    status:              str
    currency_delta:      float
    node_balance_after:  float
    hub_inventory_after: float


class BalanceResponse(BaseModel):
    node_id:          int
    currency_balance: float
    crops_on_hand:    dict
    crops_lifetime:   dict


class CropsOnHandBody(BaseModel):
    crop_id:     int
    quantity_kg: float


class AcceptBody(BaseModel):
    hub_id: int


class AcceptResponse(BaseModel):
    status:  str
    hub_id:  int
    message: str


class HubInventoryItemResponse(BaseModel):
    crop_id:     int
    crop_name:   str
    quantity_kg: float


class HubInventoryResponse(BaseModel):
    hub_id:      int
    inventory:   list[HubInventoryItemResponse]
    total_kg:    float
    capacity_kg: float


class LedgerEntryResponse(BaseModel):
    id:            int
    type:          str
    node_id:       int
    request_id:    int
    amount:        float
    balance_after: float
    created_at:    str
    note:          str


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
