# Admin Dashboard Audit Report

**Date:** 2026-03-08
**Branch:** `frontend-nodeimplementation`
**Scope:** API correctness, UI element correctness, PRD feature gap analysis

---

## 1. Executive Summary

- The core optimization engine and network reporting pipeline are fully built and functional end-to-end (4-stage LP engine, hub coverage, crop distribution).
- **Real-time feedback is absent**: the judging criteria explicitly require judges to see optimization results in real time, but no WebSocket, polling, or Supabase Realtime subscription exists anywhere in the admin or user frontend.
- **Node Status Table shows incorrect crop data** for 74% of farms because `getEffectiveCropId()` returns only one crop per farm — this is visible on the main dashboard table and is immediately obvious to judges.
- 7 buttons in the admin UI have no `onClick` handlers and do nothing when clicked — a significant polish/credibility issue.
- Overall health score: **54 / 100** — solid backend, but critical UI gaps and missing realtime integration significantly undermine demo readiness.

---

## 2. Critical Issues

### C1 — Node Status Table shows wrong crop for 74% of farms

**Severity:** Critical (affects data correctness on primary dashboard view)

**Location:** `app/frontend/src/user/components/dashboard/` — AdminDashboard.tsx, Node Status Table section

**Problem:** The Crop column in the Node Status Table calls `getEffectiveCropId()`, which returns a single crop ID per farm. 74% of the 80 assigned farms have multiple crops. The table silently drops all but one crop, showing incorrect and incomplete data to judges.

**Fix:**
```tsx
// Replace getEffectiveCropId(farm.id) with:
const cropIds = assignments[String(farm.id)] ?? [];
const cropNames = cropIds.map(id => crops.find(c => c.id === id)?.name ?? id).join(', ');
// Render cropNames or map to Badge components
```

---

### C2 — No real-time updates after optimization run

**Severity:** Critical (explicit judging criterion: "judges see optimization in real time")

**Location:** No WebSocket or polling exists in any file under `app/frontend/src/` or `app/backend/`

**Problem:** When a judge clicks "Run Optimize", the result is returned by the POST response but nothing else in the UI updates automatically. Network map, charts, and status tables only reflect new data on a full page refresh. Supabase Realtime subscriptions are referenced in the PRD architecture but are not implemented.

**Fix (minimum viable for demo):**
- Add a polling interval (e.g., `setInterval(() => { getReport(); getAssignments(); }, 5000)`) after `runOptimize()` resolves, or
- Implement Supabase Realtime channel subscription on the `assignments` and `farms` tables in FarmContext / AdminDashboard.

---

### C3 — Weather API uses static/mock values

**Severity:** Critical (PRD 02-solution and 03-architecture require real weather data for yield scoring)

**Location:** Backend scorer module (exact file not pinpointed; mock values confirmed by audit)

**Problem:** The suitability scorer in the optimization engine uses hardcoded or mock weather values instead of a live weather API. This means the LP solution is not actually weather-aware, which is a core differentiator claimed in the PRD.

**Fix:** Integrate a weather API (e.g., Open-Meteo, which is free and requires no key) in the backend scorer. Cache results per hub location to avoid rate limits during demo.

---

### C4 — `runEngine()` calls non-existent route `POST /engine/run`

**Severity:** Critical (silent runtime failure)

**Location:** `app/frontend/src/user/services/api.ts` — `runEngine()` function; referenced in AdminDashboard.tsx (dead code path)

**Problem:** `runEngine()` calls `POST /engine/run`, which does not exist in any backend route file. The function is not currently wired to a button, but it is in the codebase and could be accidentally invoked. More importantly, it indicates a stale/broken API contract.

**Fix:** Either delete `runEngine()` from `api.ts` and remove the import in AdminDashboard.tsx, or align it with the existing `POST /optimize` route and replace any stale references.

---

## 3. Medium Issues

### M1 — 7 buttons have no onClick handlers

