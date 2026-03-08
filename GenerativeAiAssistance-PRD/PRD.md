# Generative AI Task Generation — PRD

## Overview

Replace the static `CROP_TASKS` dictionary with Gemini-generated, farm-personalized tasks. Tasks are generated **eagerly at assignment time** (Option B) so the user's dashboard always shows AI-tailored tasks with zero GET latency.

---

## Problem Statement

Currently, every farm assigned Tomatoes gets the exact same 7 tasks regardless of whether they have a 12 sqft balcony with basic tools or a 400 sqft community lot with advanced equipment. The `CROP_TASKS` dict in `engine/data.py` is completely static.

The engine already knows everything about each farm — soil chemistry, tools, budget, plot type, yield target, hub priority — but none of that context reaches the task list.

---

## Solution: Eager Gemini Generation at Assignment Time

When the engine assigns crops to a farm (via optimize, new node, crop update, or cycle-end), call Gemini once per farm+crop combination to generate a personalized task list. Store the result in a JSON cache file. The existing `GET /nodes/{farm_id}/tasks` endpoint reads from cache first, falls back to static tasks if no cache entry exists.

---

## Architecture

### New Files

#### `app/backend/engine/gemini_tasks.py`
All Gemini interaction lives here. Three functions:

1. **`build_task_prompt(farm, crop, sqft_allocated, quantity_kg, cycle_number, hub_name, hub_priority) → str`**
   Constructs the prompt with all farm+crop+network variables.

2. **`call_gemini(prompt: str) → list[dict] | None`**
   Calls `gemini-2.0-flash` with `response_mime_type='application/json'`. Validates structure. Returns `None` on any failure.

3. **`generate_tasks_for_farm(farm, crop, sqft_allocated, quantity_kg, hub_name, hub_priority) → list[dict] | None`**
   Composes the above two. Adds `crop_id` and `crop_name` to each task dict. Called by all assignment routes.

#### `app/backend/api/ai_task_cache.py`
Cache layer for `data/ai_tasks.json`. Cache key: `"{farm_id}_{crop_id}_{cycle_number}"`.

Functions:
- `load_ai_tasks() → dict`
- `save_ai_tasks(cache: dict) → None`
- `get_cached_tasks(farm_id, crop_id, cycle_number) → list[dict] | None`
- `set_cached_tasks(farm_id, crop_id, cycle_number, tasks) → None`
- `invalidate_farm_tasks(farm_id) → None` — removes all keys starting with `"{farm_id}_"`

### Modified Files

#### `app/backend/api/routes/nodes.py`
- **`add_node` (POST /nodes):** After `save_assignments`, call `generate_tasks_for_farm` for each assigned crop → `set_cached_tasks`.
- **`update_farm_crops` (PATCH /nodes/{id}/crops):** `invalidate_farm_tasks` then generate for each new crop.
- **`cycle_end` (POST /nodes/{id}/cycle-end):** `invalidate_farm_tasks` then generate for each newly assigned crop.
- **`get_farm_tasks` (GET /nodes/{id}/tasks):** Check `get_cached_tasks` first. On hit, use AI tasks. On miss, use static `CROP_TASKS` (existing logic unchanged).

#### `app/backend/api/routes/optimize.py`
- After `save_assignments`: for each assigned farm, `invalidate_farm_tasks` then call `generate_tasks_for_farm` per crop. Sequential (no parallelism) to avoid rate limit bursts.

---

## Data Contract

### Cache File: `data/ai_tasks.json`
```json
{
  "3_1_2": [
    {
      "id": 1,
      "crop_id": 1,
      "crop_name": "Lettuce",
      "title": "Prepare cool raised bed",
      "subtitle": "Rake + compost · 25 min",
      "why": "Your pH 7.0 is slightly high for lettuce — mixing in compost will buffer it toward the 6.0–7.0 optimal.",
      "how": "Rake the community lot surface smooth. Work in 3 cm of acidic compost. Water lightly to settle.",
      "target": "Fine, moist seedbed with pH closer to 6.5",
      "tools_required": "rake, compost, pH meter",
      "day_from_start": 0
    }
  ]
}
```

