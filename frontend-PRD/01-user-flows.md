# User Flows

## Agent Instructions

You are implementing the farmer app user flows.

1. This file is the source of truth for all routing, screens, and state logic.
2. Run `do dis` via MCP before creating any files — check what already exists.
3. No Supabase. No auth system. Identity = `farm_id` in `localStorage`.
4. All API calls map to the actual backend routes documented in `staged-planning/01-api-contracts.md`.

---

## Identity Model

There is no user account system. Identity is a single number.

```
localStorage['farm_id']  →  present = ACTIVE_FARMER
                         →  absent  = NEW_USER
```

On first `POST /nodes` success: write `farm_id` to `localStorage`.
On "Leave network": remove `farm_id` from `localStorage`.
If `localStorage` is cleared: user is treated as new. Their farm data remains in the backend JSON.

Additional `localStorage` keys:

| Key | Type | Purpose |
|-----|------|---------|
| `farm_id` | number | Primary identity key |
| `cycle_start_date` | ISO date string | When current cycle started. Set on first bundle + each new bundle. |
| `task_progress` | `Record<string, "done"\|"in_progress"\|"skipped">` | Task checklist. Cleared on new cycle. |
| `last_bundle_seen` | ISO datetime | Drives the Update tab badge. |

---

## App State Machine

```
App loads
  └── check localStorage['farm_id']
        ├── absent  → [NEW_USER]   → /  (landing)
        └── present → [ACTIVE_FARMER] → /dashboard
```

### NEW_USER screens
`/` → `/suggestions` (optional) → `/setup` → (POST /nodes) → `/dashboard`

### ACTIVE_FARMER screens
`/dashboard` → `/update` → `/wallet` → `/profile`

Route guard: any `/dashboard`, `/update`, `/wallet`, `/profile` hit without `farm_id` in `localStorage` → redirect to `/`.

---

## Phase 1 — Initialization (runs once)

The path from "curious stranger" to "active node in the network."

---

### Screen 1A — Landing

**Route:** `/`

The first thing a new user sees. Dark network-themed. Establishes the product concept immediately.

**Layout:**
```
[MyCelium wordmark]

[Network node SVG — live dots connected by edges, one dashed node = "you"]

  Become a node.

  47 urban growers are producing food for Toronto.
  The network tells each one exactly what to grow.
  Together they fill the gaps.

  [  Enlist my plot  ]          ← primary CTA → /setup
  [  What would I grow?  ]      ← secondary CTA → /suggestions
```

**Bottom strip — live network stats:**
```
47 nodes  |  84% health  |  3 nearby hubs  |  312 kg this cycle
```

**No API calls on this screen.** Stats can be fetched from `GET /coverage/summary` if available, otherwise use static placeholder values for MVP.

---

### Screen 1B — Suggestions (optional, skippable)

**Route:** `/suggestions`

Entry: tapping "What would I grow?" from landing. No commitment required.

**Purpose:** show the user what they'd grow before asking them to fill out a form. Converts skeptical users by demonstrating value first.

**How suggestions work (client-side only — no `/suggestions` backend endpoint):**
1. App calls `GET /crops` → receives all 10 crop definitions.
2. User inputs plot size. Client filters and scores in real time.
3. Scoring logic:
   - Discard: `crop.min_sqft > plot_size_sqft`
   - Discard: `TOOL_RANK[crop.tool_requirement] > TOOL_RANK[user_tools]`
   - Discard: `BUDGET_RANK[crop.budget_requirement] > BUDGET_RANK[user_budget]`
   - Score (0–100): based on how well optional inputs (pH, moisture, temp) fall within `crop.optimal_*` ranges. Use midpoints as proxy if user skips those.
   - Sort descending by score.

**Layout:**
```
[back]

  What should you grow?
  Enter your plot size and see your best crops instantly.

  [Tiny <20]  [Small 20–60 ✓]  [Medium 60+]   ← size range pills
  [  48  ] sq ft                               ← manual numeric input

  ────────────────────────────────
  Your best crops for 48 sq ft

  #1  Spinach                     87%
      Low water · 4 weeks · ~1.4 kg/cycle
      Basic tools · Low budget

  #2  Lettuce                     79%
      4 weeks · ~1.1 kg/cycle

  #3  Herbs                       71%
      6 weeks · ~0.6 kg/cycle

  ... more cards

  ────────────────────────────────
  [  Join with Spinach  ]         ← sticky bottom CTA, carries plot_size_sqft forward
```

**Key rules:**
- Nothing is saved. User can close and come back; suggestions are stateless.
- "Join with [crop]" button carries `plot_size_sqft` (and optionally `plot_type`, `tools`, `budget`) into Setup as pre-fills.
- If user came from landing directly (skipped suggestions), Setup starts blank.