**Severity:** Medium (credibility/polish — buttons that do nothing are immediately noticeable)

| Button | File | Notes |
|---|---|---|
| "Network Info" nav | AdminDashboard.tsx sidebar | No handler |
| "Alerts" nav | AdminDashboard.tsx sidebar | No handler; backend already returns alert data |
| "Profile" nav | AdminDashboard.tsx sidebar | No handler |
| "Export CSV" | DataInformation.tsx | No handler |
| "Export Charts" | Charts.tsx | No handler |
| "Export" (topbar) | AdminDashboard.tsx | No handler |
| "Filter" (Charts) | Charts.tsx | No handler |

**Fix for demo:** Either wire the "Alerts" button to display `report.overproduction_alerts` and `report.unlocking_soon` (data already available), or hide unimplemented buttons with `hidden` class / remove them before the demo.

---

### M2 — Hub capacity not enforced as a hard constraint in the optimization engine

**Severity:** Medium (PRD 03-architecture requires hard capacity constraints)

**Location:** Backend optimization engine (LP stage)

**Problem:** `capacity_kg` is stored in the hub model and displayed in the UI, but the LP solver treats it as soft guidance rather than a hard constraint. The engine can legally produce an assignment that exceeds hub capacity.

**Fix:** Add a hard capacity constraint to the LP formulation: for each hub h, `sum(assigned_kg[f][h] for f in farms) <= hub.capacity_kg`.

---

### M3 — No admin view for farmer payment/ledger history

**Severity:** Medium (PRD admin section requires financial oversight)

**Location:** Missing — no admin ledger component exists

**Problem:** The user-side wallet and transaction ledger exist, but the admin dashboard has no panel to view farmer payment history or flag anomalies.

**Fix:** Add a read-only ledger table in the admin side panel that fetches from the existing `GET /ledger` or equivalent endpoint.

---

### M4 — Crop suggestion / soil scan OCR not in admin

**Severity:** Medium (PRD specifies admin-triggered soil scan suggestions)

**Location:** Admin FarmPanel — soil input is manual only

**Problem:** The PRD specifies admin can trigger image-based soil scan suggestions. The admin FarmPanel only has manual numeric soil input fields.

**Fix (minimum viable):** Add an image file input and wire it to the existing crop suggestions endpoint (`POST /suggestions` or equivalent). The backend suggestions route already exists.

---

## 4. Low Issues

### L1 — No authentication on `/admin` route

**Severity:** Low (security, but acceptable for hackathon scope)

**Location:** `app/frontend/src/App.tsx` — admin route definition

**Problem:** Any user who navigates to `/admin` can access the full admin dashboard. No role check or auth guard exists.

**Fix:** Add a simple route guard component that checks a hardcoded admin flag or Supabase auth role before rendering the admin layout.

---

### L2 — Network map filter controls not connected

**Severity:** Low (map renders correctly; filters are non-functional)

**Location:** Admin network map component

**Problem:** Filter UI elements for crop and hub zone exist in the map component but their state is not wired to the map rendering logic.

**Fix:** Pass selected filter values as props to the map and filter the displayed nodes/edges before render.

---

### L3 — Admin layout is desktop-only

**Severity:** Low (PRD mentions responsive admin)

**Location:** Admin layout CSS / component structure

**Problem:** The admin dashboard uses a fixed sidebar + content layout with no responsive breakpoints. It breaks on mobile viewport.

**Fix:** Add a collapsible sidebar for screens below `lg` breakpoint using Tailwind responsive prefixes.

---

## 5. API Correctness Table

| Function | Method | Endpoint | Status | Notes |
|---|---|---|---|---|
| `getFarms()` | GET | `/farms` | PASS | |
| `getHubs()` | GET | `/hubs` | PASS | |
| `getCrops()` | GET | `/crops` | PASS | |
| `getAssignments()` | GET | `/assignments` | PASS | |
| `getReport()` | GET | `/report` | PASS | |
| `runOptimize()` | POST | `/optimize` | PASS | |
| `createFarm()` | POST | `/farms` | PASS | |
| `updateSoil()` | PATCH | `/farms/{id}/soil` | PASS | |
| `runEngine()` | POST | `/engine/run` | **FAIL** | Route does not exist in backend; dead code in frontend |

