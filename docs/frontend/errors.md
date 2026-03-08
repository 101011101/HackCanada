Now I have a complete picture of the entire system. Here is the comprehensive error-checking report.

---

# Add New Plot Flow — Error-Checking Report

## Summary of the Planned Flow

The flow navigates: AddPlotSheet → /suggestions (via Router state) → user picks crops → POST /nodes → FarmContext updated. All issues below are categorized as high / medium / low.

---

## Issue 1 — `humidity` missing from `SuggestionRequest` but the flow will send it

**Severity: High**

The backend `SuggestionRequest` model (`models.py` line 55-63) defines these fields:
```
plot_size_sqft, plot_type, tools, budget, pH (optional), moisture (optional),
temperature (optional), preferred_crop_ids
```

`humidity` is **not a field in `SuggestionRequest`**. The AddPlotSheet plans to collect humidity, but if it passes humidity in the POST /suggestions body, Pydantic will silently ignore the unknown field (FastAPI's default behavior with Pydantic v2) — so no crash, but the field is swallowed. Worse, `suggestions.py` hardcodes `humidity=60.0` in the temp `FarmNode` regardless of what the user submitted. The user-entered humidity value is completely lost during the suggestion step, then must be re-passed when calling POST /nodes.

**Recommended fix:** Either add `humidity: Optional[float] = None` to `SuggestionRequest` and thread it through in `suggestions.py`, or clearly document that the AddPlotSheet must cache humidity locally and re-inject it into the `NewFarmRequest` body later. Do not assume the suggestions step will preserve it.

---

## Issue 2 — `createNode` return type does not include the new `farm_id` at the top level — but it actually does, via `BundleResponse`

**Severity: Medium (with a latent trap)**

`createNode` returns `Promise<BundleResponse[]>`. Each `BundleResponse` has `farm_id`. The existing `Setup.tsx` correctly extracts `bundles[0].farm_id`. The AddPlotSheet flow must follow the same pattern. The trap: if POST /nodes returns an **empty array** (theoretically possible if no crops are assigned — the engine returns an empty `bundles` list if `assigned` is empty), then `bundles[0]` is `undefined` and `farm_id` is unreadable. The existing `Setup.tsx` has a guard (`if (!firstBundle) throw`), but it calls `onComplete()` only after that — meaning if the new AddPlotSheet omits this guard, the app silently gets `undefined` as `farmId` and calls `join(undefined, ...)`, corrupting FarmContext.

**Recommended fix:** The AddPlotSheet must replicate Setup.tsx's `!firstBundle` guard. Do not access `.farm_id` without a null check.

---

## Issue 3 — `FarmContext` is single-farm only; calling `join()` a second time silently replaces the existing farm

**Severity: High**

`FarmContext` stores exactly one `farmId`, `farmLat`, `farmLng` in localStorage. Calling `join(newFarmId, ...)` from within the AddPlotSheet flow overwrites the previously stored farm completely. There is no list of farms, no way to switch between them, no warning to the user. After the add-plot flow completes:

- The old farm's tasks, soil readings, bundles, wallet, and all dashboard data are replaced by the new farm's.
- The old `mycelium:sunlight_hours:<oldId>` key remains orphaned in localStorage.
- The new farm's sunlight hours need to be written under `mycelium:sunlight_hours:<newId>`.

**Recommended fix:** Before calling `join()`, decide whether FarmContext should support a farm list (requires a significant refactor — `farmId: number[]`, `activeFarmId: number`, etc.) or whether "add plot" simply replaces the current farm (in which case the user must be clearly warned). There is no middle ground with the current context shape.

---

## Issue 4 — `lat`/`lng` are not re-collected by the AddPlotSheet, but are required by `NewFarmRequest`

**Severity: High**

`NewFarmRequest` (both frontend type and backend model) requires `lat: number` and `lng: number` — they are not optional. The AddPlotSheet collects plot basics, but the planned field list does not explicitly include lat/lng — the description lists: `plot_size_sqft, plot_type, tools, budget, pH, moisture, temperature, humidity, preferred_crop_ids`.

If lat/lng are omitted from the sheet, the only available fallback is `FarmContext.farmLat/farmLng` (from the *previous* farm). That would assign the new plot to the geographic coordinates of the old farm — which may be intentional for a user with one address but is architecturally incorrect and produces misleading hub-reachability calculations in the optimizer.

Additionally, when the new farm is confirmed and `join()` is called, the AddPlotSheet will need lat/lng to pass to `join(farmId, lat, lng)`. If they weren't collected, it would have to re-use old coords.

**Recommended fix:** AddPlotSheet must either include a location field (GPS button) or explicitly document that lat/lng are inherited from the existing farm and pass `farmLat ?? 0, farmLng ?? 0` consciously. Using `0, 0` (Setup.tsx's fallback for null) would place the farm in the Atlantic Ocean.

---

## Issue 5 — `useAsync` auto-fires on mount and cannot be used for POST submissions

**Severity: High**

`useAsync` (hooks/useAsync.ts) calls `fn()` immediately in a `useEffect` on mount, and on every `deps` change. It is designed exclusively for data-fetching (GET) patterns. Using it to drive POST /suggestions or POST /nodes would fire the API call immediately when the Suggestions page mounts — potentially before the user has confirmed anything.

There is no way to suppress the initial call without passing a no-op function, which defeats the purpose. The hook has no `execute` method or lazy/manual trigger.

**Recommended fix:** POST requests in this flow must be managed with plain `useState` + `async` handlers (as Setup.tsx correctly does with `handleSubmit`). `useAsync` is appropriate only for GET calls on the Suggestions page (e.g., if you wanted to pre-load something). Do not use it for the suggestion or node creation POSTs.

---

## Issue 6 — React Router location.state has no type safety

**Severity: Medium**

`useLocation().state` is typed as `unknown` in React Router v6. The Suggestions page will need to cast it to a known shape to access the form data. If the user navigates to `/suggestions` directly (e.g., browser back/forward, bookmarks, or a direct URL), `location.state` will be `null`, causing destructuring to throw or silently produce `undefined` values that will be passed as-is to the API.

Currently, `/suggestions` is not inside the `ProtectedRoute` wrapper (App.tsx line 33), so it is also accessible to unauthenticated users, compounding the problem.

**Recommended fix:** The Suggestions page must check `if (!location.state)` at the top and redirect to `/` or `/setup` with a meaningful message. Define a typed interface (e.g., `SuggestionRouterState`) and use a type assertion with a runtime check, not a blind cast. Consider whether `/suggestions` should be inside `ProtectedRoute` or handled separately.

---

## Issue 7 — `SuggestionItem` type does not exist in `types.ts`

**Severity: High**

The backend `SuggestionItem` model returns:
```
crop_id, crop_name, suitability_pct, estimated_yield_kg, grow_weeks, reason
```

There is **no `SuggestionItem` interface in `types.ts`**. The Suggestions page will need to type the POST /suggestions response, and there is currently no frontend type for it. Without this type, the response will either be typed as `unknown` or developers will reach for `any`, making the crop-selection UI fragile and unverifiable at compile time.

Similarly, `api.ts` has no `getSuggestions` or `postSuggestions` function — the API call itself does not exist yet.

**Recommended fix:** Add `SuggestionItem` to `types.ts` matching all six fields. Add a `postSuggestions(body: SuggestionRequest): Promise<SuggestionItem[]>` function to `api.ts`. Also add `SuggestionRequest` as a frontend type if form data needs to be passed between components typed.

---

## Issue 8 — `ReadingEntryResponse` type mismatch between frontend and backend

**Severity: Medium** (not directly in the add-plot flow, but affects Update page which this flow could trigger)

Backend `ReadingEntryResponse` (models.py line 46-52):
```python
farm_id, timestamp, pH, moisture, temperature, humidity
```

Frontend `ReadingEntryResponse` (types.ts line 96-104):
```typescript
id, node_id, pH, moisture, temperature, humidity, recorded_at
```

The backend uses `farm_id` and `timestamp`; the frontend expects `id`, `node_id`, and `recorded_at`. These fields do not map to each other. This pre-existing bug is not introduced by the add-plot flow, but it is relevant if the new plot's readings are fetched or displayed after creation.

**Recommended fix:** Align the frontend type to match the backend: `farm_id: number`, `timestamp: string`, remove `id`, `node_id`, `recorded_at`.

---

## Issue 9 — Zero-results edge case from POST /suggestions is unhandled

**Severity: Medium**

`suggestions.py` filters out any crop where `suitability <= 0` and returns the remaining list. If the user's plot conditions (extreme pH, incompatible plot type, etc.) result in zero suitable crops, the backend returns an empty array `[]`. There is no error code — it is a 200 OK with an empty body.

The Suggestions page has no current implementation, but when built it must handle this: the crop picker list will be empty, and if the user is allowed to proceed and confirm with `preferred_crop_ids: []`, the optimizer will run but the greedy assignment may still assign crops (it ignores preference when no preferences are set). However if the UX intent is "user must pick at least one crop," there is no server-side enforcement of that — `preferred_crop_ids` is optional and defaults to `[]` in both `SuggestionRequest` and `NewFarmRequest`.

**Recommended fix:** The Suggestions page must detect an empty array response and display a message explaining why no crops matched, with options to go back and adjust conditions. Consider whether `preferred_crop_ids: []` should be allowed as a final submission or require at least one selection.

---

## Issue 10 — `SetupRoute` guards block the add-plot flow for already-joined users

**Severity: Medium**

`SetupRoute` (App.tsx lines 20-25) redirects joined users to `/dashboard`. This means if the AddPlotSheet flow uses the existing Setup component or `/setup` route as part of its navigation, already-joined users will be bounced away. The AddPlotSheet must be a fully independent component (likely a bottom sheet rendered in-place on the Dashboard), not a route redirect through `/setup`.

If the Suggestions page is navigated to from the AddPlotSheet, and the user is already `joined`, the Suggestions page must also not require re-joining. The current Suggestions route is outside `ProtectedRoute`, so that part is fine — but the post-confirmation `join()` call will overwrite the existing session (see Issue 3).

**Recommended fix:** The AddPlotSheet and its confirmation step must not use `SetupRoute`. Keep it as an in-place sheet with its own local state, separate from the Setup flow.

---

## Issue 11 — `plot_size_sqft` uses `parseFloat` but backend treats it as float; fractional values accepted but display may confuse users

**Severity: Low**

Both backend and frontend accept `plot_size_sqft` as a float. The input field uses `parseFloat`, so values like `120.5` are valid and transmitted correctly. No bug here, but worth noting that the UI label says "sq ft" which users typically think of as whole numbers. Inputting `120.5` and having the backend slice it into fractional `sqft_per` values per crop (e.g., `60.25`) may look odd in the BundleResponse. Not a crash but a UX rough edge.

---

## Issue 12 — `handleSubmit` validation only checks `plot_type` at final submission; other fields silently fallback to 0

**Severity: Low** (pre-existing in Setup.tsx, would carry into AddPlotSheet if code is copied)

In Setup.tsx `handleSubmit`, the only explicit guard is `plot_type === ''`. The lat/lng fallback is `?? 0` (line 63-64 of Setup.tsx). `plot_size_sqft` can be 0 if the user somehow bypasses `StepPlotBasics` validation (e.g., draft is re-initialized). The backend will accept `plot_size_sqft: 0` without error — it would simply assign 0 sqft crops, yielding `0.0 kg` bundles. This is a silent data corruption, not a crash.

**Recommended fix:** Add server-side validation in `NewFarmRequest` (e.g., `plot_size_sqft: float = Field(gt=0)`) and/or add a final pre-flight check in the AddPlotSheet before calling `createNode`.

---

## Consolidated Priority Table

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | `humidity` dropped by SuggestionRequest; silently lost | High | API contract |
| 3 | FarmContext is single-farm; `join()` overwrites existing farm | High | State management |
| 4 | lat/lng not re-collected by AddPlotSheet but required by POST /nodes | High | Missing field |
| 5 | `useAsync` fires on mount; unusable for POST requests | High | Hook misuse |
| 7 | `SuggestionItem` type and `postSuggestions` API function do not exist | High | Missing types/API |
| 2 | Empty BundleResponse[] crashes if `bundles[0]` guard is omitted | Medium | Null safety |
| 6 | `location.state` is untyped; direct navigation to /suggestions causes null crash | Medium | Router safety |
| 8 | `ReadingEntryResponse` field names differ between frontend and backend | Medium | Type mismatch |
| 9 | Zero-results from POST /suggestions returns 200 with `[]`; no UX handling | Medium | Edge case |
| 10 | `SetupRoute` blocks already-joined users; AddPlotSheet must be independent | Medium | Routing |
| 11 | Fractional sqft display quirk | Low | UX |
| 12 | Missing pre-submit validation allows `plot_size_sqft: 0` through | Low | Validation |