# Functional Gaps & MVP Decisions

[MODE: DISCOVER — Updated after reading app/backend/]

---

## ✅ RESOLVED — No longer gaps

### Gap 1 — Task list with rich metadata
**Was:** API had no task list.
**Now:** `GET /nodes/{farm_id}/tasks` returns `TaskItem[]` from `CROP_TASKS` in `engine/data.py`.
Each task has: id, crop_id, crop_name, title, subtitle, why, how, target, tools_required,
day_from_start, due_date (computed from cycle_start_date), status ('done'/'upcoming'/'future').
**Frontend action:** Call this endpoint. No client-side templates needed.
**Note:** `status` from API is time-based only (past due = 'done'). User marking tasks complete
is still local state — the API doesn't track user completion. Keep local toggle state in
localStorage, use API status only as a hint for display ordering.

### Gap 2 — Cycle dates & day count
**Was:** No start date, no cycle number.
**Now:** `BundleResponse` includes `cycle_start_date`, `cycle_number`, `joined_at` — set at
`POST /nodes` and updated on `POST /nodes/{id}/cycle-end`.
**Frontend action:** Read directly from bundle. No localStorage derivation needed.

### Gap 3 — Zone conditions GET
**Was:** No GET endpoint for current soil readings.
**Now:** `GET /nodes/{farm_id}/data` returns `SoilReadingResponse` (pH, moisture, temp, humidity).
**Frontend action:** Fetch on DataWidget mount. Still no sunlight hours — see remaining gap below.

### Gap 4 — Risk flags
**Was:** No alert system.
**Now:** `GET /nodes/{farm_id}/risks` returns `RiskFlag[]` from `compute_risk_flags` in the engine.
Each flag: type, message, severity ('low'/'medium'/'high').
**Frontend action:** Fetch on dashboard mount. Render as banner above task list if any high/medium.

### Gap 6 — Suggestions endpoint
**Was:** No `/suggestions` route.
**Now:** `POST /suggestions` exists, calls real `compute_suitability` engine with a temp FarmNode.
Returns `SuggestionItem[]`: crop_id, crop_name, suitability_pct, estimated_yield_kg, grow_weeks, reason.
**Frontend action:** Call directly. No client-side scoring needed.

### Gap 7 — Historical chart data
**Was:** No time-series storage.
**Now:** `POST /nodes/{farm_id}/readings` appends a reading entry (pH, moisture, temp, humidity).
`GET /nodes/{farm_id}/readings?limit=30` returns sorted history oldest-first.
**Frontend action:** POST on each conditions update (replaces/augments PATCH data).
Read from GET for chart. Empty state if no readings yet.

### Gap 9 — Months farming stat
**Was:** No joined_at in API.
**Now:** `joined_at` is in `BundleResponse`. Also in node creation response.
**Frontend action:** Read from bundle. Compute months since joined_at.

### Gap 10 — Cycle end / re-optimize
**Was:** No per-farm cycle-end endpoint.
**Now:** `POST /nodes/{farm_id}/cycle-end` accepts `{ actual_yield_kg: { "crop_id": kg } }`.
Increments cycle_number, resets cycle_start_date to today, re-runs greedy assignment.
Returns new `BundleResponse[]`.
**Frontend action:** Call on "Get my next assignment". Dashboard refreshes from response.

---

## ✅ NEW ENDPOINTS — Not in previous plan

### Rates
- `GET /rates` — exchange rate per crop (crop_id, crop_name, rate)
- `GET /rates/cost?crop_id=X&quantity_kg=Y&action=give|receive` — preview earn/cost before delivery

**Frontend use:** Show estimated HC earn in delivery form before submission. Show rates list on wallet page.

### Crop guide
- `GET /nodes/{farm_id}/guide` — returns growing guide text per assigned crop from CROP_GUIDES