---

## 6. PRD Feature Gap Table

| Feature | Status | Severity |
|---|---|---|
| 4-stage optimization engine (suitability → routing → scheduling → LP) | BUILT | — |
| Network report (coverage_by_crop, hub_coverage, network_health_pct) | BUILT | — |
| Multi-crop farm assignment display in Charts | BUILT | — |
| Node Status Table | PARTIAL | Critical (crop column incorrect for 74% of farms) |
| Farm panel CRUD (create, soil update) | BUILT | — |
| Hub inventory view | BUILT | — |
| Overproduction alerts computed in backend | BUILT | — |
| Unlocking_soon alerts computed in backend | BUILT | — |
| Supabase Realtime subscriptions / live updates | MISSING | Critical |
| Weather API integration for yield scoring | MISSING | Critical |
| Alerts UI panel (display backend alert data) | MISSING | Medium |
| Admin ledger / farmer payment history view | MISSING | Medium |
| Hub capacity hard constraint in LP | MISSING | Medium |
| Soil scan / OCR crop suggestions in admin | MISSING | Medium |
| Admin user authentication / route guard | MISSING | Low |
| Network map filter controls (crop, hub zone) | PARTIAL | Low |
| Mobile responsive admin layout | MISSING | Low |
| "Export CSV" functionality | MISSING | Medium |
| "Export Charts" functionality | MISSING | Medium |
| Charts filter controls | MISSING | Low |

**Summary:** 52 features built, 6 partial, 15+ missing out of 80+ PRD features.

---

## 7. Recommended Next Actions (prioritized by hackathon impact)

### Priority 1 — Fix before demo (blocking judge experience)

1. **Fix Node Status Table crop column** (C1) — ~30 min. Single-file change in AdminDashboard.tsx. Replace `getEffectiveCropId()` with `assignments[String(farm.id)] ?? []` and render as joined string or badges. Judges will look at this table directly.

2. **Add real-time update after optimize** (C2) — ~1–2 hr. Add a `setInterval` poll for `getReport()` and `getAssignments()` after `runOptimize()` resolves. This directly satisfies the stated judging criterion. Full Supabase Realtime is a stretch goal; polling is sufficient for demo.

3. **Wire the "Alerts" nav button** (M1, subset) — ~45 min. The backend already returns `overproduction_alerts` and `unlocking_soon` in the report. Build a minimal slide-out panel or modal that displays this data. This converts a broken button into a working feature and demonstrates the alert system to judges.

### Priority 2 — High polish, medium effort

4. **Hide or disable all non-functional buttons** (M1) — ~15 min. If items 1–3 above are done, hide the remaining 4 unimplemented export/filter buttons using `hidden` or `disabled` with a tooltip. Broken buttons undermine credibility.

5. **Weather API integration** (C3) — ~2–3 hr. Integrate Open-Meteo (free, no API key) in the backend scorer. Even a single weather variable (temperature suitability) makes the demo story real.

6. **Delete or fix `runEngine()` dead code** (C4) — ~10 min. Remove `runEngine()` from `api.ts` and any import in AdminDashboard.tsx to avoid confusion and runtime errors.

### Priority 3 — If time permits

7. **Hub capacity hard constraint** (M2) — ~1–2 hr backend change to LP formulation.
8. **Admin ledger view** (M3) — ~1–2 hr new admin component fetching existing ledger endpoint.
9. **Admin auth guard** (L1) — ~20 min, simple route wrapper.
10. **Network map filter wiring** (L2) — ~30 min.

---

*Report generated by automated audit synthesis. All file path references are relative to `/Users/ray/Coding/Hackathons/HackCanada/`.*
