# Data Schema — MyCelium Network

This document is the canonical reference for every entity in the MyCelium system, their fields, types, allowed values, and the relationships between them. It covers the engine layer (Python dataclasses), the API layer (Pydantic models), and the JSON storage files.

---

## Entity Map

```
NetworkConfig
    │
    ├─ food_targets ──────────────────────────────► Crop (id)
    │
FarmNode ─── current_crop_id / current_crop_ids ──► Crop (id)
FarmNode ─── preferred_crop_ids ─────────────────► Crop (id)
    │
    └─ yield_history ─ {crop_id: [kg, ...]}
    │
HubNode ─── local_demand ─ {crop_id: kg}  ───────► Crop (id)
    │
    └─ (proximity) ───────────────────────────────► FarmNode (lat/lng)

assignments.json ─── {farm_id: [crop_id, ...]}  ──► FarmNode + Crop

InstructionBundle ─ (derived) ────────────────────► FarmNode + Crop
```

---

## 1. `FarmNode` — The Farm / Urban Growing Plot

**Source:** `app/engine/schemas.py` · **Stored in:** `data/farms.json`

### 1a. Core Identity & Location

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Primary key |
| `name` | `str` | Human label (e.g. "Farm #01 — Balcony") |
| `lat` | `float` | Latitude (WGS-84) |
| `lng` | `float` | Longitude (WGS-84) |

### 1b. Plot Characteristics

| Field | Type | Allowed Values | Description |
|-------|------|---------------|-------------|
| `plot_size_sqft` | `float` | > 0 | Total plot area in square feet |
| `plot_type` | `str` | `balcony` · `rooftop` · `backyard` · `community` | Physical context of the plot |
| `tools` | `str` | `basic` · `intermediate` · `advanced` | Farmer's tool capability (ordinal) |
| `budget` | `str` | `low` · `medium` · `high` | Farmer's spend level (ordinal) |

### 1c. Lifecycle State

| Field | Type | Allowed Values | Description |
|-------|------|---------------|-------------|
| `status` | `str` | `new` · `available` · `growing` | Current assignment state |
| `current_crop_id` | `int?` | Crop `id` or `null` | Legacy single-crop lock (deprecated; use `current_crop_ids`) |
| `current_crop_ids` | `list[int]` | List of Crop `id`s | Crops currently growing (locked) |
| `cycle_end_date` | `date?` | ISO-8601 date | When the current cycle ends (locked farms only) |
| `yield_history` | `dict` | `{crop_id: [kg, ...]}` | Historical yield per crop, per past cycle |
| `preferred_crop_ids` | `list[int]` | List of Crop `id`s | Farmer-selected crop preferences (boosts ILP objective) |

**Status state machine:**
```
new ──► available ──► growing ──► available
                                 (cycle ends)
```

### 1d. Core Sensor Readings (Always Required)

| Field | Type | Unit | Notes |
|-------|------|------|-------|
| `pH` | `float` | pH 3–10 | Soil acidity |
| `moisture` | `float` | % 0–100 | Soil moisture proxy |
| `temperature` | `float` | °C | Ambient / growing temperature |
| `humidity` | `float` | % 0–100 | Stored but not scored in suitability |

### 1e. DataKit Variables (All Optional — `None` = unmeasured)

#### Soil Physical (Kit: visual / self-report)

| Field | Type | Unit | Allowed Values |
|-------|------|------|---------------|
| `soil_texture` | `str?` | — | `sand` · `sandy_loam` · `loam` · `silt_loam` · `clay_loam` · `clay` |
| `soil_depth_cm` | `float?` | cm | Continuous |
| `drainage` | `str?` | — | `poor` · `moderate` · `well` |

#### Soil Chemistry (Kit A)

| Field | Type | Unit | Notes |
|-------|------|------|-------|
| `organic_matter_pct` | `float?` | % | Lab test; often left blank |
| `nitrogen_ppm` | `float?` | ppm (mg/kg) | N-P-K strip or lab |
| `phosphorus_ppm` | `float?` | ppm | N-P-K strip or lab |
| `potassium_ppm` | `float?` | ppm | N-P-K strip or lab |
| `salinity_ds_m` | `float?` | dS/m | EC meter |

#### Climate & Season (Kit C or location-derived)

