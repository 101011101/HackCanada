# DataKit PRD — Data Variables & Measurement Kits

This document defines every data variable the MyCelium network uses for plot suitability and optimization, how each can be measured, how it is captured in the UI, and which physical kits we send to nodes to collect that data.

---

## Data Entry: Manual Form & Plot Area

When creating or editing a farm, the user can **manually enter all of the data variables** listed in this document. The app provides a form (dropdowns and numeric inputs as specified in §1 and §2) so that every variable — soil, climate, water, site, and access — can be filled in without any physical kit. Kits are optional and improve accuracy for chemistry and climate; they are not required to create or update a farm.

**Land plot area** is captured separately via **AR scan** (a different component of the project; see that component’s documentation for scope and behavior). This PRD does not define the AR flow; it only notes that plot area is obtained via AR and that the rest of the farm data is entered manually in the create/edit farm flow.

---

## 1. Data Variables Reference

All variables that a node (farmer) may supply. The optimization engine uses these to build the digital twin and compute suitability and assignments.

### 1.1 Soil — Physical & Structure

| Variable | What It Represents | How It Can Be Measured | Input Type (UI) |
|----------|--------------------|-------------------------|-----------------|
| **Soil Texture** | Ratio of sand, silt, and clay affecting drainage and root growth | Soil laboratory analysis or field texture test (ribbon, feel, jar test) | Dropdown (Sand, Sandy Loam, Loam, Silt Loam, Clay Loam, Clay) |
| **Soil Depth** | Depth available for root penetration | Soil pit measurement or soil survey | Numeric input (cm) |
| **Drainage** | How well water moves through soil | Field observation or soil survey classification | Dropdown (Poor, Moderate, Well-drained) |

### 1.2 Soil — Chemistry & Nutrients

| Variable | What It Represents | How It Can Be Measured | Input Type (UI) |
|----------|--------------------|-------------------------|-----------------|
| **Soil pH** | Acidity or alkalinity of soil | Soil pH meter, pH strips, or soil lab test | Numeric input (range ~3–10) |
| **Soil Organic Matter** | Amount of decomposed biological material improving fertility | Soil laboratory test (% organic matter) | Numeric input (%) |
| **Nitrogen (N)** | Essential nutrient supporting vegetative growth | Soil nutrient test kit or laboratory analysis (ppm or mg/kg) | Numeric input |
| **Phosphorus (P)** | Nutrient supporting root development and flowering | Soil nutrient test kit or laboratory analysis (ppm or mg/kg) | Numeric input |
| **Potassium (K)** | Nutrient influencing water regulation and plant strength | Soil nutrient test kit or laboratory analysis (ppm or mg/kg) | Numeric input |
| **Salinity** | Salt concentration affecting plant growth | Electrical conductivity test (dS/m) | Numeric input |

### 1.3 Climate & Season

| Variable | What It Represents | How It Can Be Measured | Input Type (UI) |
|----------|--------------------|-------------------------|-----------------|
| **Average Temperature** | Typical temperature during the growing season | Weather station data or climate databases (°C) | Numeric input (°C) |
| **Growing Season Length** | Number of frost-free days available for crop growth | Historical climate records | Numeric input (days) |
| **Rainfall Distribution** | Timing and seasonal pattern of rainfall | Climate records or meteorological datasets | Dropdown (Even, Seasonal, Monsoon-like, Irregular) |
| **Sunlight Exposure** | Amount of solar radiation received | Weather or satellite data (hours/day or MJ/m²) | Numeric input (hours/day or MJ/m²) |

### 1.4 Water

| Variable | What It Represents | How It Can Be Measured | Input Type (UI) |
|----------|--------------------|-------------------------|-----------------|
| **Water Availability** | Access to water for irrigation | Survey of water sources or infrastructure | Dropdown (None, Rain-fed only, Irrigation available) |
| **Water Quality** | Suitability of irrigation water for crops | Water laboratory analysis (salinity, pH, contaminants) | Numeric input (e.g. EC dS/m, pH, or composite score) |

