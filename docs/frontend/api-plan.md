I now have a complete picture of the entire stack. Here is the planning document.

---

# Add New Plot — API Planning Document

## 0. Orientation: What Already Exists

| Layer | Status |
|---|---|
| `POST /nodes` | Exists. `createNode()` in api.ts exists. |
| `GET /nodes/{farmId}/data` | Exists. `getSoilData()` in api.ts exists. |
| `POST /suggestions` | Exists. **No frontend function exists yet.** |
| `GET /nodes/{farmId}` | Exists. `getNode()` in api.ts exists. |
| FarmContext `join()` | Exists but only tracks a single `farmId`. |

---

## 1. Full Sequence of Calls

```
AddPlotSheet opens
        │
        ▼
[CALL 1] GET /nodes/{currentFarmId}/data
        │  → pre-fill soil fields (pH, moisture, temperature, humidity)
        │
        ▼
User fills: name, plot_size_sqft, plot_type, tools, budget,
            sunlight_hours (localStorage-only), soil fields
        │
        ▼  (user taps "Next" / "Get crop suggestions")
[CALL 2] POST /suggestions
        │  → ranked SuggestionItem[]
        │
        ▼
User views ranked crops, picks preferred_crop_ids
        │
        ▼  (user taps "Confirm")
[CALL 3] POST /nodes
        │  → BundleResponse[] (new farm fully created + assigned)
        │
        ▼
Frontend: extract farm_id from bundles[0].farm_id
          write sunlight_hours to localStorage
          call switchFarm(newFarmId, lat, lng)
          sheet closes → Dashboard re-renders for new farmId
        │
        ▼
[CALL 4] GET /nodes/{newFarmId}/tasks   (Dashboard load, already in api.ts)
[CALL 4] GET /nodes/{newFarmId}         (Dashboard load, already in api.ts)
```

---

## 2. Call 1 — Pre-fill Soil Data

**Method + endpoint:** `GET /nodes/{currentFarmId}/data`

**Request:** No body. `currentFarmId` comes from `useFarm().farmId`.

**Response shape** (`SoilReadingResponse`):
```typescript
{
  farm_id:     number,
  pH:          number,   // e.g. 6.8
  moisture:    number,   // e.g. 55.0
  temperature: number,   // e.g. 21.0
  humidity:    number,   // e.g. 60.0
}
```

**Frontend state it populates:** Local draft state inside `AddPlotSheet`:
```typescript
{ pH: number, moisture: number, temperature: number, humidity: number }
```
These become the initial values for the soil/climate form fields — editable by the user.