| Field | Type | Unit | Notes |
|-------|------|------|-------|
| `growing_season_days` | `float?` | days | Frost-free period |
| `rainfall_distribution` | `str?` | — | `even` · `seasonal` · `monsoon` · `irregular` |
| `sunlight_hours_day` | `float?` | hours/day | Light meter or satellite |

#### Water

| Field | Type | Unit | Allowed Values |
|-------|------|------|---------------|
| `water_availability` | `str?` | — | `none` · `rain_fed` · `irrigation` |
| `water_quality_ec` | `float?` | dS/m | EC of irrigation water |

#### Site

| Field | Type | Allowed Values |
|-------|------|---------------|
| `aspect` | `str?` | `N` · `NE` · `E` · `SE` · `S` · `SW` · `W` · `NW` |

---

## 2. `Crop` — A Growable Crop Type

**Source:** `app/engine/schemas.py` · **Stored in:** `data/crops.json`

### 2a. Identity & Requirements

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Primary key (0–9 in seed data) |
| `name` | `str` | Display name (e.g. "Tomato") |
| `color` | `str` | Hex colour for UI rendering |
| `min_sqft` | `float` | Minimum plot area required |
| `tool_requirement` | `str` | `basic` · `intermediate` · `advanced` |
| `budget_requirement` | `str` | `low` · `medium` · `high` |

### 2b. Yield & Network Role

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `base_yield_per_sqft` | `float` | kg/sqft/cycle | Ideal-conditions yield |
| `grow_weeks` | `int` | weeks | One full growing cycle length |
| `network_target_share` | `float` | fraction 0–1 | Ideal share of network growing this crop |

### 2c. Core Optimal Ranges (Always Present)

| Field | Type | Description |
|-------|------|-------------|
| `optimal_pH` | `tuple(float, float)` | Acceptable pH range |
| `optimal_moisture` | `tuple(float, float)` | Acceptable moisture % range |
| `optimal_temp` | `tuple(float, float)` | Acceptable temperature °C range |

### 2d. DataKit Optimal Ranges (`None` = crop has no preference for this variable)

Continuous ranges are `(min, max)` tuples. Categorical preferences are tuples of accepted string values.

| Field | Type | Matches FarmNode Field |
|-------|------|----------------------|
| `optimal_soil_depth_cm` | `tuple(float,float)?` | `soil_depth_cm` |
| `optimal_organic_matter` | `tuple(float,float)?` | `organic_matter_pct` |
| `optimal_nitrogen_ppm` | `tuple(float,float)?` | `nitrogen_ppm` |
| `optimal_phosphorus_ppm` | `tuple(float,float)?` | `phosphorus_ppm` |
| `optimal_potassium_ppm` | `tuple(float,float)?` | `potassium_ppm` |
| `optimal_salinity_ds_m` | `tuple(float,float)?` | `salinity_ds_m` |
| `optimal_growing_season_days` | `tuple(float,float)?` | `growing_season_days` |
| `optimal_sunlight_hours` | `tuple(float,float)?` | `sunlight_hours_day` |
| `optimal_water_quality_ec` | `tuple(float,float)?` | `water_quality_ec` |
| `optimal_soil_textures` | `tuple(str,...)?` | `soil_texture` |
| `preferred_drainage` | `tuple(str,...)?` | `drainage` |
| `preferred_rainfall` | `tuple(str,...)?` | `rainfall_distribution` |
| `preferred_water_availability` | `tuple(str,...)?` | `water_availability` |
| `preferred_aspects` | `tuple(str,...)?` | `aspect` |

### 2e. Seed Crop Catalogue

| ID | Name | min_sqft | Tools | Budget | grow_weeks | base_yield (kg/sqft) | target_share |
|----|------|----------|-------|--------|------------|----------------------|-------------|
| 0 | Tomato | 10 | basic | low | 10 | 2.5 | 15% |
| 1 | Lettuce | 4 | basic | low | 4 | 1.5 | 15% |
| 2 | Spinach | 4 | basic | low | 4 | 1.2 | 10% |
| 3 | Herbs | 2 | basic | low | 6 | 0.8 | 10% |
| 4 | Carrots | 6 | basic | low | 10 | 2.0 | 10% |
| 5 | Kale | 4 | basic | low | 6 | 1.3 | 10% |
| 6 | Peppers | 8 | intermediate | low | 12 | 1.8 | 10% |
| 7 | Microgreens | 2 | basic | low | 2 | 0.5 | 10% |
| 8 | Strawberries | 6 | intermediate | medium | 8 | 1.5 | 5% |
| 9 | Beans | 6 | basic | low | 8 | 1.0 | 5% |