**Frontend use:** "Learn more" expansion on dashboard or a dedicated guide section.
**Note:** Comment in data.py says "Gemini-ready: when AI is integrated, replace static text with a prompt call." So this text is currently static but the endpoint shape is final.

### Engine manual trigger
- `POST /engine/run` — triggers the transaction engine immediately

**Frontend use:** Not user-facing. Could be useful in dev/testing. Not needed in production UI.

---

## ⚠️ DELIVERY FLOW HAS CHANGED — Critical update

The delivery flow is now a multi-step state machine, not a single POST:

```
1. POST /requests { type: 'give', node_id, crop_id, quantity_kg }
   → hub_id is OPTIONAL now (null on submit)
   → status: 'pending'

2. Engine runs (every 15 min automatically, or POST /engine/run)
   → Engine sets hub_options[] on the request
   → status: 'options_ready'

3. User picks a hub: POST /requests/{id}/select-hub { hub_id }
   → Validates capacity + balance at selection time
   → status: 'matched'

4. User physically goes to hub. Hub staff confirms:
   POST /requests/{id}/confirm { actual_quantity_kg }
   → Updates balance, inventory, ledger
   → status: 'confirmed'
```

**Frontend impact:**
- Wallet page must handle all 4 statuses: pending, options_ready, matched, confirmed
- When status is 'options_ready', show hub_options to user for selection (not admin-only)
- `hub_options` is an array on `RequestResponse` — fetch the request to get them
- Poll requests every 30s so wallet detects when engine sets options_ready
- Use `GET /rates/cost` to preview HC earned before the user submits

---

## ⚠️ TASKS — User completion is still local

The API's `GET /nodes/{farm_id}/tasks` returns task status based purely on dates:
- past due date → 'done'
- within 7 days → 'upcoming'
- beyond 7 days → 'future'

This is NOT user completion tracking. A task marked 'done' by the API just means the date passed.

**What we still need locally:**
- User toggling a task as manually completed → localStorage
- User skipping a task → localStorage
- Display: if user marked done, show toggle on + strikethrough. If API says 'done' but user
  didn't mark it, show as overdue or auto-complete (UX decision to make).

**Recommended approach:** API status drives ordering and urgency. User toggle is the source
of truth for visual completion state. Key: `mycelium:task_done:{farmId}:{taskId}`.

---

## ⚠️ REMAINING GAPS (still need workarounds)

### Gap 5 — "My Food" tab
**Status:** No API. Still a stub placeholder page.

### Gap 8 — Nearby hubs distance sorting
**Status:** `GET /hubs` returns all hubs with lat/lng.
No distance endpoint. Client-side haversine sort still the approach.
Farm lat/lng is available from localStorage (saved at onboarding from POST /nodes response).

### Sunlight hours
**Status:** Not in any API model. Not a field on FarmNode.
Options: (a) let user enter it during onboarding and store locally, (b) omit from DataWidget.
Recommendation: add a `sunlight_hours` field to onboarding form Step 1, store in localStorage.
Show in DataWidget as "From setup" not as a live reading.

### Task completion tracking (server-side)
**Status:** No endpoint to POST user task completion back to server.
Local-only for MVP. Server-side completion tracking would require a new endpoint.

---

## Gemini Integration Note

`engine/data.py` has a clear comment on `CROP_GUIDES`:
> "Gemini-ready: when AI is integrated, replace static text with a prompt call"

And `CROP_TASKS` is the static task data. The architecture for the suggestions/tasks split is:
- **Crop assignment** → engine optimizer (`/nodes`, `/nodes/{id}`, `/nodes/{id}/cycle-end`)
- **Tasks** → currently static `CROP_TASKS` per crop, later Gemini generates contextual tasks
- **Guide text** → currently static `CROP_GUIDES`, later Gemini generates personalised guidance

For the frontend: the endpoint shapes won't change when Gemini is added. The same
`GET /nodes/{farm_id}/tasks` and `GET /nodes/{farm_id}/guide` will be used.
No frontend changes needed when Gemini is wired in.