### Gemini Prompt Template
```
System: You are an expert urban farming assistant. Given a specific farm's
conditions and an assigned crop, generate a set of actionable growing tasks.

User: Farm profile:
- Plot type: {plot_type} | Size: {sqft_allocated} sqft allocated | Tools: {tools} | Budget: {budget}
- Soil: pH {pH}, moisture {moisture}%, temp {temperature}°C, humidity {humidity}%
- Sunlight: {sunlight_hours} hrs/day | Drainage: {drainage} | Aspect: {aspect}
- Nutrients: N={nitrogen_ppm}ppm, P={phosphorus_ppm}ppm, K={potassium_ppm}ppm
- Water availability: {water_availability}

Assigned crop: {crop_name}
- Grow cycle: {grow_weeks} weeks ({total_days} days total)
- Optimal pH: {optimal_pH[0]}–{optimal_pH[1]}
- Optimal moisture: {optimal_moisture[0]}–{optimal_moisture[1]}%
- Optimal temp: {optimal_temp[0]}–{optimal_temp[1]}°C
- Expected yield: {quantity_kg} kg | Cycle #{cycle_number}

Delivery hub: {hub_name} ({hub_priority} priority)

Generate 5–8 farming tasks for this complete grow cycle.
Return a JSON array. Each object must have exactly these fields:
- id: integer (1-based, sequential)
- title: string (short action label, max 30 chars)
- subtitle: string (tools needed + time estimate, e.g. "Trowel · 20 min")
- why: string (1 sentence — explain why this task matters for THIS farm's specific conditions)
- how: string (2–3 sentences — step-by-step instructions adapted to this farm's tools and plot type)
- target: string (measurable success indicator)
- tools_required: string (comma-separated)
- day_from_start: integer (day in cycle to perform task, spread across {total_days} days)

Tasks MUST reference actual farm conditions (e.g. mention the specific pH reading,
tool tier, plot type constraints). Do not generate generic crop advice.
```

---

## Trigger Points

| Event | Route | Gemini Calls |
|---|---|---|
| New farm joins | POST /nodes | 1 per assigned crop |
| User updates crops | PATCH /nodes/{id}/crops | 1 per new crop |
| Cycle completes | POST /nodes/{id}/cycle-end | 1 per re-assigned crop |
| Admin runs optimize | POST /optimize | 1 per (available farm × crop) |

---

## Fallback Behaviour

If `generate_tasks_for_farm` returns `None` (Gemini unavailable, parse error, validation failure, network timeout), no cache entry is written. `GET /nodes/{farm_id}/tasks` finds no cache entry and falls through to the static `CROP_TASKS[crop_id]` lookup — identical to current behaviour. No error is surfaced to the user.

---

## Environment Variable

`GEMINI_API_KEY` — must be set in the server environment. If not set, `call_gemini` returns `None` immediately (no crash).

---

## Acceptance Criteria

| ID | Criteria |
|---|---|
| AC-001 | After POST /nodes, `ai_tasks.json` contains entries for the new farm's assigned crops |
| AC-002 | GET /nodes/{id}/tasks returns AI tasks when cache hit exists |
| AC-003 | GET /nodes/{id}/tasks returns static tasks when cache miss |
| AC-004 | Gemini failure is silent — static tasks served, no 500 error |
| AC-005 | Cycle-end invalidates old cache entries before writing new ones |
| AC-006 | Two farms with same crop but different soil have different `why`/`how` text |
| AC-007 | POST /optimize populates cache for all N assigned farms |

---

## Implementation Checklist

### Phase 1: Service Layer
- [ ] Create `app/backend/engine/gemini_tasks.py`
  - [ ] `build_task_prompt(...)` — includes all farm+crop+hub variables
  - [ ] `call_gemini(prompt)` — structured JSON mode, validates required keys, returns None on any failure
  - [ ] `generate_tasks_for_farm(...)` — composes above, injects crop_id + crop_name

### Phase 2: Cache Layer
- [ ] Create `app/backend/api/ai_task_cache.py`
  - [ ] `load_ai_tasks()` / `save_ai_tasks()`
  - [ ] `get_cached_tasks(farm_id, crop_id, cycle_number)`
  - [ ] `set_cached_tasks(farm_id, crop_id, cycle_number, tasks)`
  - [ ] `invalidate_farm_tasks(farm_id)`

### Phase 3: Route Integration — nodes.py
- [ ] Add imports (`generate_tasks_for_farm`, cache functions)
- [ ] `add_node`: generate + cache after assignment
- [ ] `update_farm_crops`: invalidate + generate + cache after assignment
- [ ] `cycle_end`: invalidate + generate + cache after assignment
- [ ] `get_farm_tasks`: cache-first lookup, static fallback

### Phase 4: Route Integration — optimize.py
- [ ] Add imports
- [ ] After `save_assignments`: load hub_routing, iterate assigned farms, invalidate + generate + cache

### Phase 5: Validation
- [ ] POST /nodes → check `ai_tasks.json` has correct key
- [ ] GET /nodes/{id}/tasks → returns AI tasks (not static)
- [ ] Kill `GEMINI_API_KEY` env var → GET returns static tasks, no error
- [ ] POST /optimize → all assigned farms have cache entries
