# Implementation Phases

[MODE: DISCOVER]

Build order is sequenced so each phase delivers a testable slice.
Phase 1 unblocks all others. Each phase has a clear done condition.

---

## Phase 1 — Skeleton → Working React Shell
**Goal:** HTML prototype converted to navigable React app. No live data. All visual design intact.

### Tasks
1. Install React Router: `npm install react-router-dom`
2. Copy skeleton CSS vars + shared class definitions into `src/user/user.css`. Import in `main.tsx`.
3. Create `tokens.ts` with JS values for Recharts.
4. Create `FarmContext.tsx` — reads/writes `mycelium:farm_id` from localStorage.
5. Create `App.tsx` routing:
   ```
   / → Landing
   /suggestions → Suggestions (stub)
   /setup → Setup (stub)
   /dashboard → Dashboard (stub, protected)
   /update → Update (stub, protected)
   /wallet → Wallet (stub, protected)
   /profile → Profile (stub, protected)
   ```
6. Implement `ProtectedRoute` — redirects to `/` if `!farmId`.
7. Build all **shared components** (Button, Badge, Toggle, ProgressBar, BottomSheet).
8. Build **layout components** (Shell, MobileTopbar, DesktopTopbar, DesktopNav, BottomTabBar).
9. Build **Dashboard page with hardcoded/mock data** — all skeleton sections rendered:
   - HeroSection (mock cycle data)
   - TaskList + TaskItem (mock tasks, expand/collapse works, toggles work)
   - DataWidget (mock readings)
   - StatsRow (mock stats)
   - CropPickerSheet (opens/closes)
   - MenuSheet (opens/closes)
   - Desktop two-panel layout
10. Wire BottomTabBar navigation between `/dashboard` and `/wallet` (stub).

**Done when:** App loads, shows skeleton-identical dashboard with mock data, navigation works,
sheets open/close, tasks expand/collapse, toggles animate.

---

## Phase 2 — Dashboard Live Data
**Goal:** Dashboard shows real crop assignment from API.

### Tasks
1. Create `src/user/services/api.ts` with `getNode()` + `ApiError`.
2. Create `useNode(farmId)` hook — fetches `GET /nodes/{farmId}`, manages AsyncState.
3. Create `src/user/data/taskTemplates.ts` with task templates for each crop.
4. Wire `Dashboard` to `useNode`:
   - Replace mock bundle with real data.
   - Derive tasks from `taskTemplates[bundle.crop_name]`.
   - Derive cycle info from `mycelium:cycle_start` + `bundle.grow_weeks`.
5. HeroSection: show real crop name, real grow_weeks, computed dates + progress.
6. StatsRow: pull `crops_lifetime` sum from `useBalance()` (add `getBalance()` to api.ts).
7. Loading state: skeleton placeholder cards.
8. Error state: error banner with retry button.
9. Empty state: "Your first instructions are being prepared."

**Done when:** Dashboard shows real crop name, real grow_weeks, computed cycle dates.

---

## Phase 3 — Task Management
**Goal:** Task done/skip state persists, survives page refresh.

### Tasks
1. Create `useTaskState(farmId, cycleKey)` hook — reads/writes localStorage task states.
2. Wire `TaskItem` toggle → updates localStorage.
3. Wire "Mark done" button → updates localStorage.
4. Wire "Skip" button → updates localStorage.
5. Task progress persists on refresh.
6. Client-side frost detection: if `last_readings.temperature <= 2`, inject urgent frost task.
7. Risk flag banner above task list (if any risk flags generated).
8. "Cycle ending soon" banner: if `dayOfCycle >= totalDays - 3`, show prompt.

**Done when:** Task toggles persist on refresh, frost task auto-injects when temp is low,
cycle-end banner appears in the last 3 days.

---

## Phase 4 — Conditions Update
**Goal:** User can log sensor readings, data syncs to backend.

### Tasks
1. Build `Update` page layout (two sections: Conditions + Task Checklist).
2. Build `ConditionsForm` — pH, moisture, temperature, humidity inputs with validation.
3. Wire submit → `PATCH /nodes/{farmId}/data`.
4. On success:
   - Update `mycelium:last_readings:{farmId}` in localStorage.
   - Append to `mycelium:reading_history:{farmId}` (cap at 30).
   - Show success toast.
