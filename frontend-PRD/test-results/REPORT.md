# MyCelium Frontend QA Test Report

**Mode:** Static Analysis + Code Review
**Date:** 2026-03-08
**Branch:** `frontend-nodeimplementation`
**Analyst:** Automated agent (Claude Sonnet 4.6)

---

## 1. Test Environment

| Parameter | Value |
|---|---|
| Frontend URL | http://localhost:5173 (Vite dev server) |
| Backend URL | http://localhost:8000 (FastAPI/uvicorn) |
| Framework | React 18 + TypeScript + Vite 6 |
| Router | react-router-dom v7 |
| State | FarmContext (localStorage-backed) |
| Playwright | Not yet installed — see §9 for setup |

---

## 2. Test Node Profile

| Field | Value |
|---|---|
| Farm name | Test Farm Alpha |
| Location (lat, lng) | 43.65107, -79.347015 |
| Plot size | 200 sq ft |
| Plot type | backyard |
| Sunlight hours | 7 |
| Soil pH | 6.5 |
| Moisture | 55% |
| Temperature | 18°C |
| Humidity | 60% |
| Tools | basic |
| Budget | low |

---

## 3. Checkpoint Results (Static Analysis)

| # | Checkpoint | Status | Notes |
|---|---|---|---|
| CP-01 | Landing page loads, CTA → /setup | ✅ PASS | `Landing.tsx` renders brand + "Get started" → `/setup`. Redirects to `/dashboard` if already joined. |
| CP-02 | Protected route redirects to `/` | ✅ PASS | `ProtectedRoute` in `App.tsx` covers dashboard/update/wallet/profile. Redirects to `/` if `!joined`. |
| CP-03 | Setup Step 1 — Plot Basics | ✅ PASS | `#farm-name`, `#plot-size`, plot type buttons (Balcony/Rooftop/Backyard/Community), `#sunlight-hours`. Validation gates Continue. |
| CP-04 | Setup Step 2 — Soil Conditions | ✅ PASS | `#soil-ph` (default 7.0), `#soil-moisture` (default 50). Continue → Step 3. |
| CP-05 | Setup Step 3 — Climate | ✅ PASS | `#climate-temp` (default 20), `#climate-humidity` (default 50). Continue → Step 4. |
| CP-06 | Setup Step 4 + Submit → Dashboard | ✅ PASS | POSTs `/nodes`, writes `mycelium:sunlight_hours:{id}`, calls `join()`, navigates to `/dashboard`. Error is shown inline on failure. |
| CP-07 | Dashboard data loads | ✅ PASS | 6 parallel `useAsync` fetches on mount. Hero, task list, zone conditions all handled. |
| CP-08 | Dashboard stats row | ⚠️ WARN | Renders "X.X kg" and "Day N of N" correctly. Delta label `+0.3 kg above avg` is **hardcoded** — see BUG-004. |
| CP-09 | /update page structure | ✅ PASS | All 4 condition inputs visible with correct IDs. Pre-fills from `GET /nodes/{id}/data`. |
| CP-10 | Submit readings | ✅ PASS | POSTs to `/nodes/{id}/readings`. Shows "Readings logged" toast on success. |
| CP-11 | Task skip persists to localStorage | ✅ PASS | `markSkipped(id)` writes `mycelium:task:{farmId}:{taskId}=skipped`. Badge shows. |
| CP-12 | Wallet page | ✅ PASS | Renders "Wallet — coming soon" stub. No errors. |
| CP-13 | Data persistence across navigation | ✅ PASS | `FarmContext` reads localStorage on mount; navigation does not clear state. |
| CP-14 | API response shape validation | ✅ PASS (with critical fix) | All shapes correct. `readings[].timestamp` confirmed (not `.recorded_at`). **BUG-001 was already fixed.** |

---

## 4. Data Integrity Findings

### Setup → API → Dashboard

Data flows correctly end-to-end:

1. `Setup.tsx` collects 4 steps of form data.
2. Submits `POST /nodes` with all fields (`preferred_crop_ids: []` by default).
3. Backend creates FarmNode, runs greedy optimizer, returns `BundleResponse[]`.
4. Frontend extracts `firstBundle.farm_id`, writes `mycelium:sunlight_hours:{farmId}` (localStorage-only field).
5. `join(farmId, lat, lng)` writes `mycelium:farm_id`, `mycelium:farm_lat`, `mycelium:farm_lng`.
6. Dashboard fires 6 parallel fetches immediately, rendering from the same `farmId`.

No data loss in this path.

### Update → API → Dashboard

1. `/update` fetches live soil from `GET /nodes/{farmId}/data` and pre-fills inputs.
2. `POST /nodes/{farmId}/readings` writes a new entry AND updates live farm values.
3. Next `/dashboard` load reads updated soil data via `getSoilData`.

Data flows correctly.

### Task state

API task `status` (`done/upcoming/future`) is calendar-driven (based on `cycle_start_date + day_from_start`).
User-driven state (`done/skipped`) is stored in localStorage (`mycelium:task:{farmId}:{taskId}`).
The two are merged on render — correct by design.

---

## 5. API Response Shape Validation

| Endpoint | Shape | Status |
|---|---|---|
| `POST /nodes` | `BundleResponse[]` | ✅ Matches frontend type exactly |
| `GET /nodes/{id}` | `BundleResponse[]` | ✅ |
| `GET /nodes/{id}/data` | `SoilReadingResponse` — `{farm_id, pH, moisture, temperature, humidity}` | ✅ |
| `GET /nodes/{id}/tasks` | `TaskItem[]` — `{id, crop_id, crop_name, title, subtitle, why, how, target, tools_required, day_from_start, due_date, status}` | ✅ |
| `GET /nodes/{id}/risks` | `RiskFlag[]` — `{type, message, severity}` | ✅ |
| `GET /nodes/{id}/balance` | `{node_id, currency_balance, crops_on_hand, crops_lifetime}` | ✅ |
| `GET /nodes/{id}/readings` | `ReadingEntryResponse[]` — field is **`timestamp`** (not `recorded_at`) | ✅ Fixed |
| `POST /nodes/{id}/readings` | Returns `ReadingEntryResponse` | ✅ |
| `POST /suggestions` | `CropSuggestion[]` | ✅ |

