from dataclasses import dataclass, field
from datetime import date
from typing import Optional

TOOL_RANK   = {'basic': 0, 'intermediate': 1, 'advanced': 2}
BUDGET_RANK = {'low': 0,   'medium': 1,       'high': 2}


@dataclass
class FarmNode:
    id:              int
    name:            str
    lat:             float
    lng:             float
    plot_size_sqft:  float
    plot_type:       str            # 'balcony' | 'rooftop' | 'backyard' | 'community'
    tools:           str            # 'basic' | 'intermediate' | 'advanced'
    budget:          str            # 'low' | 'medium' | 'high'
    pH:              float
    moisture:        float          # 0–100 %
    temperature:     float          # celsius
    humidity:        float          # 0–100 %
    status:          str            # 'new' | 'growing' | 'available'
    current_crop_id: Optional[int]  = None
    cycle_end_date:  Optional[date] = None
    yield_history:   dict           = field(default_factory=dict)  # {crop_id: [kg, ...]}


@dataclass
class Crop:
    id:                   int
    name:                 str
    color:                str
    min_sqft:             float
    tool_requirement:     str            # 'basic' | 'intermediate' | 'advanced'
    budget_requirement:   str            # 'low' | 'medium' | 'high'
    optimal_pH:           tuple          # (min, max)
    optimal_moisture:     tuple          # (min, max)
    optimal_temp:         tuple          # (min, max)
    base_yield_per_sqft:  float          # kg per sqft per cycle (ideal conditions)
    grow_weeks:           int
    network_target_share: float          # ideal fraction of network growing this


@dataclass
class HubNode:
    id:           int
    name:         str
    lat:          float
    lng:          float
    priority:     str            # 'critical' | 'standard'
    capacity_kg:  float
    local_demand: dict           # {crop_id: kg needed per cycle}


@dataclass
class NetworkConfig:
    max_travel_distance:   float   # metres
    food_targets:          dict    # {crop_id: kg per cycle}
    epoch_weeks:           int
    inertia_weight:        float   # γ — penalty for changing assignment
    overproduction_buffer: float   # allowed surplus fraction e.g. 0.20


@dataclass
class InstructionBundle:
    farm_id:    int
    farm_name:  str
    crop_id:    int
    crop_name:  str
    quantity_kg: float
    grow_weeks:  int
    reason:      str