**API calls:** `GET /crops` on mount.

---

### Screen 1C — Setup Form

**Route:** `/setup`

Collects the exact fields required by `POST /nodes`. Four steps.

**Backend field requirements (what POST /nodes actually accepts):**

| Field | Backend type | Collected in |
|-------|-------------|--------------|
| `name` | string | Step 1 |
| `lat` | float | Step 1 |
| `lng` | float | Step 1 |
| `plot_size_sqft` | float | Step 1 (pre-filled from suggestions if available) |
| `plot_type` | `"balcony"\|"rooftop"\|"backyard"\|"community"` | Step 1 |
| `tools` | `"basic"\|"intermediate"\|"advanced"` | Step 4 |
| `budget` | `"low"\|"medium"\|"high"` | Step 4 |
| `pH` | float | Step 2 |
| `moisture` | float 0–100 | Step 2 |
| `temperature` | float °C | Step 3 |
| `humidity` | float 0–100 | Step 3 |

---

**Step 1 — Plot basics**

```
[x close]                               Step 1 of 4
[=====>                               ] progress bar

  Your plot

  Farm name
  [  My Balcony East  ]

  Location
  [  Use GPS  ]     [  43.6532, -79.38  ]   ← GPS fills coords, or type manually

  Plot size
  [  48  ] sq ft    ← pre-filled from suggestions if available

  Plot type
  [Balcony] [Rooftop] [Backyard] [Community]   ← segmented

  [  Continue  ]
```

---

**Step 2 — Soil readings**

```
[back]                                  Step 2 of 4
[==========>                          ]

  Soil readings
  These help the optimizer match you to the right crop.

  Soil pH
  [  6.5  ]  [camera icon]    ← camera → OCR flow (see below)

  Soil moisture (%)
  [  65   ]  [camera icon]

  I don't have a soil meter — use defaults    ← tap to skip, fills 6.5 / 60

  [  Continue  ]
```

**OCR sub-flow (inline, triggered by camera icon):**
```
  [photo preview]
  "We read: 6.8 — does this look right?"
  [Edit]  [Confirm]

  If confidence < 0.7: show raw photo + manual entry instead of auto-fill.
```

OCR runs client-side (Tesseract.js). No backend endpoint needed.

---

**Step 3 — Climate**

```
[back]                                  Step 3 of 4
[================>                    ]

  Climate
  Used to calibrate crop recommendations.

  Temperature (°C)
  [  22  ]  [use my location]     ← auto-fill from browser geolocation + free weather API

  Humidity (%)
  [  58  ]

  [  Continue  ]
```

---

**Step 4 — Resources**

```
[back]                                  Step 4 of 4
[========================>            ]

  Resources
  The optimizer will only assign crops you can grow.

  Gear level
  [Basic]  [Intermediate]  [Advanced]
  "Basic = spade, watering can, hand tools"

  Monthly budget
  [Low <$20]  [Medium $20–50]  [High $50+]

  [  Review  ]
```

---

**Review step (before submit)**

```
  Review your farm

  Plot basics          [Edit]
  My Balcony · 48 sq ft · GPS set

  Soil readings        [Edit]
  pH 6.5 · Moisture 65%

  Climate              [Edit]
  22°C · 58% humidity

  Resources            [Edit]
  Basic gear · Low budget

  [  Connect to network  ]    ← triggers POST /nodes
```

---

**Submission**

```
POST /nodes
Body: { name, lat, lng, plot_size_sqft, plot_type, tools, budget, pH, moisture, temperature, humidity }

Loading state: "Connecting to network..."

On success:
  - Store localStorage['farm_id'] = response.farm_id
  - Store localStorage['cycle_start_date'] = today ISO
  - Store localStorage['task_progress'] = {}
  - Navigate to /dashboard

On error:
  - Show error message with Retry button
  - Do not clear the form
```

---

## Phase 2 — Propagation (repeating cycle)

The user is now `ACTIVE_FARMER`. This loop repeats every crop cycle (`grow_weeks` × 7 days).

```
[New bundle received]
        │
        ▼
   [GROWING]
   Dashboard shows assignment.
   User executes tasks in real life.
        │
        │  anytime mid-cycle
        ▼
   [CONDITION UPDATE]
   User logs soil + climate readings.
   POST /nodes/{farm_id}/data
   Confirmation toast.
        │
        │  grow_weeks elapsed since cycle_start_date
        ▼
   [END OF CYCLE]
   App shows harvest prompt.
   User logs actual yield (stored locally).
        │
        ▼
   [RE-OPTIMIZE]
   POST /optimize
   GET /nodes/{farm_id}
   localStorage['cycle_start_date'] = today
   localStorage['task_progress'] = {}
        │
        └──► [GROWING] with new bundle
```