---

## 6. Bugs Found

### 🔴 CRITICAL (Fixed)

**BUG-001: `DataTrendsChart` accessed `r.recorded_at` — field doesn't exist in API response**
- **File:** `app/frontend/src/user/components/dashboard/DataTrendsChart.tsx:64`
- **Was:** `readings.map(r => ({ date: formatDate(r.recorded_at), ... }))`
- **Fixed:** `readings.map(r => ({ date: formatDate(r.timestamp), ... }))`
- **Impact:** Chart showed "Invalid Date" for ALL X-axis labels when 2+ readings existed. Silent failure — no error thrown.
- **Status:** ✅ FIXED

---

### 🟠 MAJOR

**BUG-002: "See what to grow first" CTA on Landing broken for new users**
- **File:** `app/frontend/src/user/pages/Landing.tsx`
- **Detail:** Navigates to `/suggestions` which is wrapped in `<ProtectedRoute>`. New users (no farmId) get immediately redirected to `/` instead of seeing the suggestions UI.
- **Fix:** Either gate the route outside `ProtectedRoute`, or remove the CTA until the flow is properly wired.

**BUG-003: StatsRow hardcodes "+0.3 kg above avg" delta**
- **File:** `app/frontend/src/user/components/dashboard/StatsRow.tsx`
- **Detail:** Static placeholder text, not computed from any data.
- **Fix:** Compute from `readings` data or hide until implemented.

**BUG-004: Dashboard temperature delta is always empty string**
- **File:** `app/frontend/src/user/pages/Dashboard.tsx:80`
- **Detail:** `temperature = { value: soil.temperature, delta: '' }` — delta never computed.
- **Fix:** Derive from last two readings entries from `readingsState.data`.

---

### 🟡 MINOR

**BUG-005: Moisture parse fallback is 0 instead of previous value**
- **Files:** `Setup.tsx`, `Update.tsx`
- **Detail:** `parseFloat(e.target.value) || 0` — clearing the field submits `moisture: 0` to the API.
- **Fix:** Use `|| prev` or clamp with the previous value.

**BUG-006: `updatedMinutesAgo` always null → shows "—"**
- **File:** `app/frontend/src/user/pages/Dashboard.tsx:167,238`
- **Detail:** `updatedMinutesAgo={null}` hardcoded. `readingsState.data` has timestamps to compute this.

**BUG-007: New farms show "1 mo Farming" instead of "0 mo"**
- **File:** `app/frontend/src/user/pages/Dashboard.tsx:58`
- **Detail:** `Math.max(1, Math.floor(...))` always returns minimum 1. May be intentional.

**BUG-008: Update page BottomTabBar "+" button is a no-op**
- **File:** `app/frontend/src/user/pages/Update.tsx:197`
- **Detail:** `onAddPlot={() => {}}` — users on /update can't open AddPlotSheet.

---

## 7. Architecture Assessment

| Aspect | Verdict |
|---|---|
| FarmContext / localStorage | ✅ Correct — single source of truth, read at mount, no duplicated parsing |
| `useAsync` hook | ✅ Stale-prevention counter (`useRef`) correctly prevents race conditions |
| `useTaskCompletion` | ✅ Good separation of API calendar-based vs user-driven task state |
| Protected routing | ✅ Works correctly via `ProtectedRoute` / `SetupRoute` |
| CORS | ✅ Configured for localhost:5173 |
| Lazy loading | ✅ All pages lazy-loaded with `Suspense` fallback |
| Error handling | ✅ All API calls have loading/error/retry states |
| Dual-write on readings POST | ✅ Backend updates both `readings.json` log and live `farms.json` values |

---

## 8. P0 Fix Summary

| Priority | Bug | File | Fix |
|---|---|---|---|
| P0 (done) | BUG-001: `r.recorded_at` → `r.timestamp` in chart | `DataTrendsChart.tsx:64` | ✅ Applied |
| P1 | BUG-002: "See what to grow first" CTA broken | `Landing.tsx` | Remove or fix route |
| P1 | BUG-003: Hardcoded StatsRow delta | `StatsRow.tsx` | Compute or remove |
| P1 | BUG-004: Empty temperature delta | `Dashboard.tsx:80` | Compute from readings |
| P2 | BUG-005: Moisture fallback = 0 | `Setup.tsx`, `Update.tsx` | Use previous value |
| P2 | BUG-006: `updatedMinutesAgo` always null | `Dashboard.tsx` | Compute from readings |

---

## 9. Running the Tests

```bash
# Install Playwright (not yet in package.json)
cd app/frontend
npm install --save-dev @playwright/test
npx playwright install chromium

# Start backend (if not running)
cd /path/to/HackCanada
python -m uvicorn app.backend.api.main:app --reload --port 8000 &

# Start frontend dev server (if not running)
cd app/frontend
npm run dev &

# Run all 14 checkpoint tests
npx playwright test tests/node-user-flow.spec.ts --reporter=list

# View HTML report
npx playwright show-report ../../frontend-PRD/test-results/html
```

Expected result after BUG-001 fix: **14/14 tests pass**.
CP-14 explicitly guards against BUG-001 regression with: `expect(r.recorded_at).toBeUndefined()`.
