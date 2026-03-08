# State & Data Flow

[MODE: DISCOVER]

---

## localStorage Schema

All keys are namespaced. Farm identity is the root of everything.

```ts
// Farm identity — set once during onboarding
localStorage['mycelium:farm_id']       // number (e.g. "42")
localStorage['mycelium:farm_name']     // string
localStorage['mycelium:farm_lat']      // number
localStorage['mycelium:farm_lng']      // number
localStorage['mycelium:farm_data']     // JSON: { pH, moisture, temperature, humidity, plot_size_sqft, plot_type, tools, budget }

// Onboarding draft — cleared on successful submit
localStorage['mycelium:setup_draft']   // JSON: partial NewFarmRequest (for resume)
localStorage['mycelium:setup_step']    // number: current step 1–4

// Task state — keyed by farm + cycle
localStorage['mycelium:tasks:{farmId}:{cycleKey}']  // JSON: Record<taskId, 'pending'|'done'|'skipped'>
// cycleKey = derived from crop grow_weeks + join date: e.g. "spinach-c3"

// Last known sensor readings (no GET endpoint exists for these)
localStorage['mycelium:last_readings:{farmId}']     // JSON: { pH, moisture, temperature, humidity, updatedAt }

// Condition history for charts (local time-series)
localStorage['mycelium:reading_history:{farmId}']   // JSON: Array<{ date, pH, moisture, temperature, humidity }>
// Capped at 30 entries (appended on each PATCH /data submit)
```

---

## FarmContext

The root context. Loaded once on app mount.

```ts
interface FarmContextValue {
  farmId: number | null;          // null = not joined
  farmName: string | null;
  farmLat: number | null;
  farmLng: number | null;
  joined: boolean;                // !!farmId
  join: (farmId: number, name: string, lat: number, lng: number, data: object) => void;
  leave: () => void;              // clears all localStorage keys
}
```

**Routing gate:** If `!joined`, any route under `/dashboard`, `/update`, `/wallet`, `/profile`
redirects to `/`. Implemented as a `<ProtectedRoute>` wrapper component.

---

## Per-Page Data Flow

### Landing (`/`)
- No API calls.
- Reads `FarmContext.joined` — if true, immediately redirect to `/dashboard`.
- Renders: network animation (static SVG or animation), two CTAs.

### Suggestions (`/suggestions`)
- On mount: `GET /crops` (cached in session, not localStorage).
- On form submit: client-side scoring — no API call.
- "Join with X crop" → navigate to `/setup?crop_id=X&plot_size=Y` (query params pre-fill setup).

### Setup (`/setup`)
- Reads query params for pre-fill from suggestions.
- Reads `mycelium:setup_draft` on mount for resume.
- On each step advance: writes draft to localStorage.
- On final submit: `POST /nodes` → on success, calls `FarmContext.join()` → navigate `/dashboard`.
- On error: show inline error with retry.

### Dashboard (`/dashboard`)
```
mount →
  1. read farmId from context
  2. GET /nodes/{farmId}          → bundle (BundleResponse[])
  3. derive tasks from bundle     → generate task list (see gaps doc)
  4. read task states from localStorage
  5. read last_readings from localStorage → populate DataWidget
  6. render
```
No polling on dashboard — data is relatively static within a cycle.
"Refresh" pull-to-refresh (or manual button on desktop) re-fetches bundle.

### Update (`/update`)
```
mount →
  1. read farmId + last_readings from localStorage
  2. render pre-filled form

submit conditions →
  1. PATCH /nodes/{farmId}/data
  2. on success: update last_readings in localStorage + append to reading_history
  3. show success toast

submit task progress →
  1. update localStorage task states
  2. show success toast
```
No round-trip for task progress — local only for MVP.

### Wallet (`/wallet`)
```
mount →
  1. GET /nodes/{farmId}/balance  → currency_balance, crops_on_hand
  2. GET /ledger?node_id={farmId} → ledger entries (confirmed transactions)
  3. GET /requests?node_id={farmId}&status=pending → pending deliveries
  4. GET /hubs                    → hub list for delivery form
  5. GET /crops                   → crop definitions (for names)

interval (30s) →
  1. re-fetch balance + requests → check for newly confirmed deliveries
  2. if balance changed: update display + show "Balance updated" toast

submit delivery →
  1. POST /requests { type: 'give', node_id, hub_id, crop_id, quantity_kg }
  2. on success: add to local pending list + show "Delivery logged" toast
  3. next poll will show it as pending in the list
```

### Profile (`/profile`)
```
mount →
  1. read all farm data from localStorage (no GET /nodes endpoint for full farm object)
  2. render farm details

leave network →
  1. confirm dialog
  2. FarmContext.leave() → clears localStorage
  3. navigate to /
```

---

## Loading / Error / Empty States

Every page that fetches data follows this pattern:

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```

| Screen | Loading state | Error state | Empty state |
|--------|--------------|-------------|-------------|
| Dashboard | Skeleton cards (pulsing) | "Couldn't load your farm data. [Retry]" | "Your first instructions are being prepared" |
| Tasks | Skeleton list items | Show stale localStorage data if available | "No tasks for today" |
| DataWidget | Skeleton readings | Show last_readings from localStorage | "No readings yet — log your first update" |
| Wallet balance | "—" placeholder | "Couldn't load balance. [Retry]" | "0 HC" (still valid, show it) |
| Transaction list | Skeleton rows | "Couldn't load history. [Retry]" | "No transactions yet — make your first delivery" |
| Suggestions | Skeleton cards | "Couldn't load crop data. [Retry]" | — (shouldn't happen if /crops works) |
| Hub list (delivery) | Spinner | "Couldn't load hubs. [Retry]" | "No hubs available in your area" |

---

## Chart Data Strategy

No time-series endpoint exists. Strategy:

1. Every time user submits a condition update, append to `mycelium:reading_history:{farmId}`:
   ```ts
   { date: new Date().toISOString(), moisture, temperature, pH, humidity }
   ```
2. Cap at 30 entries (drop oldest).
3. Dashboard chart reads this array.
4. **On first load with no history:** show a 7-day mock seed as "example data" with a disclaimer label
   until real readings are submitted. Alternatively show empty state.