---

### Screen 2A — Dashboard

**Route:** `/dashboard`

Default screen for `ACTIVE_FARMER`. Loads current assignment on mount.

**API call on mount:** `GET /nodes/{farm_id}`

**Response fields used:**
- `crop_name` — what they're growing
- `quantity_kg` — target yield
- `grow_weeks` — cycle length (used with `cycle_start_date` to compute progress)
- `reason` — optimizer's reasoning string

**Cycle timing (computed from localStorage):**
- `cycle_start_date` is stored on every new bundle
- `cycle_end_date = cycle_start_date + (grow_weeks × 7 days)`
- Day X of Y = `(today - cycle_start_date).days + 1`
- End-of-cycle trigger: `today >= cycle_end_date - 3 days` → show harvest prompt

**Task list (generated locally — no backend task data exists yet):**
Tasks are generated from the bundle and stored/tracked in `localStorage['task_progress']`.
Default task templates per phase: seed → water → maintain → harvest.

**Layout:**
```
[MyCelium]              [Cycle 1 · Week 1]    [avatar]

┌──────────────────────────────────────────┐
│  RISK: Frost likely this weekend          │  ← only shown if risk_flags present
│  Cover your seedlings                     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Your assignment                          │
│                                           │
│  Spinach                         87%     │  ← crop name large, suitability
│  Target: 1.4 kg · 4 weeks                │
│  "Fills network gap. Ideal pH for plot." │  ← reason string
│                                           │
│  Day 5 of 28  [=========>          ]     │  ← cycle progress bar
└──────────────────────────────────────────┘

  Your tasks

  [x] Prepare soil bed
      Spade · 30 min

  [ ] Sow seeds evenly          [Today]
      Hands · 15 min

  [ ] Water every 2 days
      Watering can · 10 min

  [ ] Harvest when leaves reach 5cm         [Mar 28]
      Scissors · Week 4

  ──────────────────────────────────────────
  Expected yield this cycle:  ~1.3 kg

[Home]    [Update •]    [Wallet]    [Me]
```

**First-time state (just onboarded, cycle_start_date = today):**
```
  Welcome to the network.
  Here is your first assignment.
  [same bundle layout below]
```

**End-of-cycle state (3 days before cycle_end_date):**
```
  ┌───────────────────────────────────────┐
  │  Cycle ending in 3 days               │
  │  [  Log your harvest  ]               │
  └───────────────────────────────────────┘
```

---

### Screen 2B — Cycle Update

**Route:** `/update`

Entry: "Update" tab, or tapping "Log today's conditions" from dashboard.

Two independent sections: conditions sync (API call) and task progress (local).

**Layout:**
```
[back]  Log update
Cycle 1 · Day 5 of 28

──────────────────────────────────────────
  Conditions today

  Soil pH
  [  6.5  ]  [camera icon → OCR]

  Soil moisture (%)
  [  65   ]  [camera icon → OCR]

  Temperature (°C)
  [  22   ]  [use my location]

  Humidity (%)
  [  58   ]

  [  Sync conditions  ]     ← POST /nodes/{farm_id}/data
                                → success: "Conditions synced" toast
                                → error: "Sync failed — try again" toast

──────────────────────────────────────────
  Task progress

  [x] Prepare soil bed
  [ ] Sow seeds          →  [Skip]
  [ ] Water every 2 days →  [Skip]
  [ ] Harvest            →  [Skip]

  [  Save progress  ]       ← writes to localStorage['task_progress']

──────────────────────────────────────────
  (shown only when today >= cycle_end_date - 3 days)

  End of cycle
  How much did you harvest?

  [  1.1  ] kg

  [  Log harvest + get next assignment  ]
      → stores yield in localStorage
      → POST /optimize
      → GET /nodes/{farm_id}
      → navigate to /dashboard with new bundle
```

**API calls:**
- `POST /nodes/{farm_id}/data` — body: `{ pH, moisture, temperature, humidity }`
- `POST /optimize` — called at end-of-cycle only (no body required)
- `GET /nodes/{farm_id}` — after optimize, fetches new bundle

**Local-only:**
- Task checklist state written to `localStorage['task_progress']`
- Harvest yield written to `localStorage['yield_history'][crop_id]`

---

### Screen 2C — Wallet & Delivery (stub)

**Route:** `/wallet`

The wallet and delivery backend does not exist yet. This screen is a stub.

**Layout:**
```
[back]  Wallet

  Hub Currency
  ◉  — HC                     ← balance (mock: 0 until backend built)

  [  Log a delivery  ]

──────────────────────────────────────────
  History

  No deliveries yet.
  Complete a cycle and deliver your harvest
  to a nearby hub to earn Hub Currency.
```