---

## 3. `HubNode` — Food Distribution Hub

**Source:** `app/engine/schemas.py` · **Stored in:** `data/hubs.json`

| Field | Type | Allowed Values | Description |
|-------|------|---------------|-------------|
| `id` | `int` | — | Primary key |
| `name` | `str` | — | Display name |
| `lat` | `float` | — | Latitude |
| `lng` | `float` | — | Longitude |
| `priority` | `str` | `critical` · `standard` | Fulfillment priority (critical hubs must be served first) |
| `capacity_kg` | `float` | kg | Max intake per cycle |
| `local_demand` | `dict` | `{crop_id: kg}` | Per-crop demand this hub needs per cycle |

### Seed Hubs (Toronto)

| ID | Name | Priority | Capacity |
|----|------|----------|---------|
| 0 | Greenwood Public School | critical | 500 kg |
| 1 | North Community Centre | standard | 300 kg |
| 2 | East Neighbourhood Hub | standard | 300 kg |

---

## 4. `NetworkConfig` — Global Optimization Parameters

**Source:** `app/engine/schemas.py` · **Stored in:** `data/config.json`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_travel_distance` | `float` | 5000 m | Max farm-to-hub routing distance |
| `food_targets` | `dict` | `{crop_id: kg}` | Network-wide yield goal per crop per cycle |
| `epoch_weeks` | `int` | 4 | Planning horizon in weeks |
| `inertia_weight` | `float` | 50.0 | ILP penalty (γ) for changing a farm's assignment |
| `overproduction_buffer` | `float` | 0.20 | Allowed surplus fraction above target (20%) |
| `preference_weight` | `float` | 30.0 | Objective boost for farmer-preferred crops |
| `min_slot_sqft` | `float` | 50.0 | Minimum sqft per crop zone in multi-crop split |

---

## 5. `assignments.json` — Runtime Assignment State

**Format:** `{farm_id (str): [crop_id (int), ...]}` — multi-crop list per farm.

This file is the output of the ILP optimizer and the source of truth for what each farm should be growing next cycle. It is separate from `farms.json` so that it can be rewritten each optimize run without touching farm data.

**Migration note:** old format was `{farm_id: int}` (single crop); the storage layer auto-upgrades to `[int]` on load.

---

## 6. `InstructionBundle` — Optimizer Output (Derived, Not Stored)

**Source:** `app/engine/schemas.py` — produced by the optimizer and returned in API responses; never persisted directly.

| Field | Type | Description |
|-------|------|-------------|
| `farm_id` | `int` | FK → FarmNode |
| `farm_name` | `str` | Denormalized for display |
| `crop_id` | `int` | FK → Crop |
| `crop_name` | `str` | Denormalized for display |
| `quantity_kg` | `float` | Expected yield this cycle |
| `grow_weeks` | `int` | Cycle length |
| `reason` | `str` | Human-readable explanation from optimizer |
| `sqft_allocated` | `float` | Plot area assigned to this crop (multi-crop) |

---

## 7. API Layer — Request & Response Models

**Source:** `app/api/models.py` (Pydantic)

### 7a. Inbound Requests

#### `NewFarmRequest` — `POST /nodes`
Creates a new FarmNode. Wraps the core + sensor fields; DataKit fields are not in this request (entered separately or left as `None`).

| Field | Type |
|-------|------|
| `name` | `str` |
| `lat`, `lng` | `float` |
| `plot_size_sqft` | `float` |
| `plot_type` | `str` — balcony · rooftop · backyard · community |
| `tools` | `str` — basic · intermediate · advanced |
| `budget` | `str` — low · medium · high |
| `pH`, `moisture`, `temperature`, `humidity` | `float` |
| `preferred_crop_ids` | `list[int]` (default `[]`) |

#### `SoilUpdateRequest` — `PATCH /nodes/{id}/soil`
Partial update for the four core sensor readings.

| Field | Type |
|-------|------|
| `pH`, `moisture`, `temperature`, `humidity` | `float` |

#### `ConfigUpdateRequest` — `PATCH /config`
Any combination of config fields (all optional).

| Field | Type |
|-------|------|
| `max_travel_distance` | `float?` |
| `food_targets` | `dict?` — `{crop_id_str: kg}` |
| `epoch_weeks` | `int?` |
| `inertia_weight` | `float?` |
| `overproduction_buffer` | `float?` |

#### `HubUpdateRequest` — `PATCH /hubs/{id}`

| Field | Type |
|-------|------|
| `local_demand` | `dict?` — `{crop_id_str: kg}` |
| `capacity_kg` | `float?` |
| `priority` | `str?` — critical · standard |

### 7b. Outbound Responses

#### `BundleResponse` — item in assignment list

| Field | Type | Description |
|-------|------|-------------|
| `farm_id`, `farm_name` | int / str | |
| `crop_id`, `crop_name` | int / str | |
| `quantity_kg` | `float` | Expected yield |
| `grow_weeks` | `int` | |
| `reason` | `str` | Optimizer reasoning |
| `preference_match` | `bool` | True if crop was farmer-preferred |
| `sqft_allocated` | `float?` | Multi-crop zone size |

#### `AssignmentsResponse` — `GET /assignments`

| Field | Type |
|-------|------|
| `assignments` | `list[BundleResponse]` |
| `locked_farms` | `list[LockedFarmResponse]` |
| `network_health_pct` | `float` |

#### `ReportResponse` — `GET /report`

| Field | Type | Description |
|-------|------|-------------|
| `network_health_pct` | `float` | % of network targets met |
| `total_yield_kg` | `float` | Projected kg across all assigned farms |
| `farms_total` | `int` | |
| `farms_assigned` | `int` | |
| `farms_locked` | `int` | Currently growing |
| `coverage_by_crop` | `dict` | `{crop_name: {target_kg, supplied_kg, gap_pct, surplus_kg, met}}` |
| `hub_coverage` | `dict` | `{hub_name: {priority, capacity_kg, crops: {...}}}` |
| `unlocking_soon` | `list[UnlockingSoonItem]` | Farms with cycles ending within ~2 weeks |
| `overproduction_alerts` | `list[OverproductionAlert]` | Crops exceeding target + buffer |

---

## 8. Scoring & Suitability Computation

The scorer (`app/engine/scorer.py`) derives a `suitability` score (0–1) for every (FarmNode, Crop) pair:

1. **Hard gates** (fail = score 0.0):
   - `plot_size_sqft >= crop.min_sqft`
   - `TOOL_RANK[farm.tools] >= TOOL_RANK[crop.tool_requirement]`
   - `BUDGET_RANK[farm.budget] >= BUDGET_RANK[crop.budget_requirement]`

2. **Soft dimensions** (mean of all scores):
   - Continuous: `range_score(farm_val, crop_min, crop_max)` → 1.0 inside range, linear decay outside
   - Categorical: 1.0 if farm value in crop's preferred set, else 0.0
   - Unknown / unmeasured farm field: `0.6` (optimistic default — below 1.0 to avoid inflating unmeasured farms)

3. **Expected yield** = `suitability × crop.base_yield_per_sqft × farm.plot_size_sqft`

The optimizer (ILP via PuLP) maximises total yield subject to: supply ≤ `target × (1 + overproduction_buffer)`, farm continuity via `inertia_weight`, and hub routing via `max_travel_distance`.

---

## 9. Storage File Summary

| File | Contents | Format |
|------|----------|--------|
| `data/farms.json` | All FarmNode records | `list[FarmNode dict]` |
| `data/crops.json` | All Crop records | `list[Crop dict]` |
| `data/hubs.json` | All HubNode records | `list[HubNode dict]` |
| `data/config.json` | Single NetworkConfig | `NetworkConfig dict` |
| `data/assignments.json` | Current epoch assignments | `{farm_id_str: [crop_id, ...]}` |

---

## 10. Field Ordinal Rankings

Used for hard-gate comparisons (higher rank ≥ lower rank):

| Rank | `tools` value | `budget` value |
|------|--------------|----------------|
| 0 | `basic` | `low` |
| 1 | `intermediate` | `medium` |
| 2 | `advanced` | `high` |