5. On error: show inline error + retry.
6. Build `TaskChecklist` on the same page — reads from localStorage task states.
7. Wire DataWidget on dashboard → reads from `last_readings` (shows real data now).
8. Wire DataTrendsChart — reads from `reading_history`. Show empty state if < 2 readings.

**Done when:** Submitting conditions updates the backend, DataWidget shows fresh readings,
chart builds up over time as user logs.

---

## Phase 5 — Wallet
**Goal:** Balance visible, delivery submission works, pending transactions show.

### Tasks
1. Add to `api.ts`: `getBalance()`, `getLedger()`, `listRequests()`, `submitRequest()`, `getHubs()`.
2. Build `useBalance(farmId)` hook with 30s polling.
3. Build `Wallet` page layout.
4. Build `BalanceCard` — shows currency_balance.
5. Build `TransactionList` — combines ledger entries + pending requests, reverse-chrono.
6. Build `DeliveryForm`:
   - Step 1: Hub picker — `GET /hubs` + haversine sort + distance labels.
   - Step 2: Crop picker — from user's current bundle.
   - Step 3: Quantity input.
   - Submit → `POST /requests { type: 'give', ... }`.
7. On delivery submit: show pending entry in transaction list immediately (optimistic).
8. Polling: every 30s re-fetch requests — when a pending becomes confirmed, update list +
   show "Balance updated" toast.

**Done when:** Balance shows, delivery form submits, pending delivery appears, polling detects
confirmation and updates balance.

---

## Phase 6 — Onboarding (Setup)
**Goal:** New user can join the network from scratch.

### Tasks
1. Build `Setup` page with step state management (1–4 + review).
2. `StepPlotBasics`: farm name, GPS button (browser Geolocation API), plot size, plot type radio.
3. `StepSoil`: pH + moisture, with "Use defaults" → sets pH=7.0, moisture=50.
4. `StepClimate`: temperature + humidity, "Use my location" → `navigator.geolocation` → optional
   weather API lookup (or just let user enter manually).
5. `StepResources`: tools radio + budget radio.
6. `SetupReview`: all data with edit links per section.
7. Auto-save draft to localStorage on each step.
8. On review submit:
   - Call `createNode()` → `POST /nodes`.
   - On success: save farm_id, farm_name, lat, lng, cycle_start, cycle_number=1 to localStorage.
   - FarmContext.join() → navigate to `/dashboard`.
9. Progress bar / step indicator always visible.
10. Back navigation between steps.
11. `ProtectedRoute` redirect test: if already joined, `/setup` redirects to `/dashboard`.

**Done when:** Fresh user completes 4-step form, farm created, lands on dashboard with real assignment.

---

## Phase 7 — Suggestions (Stateless)
**Goal:** User can explore crop options without joining.

### Tasks
1. Build `Suggestions` page with mini-form: plot size + plot type.
2. On submit: `GET /crops` → client-side scoring per crop.
3. Build `SuggestionCard`: crop name, score %, reason tags, estimated yield, "Learn more" expansion.
4. Show at least 5 cards sorted by score desc.
5. CTA at top + bottom: "Join with [top crop]" → `/setup?crop_id=X&plot_size=Y`.
6. Setup page reads query params and pre-fills Step 1 + adds crop to `preferred_crop_ids`.
7. Results are not cached — page re-fetches /crops on each visit.

**Done when:** User enters plot size, sees ranked crop list, "Join" carries data to setup.

---

## Dependencies Summary

```
Phase 1 (shell)
  └── Phase 2 (dashboard data)
        └── Phase 3 (tasks)
              └── Phase 4 (conditions)
Phase 1
  └── Phase 5 (wallet)
Phase 1
  └── Phase 6 (onboarding) → unlocks real Phase 2 for new users
Phase 1
  └── Phase 7 (suggestions) → feeds Phase 6
```

Phases 5, 6, 7 can be developed in parallel with 2–4 once Phase 1 is done.

---

## Packages to Install

```bash
npm install react-router-dom
# Recharts and @vis.gl/react-google-maps already in package.json
# No other new dependencies needed
```

No Tailwind, no component library — skeleton CSS is the design system.
