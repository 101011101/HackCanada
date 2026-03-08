# State & Data Flow

[MODE: DISCOVER — Updated after reading app/backend/]

---

## localStorage Schema (slimmed down — API now handles most state)

```ts
// Farm identity — set once during onboarding, never changes
localStorage['mycelium:farm_id']        // number string e.g. "42"
localStorage['mycelium:farm_lat']       // number string
localStorage['mycelium:farm_lng']       // number string

// Onboarding draft — cleared on successful submit
localStorage['mycelium:setup_draft']    // JSON: partial NewFarmRequest
localStorage['mycelium:setup_step']     // number: current step 1–4

// User task completion — server tracks time-based status only, not user actions
localStorage['mycelium:task_done:{farmId}:{taskId}']   // "true" | "skipped"

// Sunlight hours — not in any API model
localStorage['mycelium:sunlight_hours:{farmId}']  // number string from onboarding Step 1
```

**What moved off localStorage (now in API):**
- cycle_start_date, cycle_number, joined_at → in BundleResponse
- current soil readings → GET /nodes/{id}/data
- reading history → GET /nodes/{id}/readings
- total grown, crops_lifetime → in BalanceResponse

---

## FarmContext

```ts
interface FarmContextValue {
  farmId: number | null;
  farmLat: number | null;
  farmLng: number | null;
  joined: boolean;
  join: (farmId: number, lat: number, lng: number) => void;
  leave: () => void;  // clears localStorage, resets context
}
```

Gate: any route under `/dashboard`, `/update`, `/wallet`, `/profile` redirects to `/` if `!joined`.

---

## Per-Page Data Flow

### Landing (`/`)
- No API. Read FarmContext — if joined, redirect to `/dashboard`.

### Suggestions (`/suggestions`)
```
mount → nothing

form submit →
  POST /suggestions { plot_size_sqft, plot_type, tools, budget, pH?, moisture?, temp? }
  → render SuggestionItem[] sorted by suitability_pct desc

"Join with X" →
  navigate to /setup?crop_id=X&plot_size=Y
```

### Setup (`/setup`)
```
mount →
  read localStorage setup_draft for resume
  read query params (crop_id, plot_size from suggestions)

each step advance →
  write draft to localStorage

final submit →
  POST /nodes → BundleResponse[]
  save farm_id, lat, lng to localStorage
  FarmContext.join()
  navigate /dashboard
```

### Dashboard (`/dashboard`)
```
mount →
  GET /nodes/{farmId}       → BundleResponse[] (crop, cycle_start_date, cycle_number, joined_at)
  GET /nodes/{farmId}/tasks → TaskItem[] (title, subtitle, due_date, time-based status)
  GET /nodes/{farmId}/risks → RiskFlag[]
  GET /nodes/{farmId}/data  → SoilReadingResponse (current pH/moisture/temp/humidity)
  read localStorage task_done states

render →
  HeroSection: crop_name, cycle_number, cycle_start_date + grow_weeks → compute dates + progress
  TaskList: merge API tasks with localStorage done states
  RiskFlags: banner above tasks if any high/medium severity
  DataWidget: from SoilReadingResponse
  StatsRow: total_grown = sum(crops_lifetime from balance), cycle target = quantity_kg from bundle
  "Cycle ending soon" banner: if dayOfCycle >= totalDays - 3

refresh → re-fetch all 4 endpoints on pull-to-refresh or page focus
```

### Update (`/update`)
```
mount →
  GET /nodes/{farmId}/data → pre-fill conditions form
  GET /nodes/{farmId}/tasks → render task checklist

submit conditions →
  POST /nodes/{farmId}/readings { pH, moisture, temperature, humidity }
  → on success: show "Readings logged" toast
  → DataWidget on dashboard will refresh on next visit

submit task progress →
  write task_done states to localStorage per task
  show "Progress saved" toast

end of cycle (separate action) →
  POST /nodes/{farmId}/cycle-end { actual_yield_kg: { "crop_id": kg } }
  → on success: navigate to /dashboard (dashboard will fetch new bundle)
```

### Wallet (`/wallet`)
```
mount →
  GET /nodes/{farmId}/balance        → currency_balance, crops_lifetime
  GET /ledger?node_id={farmId}       → confirmed transaction history
  GET /requests?node_id={farmId}     → all requests (all statuses)
  GET /hubs                          → hub list for delivery form
  GET /crops                         → crop definitions for delivery form
  GET /rates                         → exchange rates for earn preview

interval 30s →
  GET /requests?node_id={farmId}
  → if any request changed to 'options_ready': show hub picker inline for that request
  → if any changed to 'confirmed': re-fetch balance, show "Balance updated" toast
  GET /nodes/{farmId}/balance        → update HC balance display

delivery flow →
  Step 1: user enters crop + quantity
    GET /rates/cost?crop_id=X&quantity_kg=Y&action=give → show estimated earn
  Step 2: user submits
    POST /requests { type: 'give', node_id, crop_id, quantity_kg }  (no hub_id)
  Step 3: wait for engine (poll detects 'options_ready')
    show hub_options from request → user selects
    POST /requests/{id}/select-hub { hub_id }
  Step 4: user goes to hub physically — hub staff confirms on admin side
    poll detects 'confirmed' → balance updated, toast shown
```

### Profile (`/profile`)
```
mount →
  GET /nodes/{farmId}          → bundle for crop/cycle info
  GET /nodes/{farmId}/balance  → lifetime stats

leave network →
  confirm dialog
  FarmContext.leave() → clear localStorage
  navigate to /
```

---

## Loading / Error / Empty States

| Screen | Loading | Error | Empty |
|--------|---------|-------|-------|
| Dashboard bundle | Skeleton hero + task placeholders | "Couldn't load farm data. [Retry]" | "Your first assignment is being prepared" |
| Task list | Skeleton rows | Show stale if cached, else error | "No tasks yet for this cycle" |
| Risk flags | Silent (no indicator) | Ignore — non-critical | Nothing shown (no risks = good) |
| DataWidget | Skeleton readings | "No readings available" | "Log your first reading to see conditions" |
| Chart | Skeleton line | Error banner | "Log readings to see trends here" |
| Wallet balance | "— HC" | "Couldn't load balance. [Retry]" | "0 HC" (valid, show it) |
| Transaction list | Skeleton rows | "[Retry]" | "No transactions yet — make your first delivery" |
| Delivery hub options | Spinner on request row | "Couldn't load options. [Retry]" | — (engine not run yet — show "Options loading...") |
| Suggestions results | Spinner | "Couldn't load suggestions. [Retry]" | — (always has crops) |

---

## Delivery Request Status Display

The wallet transaction list must handle all statuses:

| Status | Display |
|--------|---------|
| `pending` | "Pending — waiting for hub options" |
| `options_ready` | "Select a hub →" (interactive — shows hub picker inline) |
| `matched` | "Ready — go to [Hub Name] to drop off" |
| `confirmed` | "Confirmed · +X HC" (credit shown) |
| `cancelled` | "Cancelled" (greyed out) |