**Delivery sub-flow (stub — form submits to local state, no API):**
```
[back]  Log delivery

  Which hub?
  [  Greenwood Public School  0.8 km  ]    ← from GET /hubs
  [  North Community Centre   2.1 km  ]
  [  East Neighbourhood Hub   3.4 km  ]

  What are you delivering?
  Crop       [  Spinach  ▾  ]              ← from current assignment
  Quantity   [  1.1  ] kg

  [  Submit delivery  ]
      → stores locally as pending: { hub_id, crop_name, quantity_kg, submitted_at }
      → shows "Delivery logged — awaiting hub confirmation"
      → balance stays 0 until backend built
```

**API calls:** `GET /hubs` (loads hub list for delivery selection).

---

### Screen 2D — Profile

**Route:** `/profile`

Minimal. Shows farm details and leave option.

**Layout:**
```
[back]  My profile

  [avatar placeholder]
  My Balcony East
  farm_id: 12

──────────────────────────────────────────
  Farm details          [Edit]
  48 sq ft · Balcony · Basic gear

  Soil & climate        [Edit]
  pH 6.5 · 65% moisture · 22°C

──────────────────────────────────────────

  [  Leave the network  ]      ← destructive, requires confirmation

  Confirmation dialog:
  "This removes your local data. Your farm
  stays in the network unless an admin removes it."
  [Cancel]  [Leave]
      → on confirm: clear all localStorage keys → navigate to /
```

---

## Phase 3 — Termination

### Voluntary leave

Triggered from Profile → "Leave the network."

1. Confirmation dialog shown (irreversible warning).
2. On confirm: clear `localStorage` — `farm_id`, `cycle_start_date`, `task_progress`, `last_bundle_seen`, `yield_history`.
3. Navigate to `/`.
4. App is now in `NEW_USER` state.

**Backend:** no `DELETE /nodes` endpoint exists. Farm data remains in `farms.json`. The optimizer continues treating the node as available. This is a known gap — acceptable for MVP.

**If user re-joins:** they go through Setup again and get a new `farm_id`. The old node is orphaned.

---

### Voluntary pause

User wants to stay in the network but not receive active tasks.

1. In Profile: set "Pause until" date.
2. Stored in `localStorage['paused_until']`.
3. Dashboard shows "Paused" banner instead of tasks.
4. Cycle Update disabled while paused.
5. When `today >= paused_until`: pause lifts automatically.

**Backend:** no paused status concept. Node stays assigned. Acceptable for MVP.

---

### Passive dormancy

User stops opening the app. No UX needed. Farm stays in backend JSON.

---

## Route Map

| Route | Screen | Guard |
|-------|--------|-------|
| `/` | Landing | Redirect to `/dashboard` if `farm_id` present |
| `/suggestions` | Suggestions (pre-join) | None |
| `/setup` | Farm setup form | None |
| `/dashboard` | Dashboard | Requires `farm_id` → else `/` |
| `/update` | Cycle update | Requires `farm_id` → else `/` |
| `/wallet` | Wallet + delivery | Requires `farm_id` → else `/` |
| `/profile` | Profile + leave | Requires `farm_id` → else `/` |

No `/auth` route. No sign-in screen. No Supabase.

---

## API Call Map

| Screen | Trigger | Endpoint | Body |
|--------|---------|----------|------|
| Suggestions | Mount | `GET /crops` | — |
| Setup (submit) | Join button | `POST /nodes` | `{name, lat, lng, plot_size_sqft, plot_type, tools, budget, pH, moisture, temperature, humidity}` |
| Dashboard | Mount | `GET /nodes/{farm_id}` | — |
| Cycle Update | Sync conditions | `POST /nodes/{farm_id}/data` | `{pH, moisture, temperature, humidity}` |
| Cycle Update | End of cycle | `POST /optimize` | — |
| Cycle Update | After optimize | `GET /nodes/{farm_id}` | — |
| Wallet | Mount | `GET /hubs` | — |

---

## Loading, Error, and Empty States

Every screen with an API call must handle all three.

| Screen | Loading | Error | Empty |
|--------|---------|-------|-------|
| Suggestions | Skeleton crop cards | "Could not load crops — check connection" + retry | Not possible (always 10 crops) |
| Setup submit | "Connecting to network..." full-screen spinner | Error toast + retry, form preserved | — |
| Dashboard | Skeleton task list | "Could not load your assignment" + retry | First-time: welcome state |
| Cycle Update sync | Button loading state | "Sync failed — try again" toast | — |
| Wallet | Skeleton history rows | "Could not load hubs" for delivery selection | "No deliveries yet" empty state |