### 1.5 Site & Access

| Variable | What It Represents | How It Can Be Measured | Input Type (UI) |
|----------|--------------------|-------------------------|-----------------|
| **Aspect** | Direction the land slope faces affecting sunlight exposure | Compass measurement or GIS analysis | Dropdown (N, NE, E, SE, S, SW, W, NW) |

---

## 2. Input Types — UI Conventions

| Input Type | Example Use | Validation / Notes |
|------------|-------------|--------------------|
| **Dropdown** | Texture, Drainage, Rainfall, Water Availability, Aspect | Fixed options; no free text. |
| **Numeric** | pH, %, ppm, cm, °C, days, km, dS/m, hours/day | Min/max and unit shown; decimals where appropriate. |
| **Optional fields** | Organic matter, N/P/K, Water quality | Not all nodes have lab access; allow “Unknown” or skip. |

---

## 3. Measurement Kits — Overview

Kits are grouped by **measurement method** so that each kit contains tools that are used together and share similar skill level and cost. We only ship materials for variables that require instruments; **soil physical (texture, depth, drainage), site (aspect), and water availability** are answerable by eye or intuitive self-report, so no kit is sent for those.

| Kit | Purpose | Typical Users |
|-----|---------|----------------|
| **A. Soil Chemistry Kit** | pH, salinity, N-P-K (and optionally water quality) | Any node doing soil testing |
| **C. Climate & Light Kit** | Temperature, sunlight (optional); other climate vars often from app/location | Nodes without reliable location-based climate data |

---

## 4. Kit Specifications

### Kit A — Soil Chemistry Kit

**Variables covered:** Soil pH, Salinity, Nitrogen (N), Phosphorus (P), Potassium (K); optionally Water Quality.

| Tool | Measures | How Used | Notes |
|------|----------|----------|--------|
| **pH meter or pH strips** | Soil pH | Probe or strip in soil slurry; read value | Meter: more accurate, reusable. Strips: low cost, single-use. |
| **EC meter** | Salinity (electrical conductivity, dS/m) | Probe in soil slurry or water sample | Same device can be used for irrigation water quality (salinity). |
| **N-P-K test kit** | N, P, K (ppm or mg/kg) | Colorimetric or test-strip comparison to chart | Single kit often includes all three; follow kit’s unit (ppm/mg/kg). |

**Optional add-on:** Water quality strips or lab send-in for irrigation water (pH, EC, contaminants). If strips are included, group with Kit A.

**Not in kit:** Soil organic matter — requires lab (e.g. loss-on-ignition). User enters % from external lab or leaves blank.

---

### Kit C — Climate & Light Kit

**Variables covered:** Average Temperature, Growing Season Length, Rainfall Distribution, Sunlight Exposure.

| Tool | Measures | How Used | Notes |
|------|----------|----------|--------|
| **Thermometer** | Local temperature (°C) | Place in shade; read during growing hours; optional multi-day average | For nodes that don’t trust or have location-based climate. |
| **Light meter (optional)** | Sunlight exposure (hours/day or relative intensity) | Measure at plot at peak sun; convert to hours or MJ/m² if calibrated | Optional; otherwise derive from location + aspect or user estimate. |

**App/location-based (no tool):** Average temperature, growing season length, and rainfall distribution can be auto-filled from location + climate APIs (e.g. weather station or satellite). Kit C is for validation or when API data is missing.

---

## 5. Open Decisions (Datakit)

- **Unit standardization:** N, P, K in ppm vs mg/kg — support both and convert in backend, or pick one and document.
- **Optional vs required:** Which variables are required for optimization vs optional (e.g. N-P-K optional for MVP).
- **OCR:** Which kit readings (e.g. pH, EC, N-P-K strip) are in scope for photo → OCR in the app.
- **Supply model:** MyCelium-supplied kits vs partner/subsidy vs user self-sourced; affects packaging and instructions.