**Error cases:**
- `404` — No existing farm yet (first-time user won't reach AddPlotSheet anyway, so this is theoretically unreachable, but handle gracefully: show form with default values `pH=7.0, moisture=50, temperature=20, humidity=60`).
- Network error — Same fallback to defaults, do not block the sheet from opening.

**Existing api.ts function:** `getSoilData(farmId)` — already exists. No new function needed.

---

## 3. Call 2 — Get Crop Suggestions

**Method + endpoint:** `POST /suggestions`

**Request payload** (`SuggestionRequest`):
```typescript
{
  plot_size_sqft:     number,   // from form field
  plot_type:          string,   // 'balcony' | 'rooftop' | 'backyard' | 'community' — from form
  tools:              string,   // 'basic' | 'intermediate' | 'advanced' — from form
  budget:             string,   // 'low' | 'medium' | 'high' — from form
  pH:                 number,   // from soil pre-fill / user edit — optional, server defaults to 6.5
  moisture:           number,   // from soil pre-fill / user edit — optional, server defaults to 60.0
  temperature:        number,   // from soil pre-fill / user edit — optional, server defaults to 20.0
  preferred_crop_ids: number[], // [] at this stage — user hasn't picked yet
}
```

Note: `humidity` is NOT part of `SuggestionRequest`. The backend uses a hardcoded default of `60.0` for the temporary farm node used in scoring. Do not send it.

**Response shape** (`SuggestionItem[]`), sorted by `suitability_pct` descending:
```typescript
Array<{
  crop_id:            number,
  crop_name:          string,
  suitability_pct:    number,   // e.g. 87.5
  estimated_yield_kg: number,
  grow_weeks:         number,
  reason:             string,   // human-readable explanation
}>
```

**Frontend state it populates:** `SuggestionItem[]` in AddPlotSheet local state, rendered as a selectable list. User taps crops to build `selectedCropIds: number[]`.

**Error cases:**
- `422` Validation error — a required field is missing or out of range. Show inline form error, do not navigate to the crop picker screen.
- Network error — show a toast/error message, keep user on the form.
- Empty array returned (all crops have `suitability <= 0`) — unlikely but possible. Show "No suitable crops found for these conditions" message. Allow user to go back and adjust soil values.

**Existing api.ts function:** None. **New function required:**
```typescript
// Add to api.ts
import type { SuggestionItem, SuggestionRequest } from '../types';

export function getSuggestions(body: SuggestionRequest): Promise<SuggestionItem[]> {
  return request<SuggestionItem[]>('/suggestions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
```

**New types required** (add to types.ts):
```typescript
export interface SuggestionRequest {
  plot_size_sqft:     number;
  plot_type:          string;
  tools:              string;
  budget:             string;
  pH?:                number;
  moisture?:          number;
  temperature?:       number;
  preferred_crop_ids: number[];
}

export interface SuggestionItem {
  crop_id:            number;
  crop_name:          string;
  suitability_pct:    number;
  estimated_yield_kg: number;
  grow_weeks:         number;
  reason:             string;
}
```

---

## 4. Call 3 — Create the New Farm (Confirm)

**Method + endpoint:** `POST /nodes`

**Request payload** (`NewFarmRequest`) — every field, source annotated:
```typescript
{
  name:               string,   // user-entered farm name
  lat:                number,   // COPIED from existing farm — see lat/lng section below
  lng:                number,   // COPIED from existing farm — see lat/lng section below
  plot_size_sqft:     number,   // from form field
  plot_type:          string,   // 'balcony' | 'rooftop' | 'backyard' | 'community'
  tools:              string,   // 'basic' | 'intermediate' | 'advanced'
  budget:             string,   // 'low' | 'medium' | 'high'
  pH:                 number,   // from form (pre-filled then possibly edited)
  moisture:           number,   // from form
  temperature:        number,   // from form
  humidity:           number,   // from form (not shown in suggestions but required here)
  preferred_crop_ids: number[], // crop_ids the user selected in step 2
}
```

**Response shape** (`BundleResponse[]`) — one entry per assigned crop slot:
```typescript
Array<{
  farm_id:          number,   // THE NEW farm_id — use this to switch context
  farm_name:        string,
  crop_id:          number,
  crop_name:        string,
  quantity_kg:      number,
  grow_weeks:       number,
  reason:           string,
  preference_match: boolean,
  sqft_allocated:   number | null,
  cycle_start_date: string | null,
  cycle_number:     number | null,
  joined_at:        string | null,
}>
```

**Frontend state it populates:**
- Extract `newFarmId = bundles[0].farm_id`
- Save `localStorage.setItem('mycelium:sunlight_hours:' + newFarmId, String(sunlightHours))`
- Call `switchFarm(newFarmId, lat, lng)` (see FarmContext section)
- The `BundleResponse[]` is the same shape that `getNode()` returns, so the dashboard can use it directly without a follow-up fetch — see section 6.

**Error cases:**
- `500` / engine error — The greedy optimizer can fail if `farms` is empty or corrupt. Surface as "Could not create plot. Please try again."
- Network error — Same message, do not switch farmId.
- Empty bundles array — Guard with `if (!bundles[0]) throw new Error(...)` (same pattern as existing Setup.tsx line 78).

**Existing api.ts function:** `createNode(body)` — already exists. No new function needed.

---

## 5. The lat/lng Problem

**The question:** `POST /nodes` requires `lat` and `lng` (both are required `float` fields — no Optional in `NewFarmRequest`). A user adding a second plot will not re-enter their location. Where does it come from?

**The answer:** `FarmContext` already stores `farmLat` and `farmLng` in localStorage (`mycelium:farm_lat`, `mycelium:farm_lng`) from the initial `join()` call during Setup. These are exposed via `useFarm()`.

**Strategy:** In `AddPlotSheet`, call `const { farmLat, farmLng } = useFarm()` and pass those values directly into the `POST /nodes` body. No GPS prompt, no additional API call needed.

**Edge case:** If `farmLat` or `farmLng` is `null` (data corruption / user cleared localStorage), fall back to `0.0` with the same pattern Setup.tsx already uses (`lat: plotBasics.lat ?? 0`). This is acceptable — the engine will still assign crops, the reachability calculation will just be off.

**No new backend work is needed** — lat/lng is already persisted client-side.

---

## 6. Does GET /nodes/{newFarmId} Need to Be Called After POST /nodes?

**No.** The `POST /nodes` response is already identical in shape to `GET /nodes/{farmId}` — both return `BundleResponse[]`. The backend computes and returns the full assignment in the POST response. The frontend can store the returned bundles in a local state variable (or in FarmContext) and pass them directly to the Dashboard without a second round-trip.

However, there is one caveat: `GET /nodes/{newFarmId}/tasks` **must** still be called separately because tasks are derived from `CROP_TASKS` data keyed by `cycle_start_date`, which is set server-side during the POST. This call is already made by the Dashboard on mount via the existing `getTasks(farmId)` function — it will work automatically once `farmId` switches.

---

## 7. FarmContext — Required Changes

**Current state:** FarmContext tracks exactly one farm. The `join()` function overwrites `mycelium:farm_id`, `mycelium:farm_lat`, `mycelium:farm_lng`. There is no concept of multiple farms or switching.

**What needs to change for the "Add Plot" flow:**

The simplest approach that avoids a large refactor is to add a `switchFarm` action (semantically separate from `join` so callers can distinguish "first setup" from "switching context"). Internally it can call the same logic as `join`.

**FarmContext changes needed:**

1. Add `switchFarm(farmId: number, lat: number, lng: number) => void` to the context interface. Internally identical to `join()` — overwrites the three localStorage keys and updates state. This is the function `AddPlotSheet` calls after a successful `POST /nodes`.

2. Add `farmIds: number[]` — an array of all farm IDs the user owns, persisted to `localStorage` as `mycelium:farm_ids` (JSON array of numbers). This is needed so a future "My Plots" switcher can list all plots without hitting the network.
   - `join()` sets this to `[farmId]` (first plot, clears any previous).
   - `switchFarm()` or a new `addFarm()` variant appends to this array.
   - On mount, read from `localStorage.getItem('mycelium:farm_ids')`.

3. The current `farmId` (the active plot) remains a single `number | null`. The Dashboard, Tasks, Balance, etc. always operate on the active `farmId` — no changes to consumers needed.

**Interface diff:**
```typescript
interface FarmContextValue {
  farmId:    number | null;
  farmIds:   number[];          // NEW — all owned farm IDs
  farmLat:   number | null;
  farmLng:   number | null;
  joined:    boolean;
  join:      (farmId: number, lat: number, lng: number) => void;
  addFarm:   (farmId: number, lat: number, lng: number) => void;  // NEW
  switchFarm:(farmId: number, lat: number, lng: number) => void;  // NEW
  leave:     () => void;
}
```

`addFarm` is the function called by `AddPlotSheet` on success. It:
- Appends `farmId` to `farmIds` and persists `mycelium:farm_ids`
- Sets the new `farmId` as the active farm (updates `mycelium:farm_id`, `mycelium:farm_lat`, `mycelium:farm_lng`)
- Updates all three pieces of React state

`switchFarm` is the function a future "My Plots" picker would call to switch between existing farms without adding a new one. It updates the active `farmId`/`lat`/`lng` without modifying `farmIds`.

---

## 8. New Types and Functions Summary

### New entries in types.ts

```typescript
export interface SuggestionRequest {
  plot_size_sqft:     number;
  plot_type:          string;
  tools:              string;
  budget:             string;
  pH?:                number;
  moisture?:          number;
  temperature?:       number;
  preferred_crop_ids: number[];
}

export interface SuggestionItem {
  crop_id:            number;
  crop_name:          string;
  suitability_pct:    number;
  estimated_yield_kg: number;
  grow_weeks:         number;
  reason:             string;
}
```

### New entries in api.ts

```typescript
import type { SuggestionItem, SuggestionRequest } from '../types';

export function getSuggestions(body: SuggestionRequest): Promise<SuggestionItem[]> {
  return request<SuggestionItem[]>('/suggestions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
```

### Functions in api.ts that are already present and usable as-is

| Function | Used in which step |
|---|---|
| `getSoilData(farmId)` | Step 1 — pre-fill |
| `createNode(body)` | Step 3 — confirm |
| `getNode(farmId)` | Dashboard reload (bundles) |
| `getTasks(farmId)` | Dashboard reload (tasks) |

---

## 9. Sheet-Level State Machine

The `AddPlotSheet` component needs to manage these local state slices:

```
type SheetScreen = 'form' | 'picking' | 'confirming' | 'done'

interface AddPlotDraft {
  name:           string
  plot_size_sqft: number
  plot_type:      'balcony' | 'rooftop' | 'backyard' | 'community' | ''
  tools:          'basic' | 'intermediate' | 'advanced'
  budget:         'low' | 'medium' | 'high'
  sunlight_hours: number          // localStorage only, not sent to backend
  pH:             number           // pre-filled from GET /data, editable
  moisture:       number
  temperature:    number
  humidity:       number           // pre-filled, not shown in suggestions call
}

suggestions:       SuggestionItem[]  // populated after POST /suggestions
selectedCropIds:   number[]          // user picks from suggestions
loadingStep:       'soil' | 'suggestions' | 'creating' | null
error:             string | null
```

---

## 10. Error Handling Matrix

| Call | HTTP status | User-facing action |
|---|---|---|
| GET /data | 404 | Silent — use form defaults, log warning |
| GET /data | Network error | Silent — use form defaults |
| POST /suggestions | 422 | Inline form error, stay on form screen |
| POST /suggestions | Network error | Toast error, stay on form screen |
| POST /suggestions | Empty array | "No suitable crops" message, offer back |
| POST /nodes | 500 | "Could not create plot. Please try again." |
| POST /nodes | Network error | Same as above, do NOT switch farmId |
| POST /nodes | Empty bundles | Guard throw, same error message |

---

## 11. What Requires Backend Changes

**Nothing.** All three API calls (`GET /nodes/{id}/data`, `POST /suggestions`, `POST /nodes`) are fully implemented and return the correct data. The backend can be used as-is.