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
    moisture:        float          # 0–100 % (soil moisture proxy)
    temperature:     float          # celsius
    humidity:        float          # 0–100 % (stored, not scored)
    status:          str            # 'new' | 'growing' | 'available'
    current_crop_id:  Optional[int]  = None
    cycle_end_date:   Optional[date] = None
    yield_history:    dict           = field(default_factory=dict)  # {crop_id: [kg, ...]}
    # --- Multi-crop & preferences ---
    current_crop_ids:    list = field(default_factory=list)  # list[int]; populated from current_crop_id if empty
    preferred_crop_ids:  list = field(default_factory=list)  # list[int]; farmer-selected preferred crops
    # --- DataKit variables (all Optional: None = not measured, 0.0 = measured as zero) ---
    # Soil Physical
    soil_texture:           Optional[str]   = None  # 'sand'|'sandy_loam'|'loam'|'silt_loam'|'clay_loam'|'clay'
    soil_depth_cm:          Optional[float] = None
    drainage:               Optional[str]   = None  # 'poor'|'moderate'|'well'
    # Soil Chemistry
    organic_matter_pct:     Optional[float] = None
    nitrogen_ppm:           Optional[float] = None
    phosphorus_ppm:         Optional[float] = None
    potassium_ppm:          Optional[float] = None
    salinity_ds_m:          Optional[float] = None
    # Climate
    growing_season_days:    Optional[float] = None
    rainfall_distribution:  Optional[str]   = None  # 'even'|'seasonal'|'monsoon'|'irregular'
    sunlight_hours_day:     Optional[float] = None
    # Water
    water_availability:     Optional[str]   = None  # 'none'|'rain_fed'|'irrigation'
    water_quality_ec:       Optional[float] = None  # dS/m
    # Site
    aspect:                 Optional[str]   = None  # 'N'|'NE'|'E'|'SE'|'S'|'SW'|'W'|'NW'

    def __post_init__(self):
        # Backward compat: populate current_crop_ids from current_crop_id for locked farms
        if not self.current_crop_ids and self.current_crop_id is not None:
            self.current_crop_ids = [self.current_crop_id]


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
    # --- DataKit optimal ranges (None = crop has no preference for this variable) ---
    # Continuous dims: (min, max) tuples. Categorical dims: tuple of accepted strings.
    # Soil Physical
    optimal_soil_textures:        Optional[tuple] = None
    optimal_soil_depth_cm:        Optional[tuple] = None
    preferred_drainage:           Optional[tuple] = None
    # Soil Chemistry
    optimal_organic_matter:       Optional[tuple] = None
    optimal_nitrogen_ppm:         Optional[tuple] = None
    optimal_phosphorus_ppm:       Optional[tuple] = None
    optimal_potassium_ppm:        Optional[tuple] = None
    optimal_salinity_ds_m:        Optional[tuple] = None
    # Climate
    optimal_growing_season_days:  Optional[tuple] = None
    preferred_rainfall:           Optional[tuple] = None
    optimal_sunlight_hours:       Optional[tuple] = None
    # Water
    preferred_water_availability: Optional[tuple] = None
    optimal_water_quality_ec:     Optional[tuple] = None
    # Site
    preferred_aspects:            Optional[tuple] = None


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
    preference_weight:     float = 30.0   # boost for farmer-preferred crops in ILP objective
    min_slot_sqft:         float = 50.0   # minimum sqft per crop zone (controls multi-crop split)


@dataclass
class InstructionBundle:
    farm_id:       int
    farm_name:     str
    crop_id:       int
    crop_name:     str
    quantity_kg:   float
    grow_weeks:    int
    reason:        str
    sqft_allocated: float = 0.0
