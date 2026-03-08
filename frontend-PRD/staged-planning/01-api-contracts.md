# API Contracts

## Agent Instructions

You are defining or implementing the API contracts for the farmer-facing frontend.

1. Read Layer 1 completely: `../01-user-flows.md`, `../02-product-requirements.md`, `../03-key-features.md`
2. Read `@PRD/03-architecture.md` — understand the backend layers (ingestion, digital twin, optimizer, packager)
3. Read `@PRD/05-datakit.md` — know every data variable the forms collect
4. **Run `do dis` via MCP** — discover what API routes, Supabase tables, and data schemas already exist. Do not invent endpoints that conflict with existing ones.
5. Fill in any `[TBD — check do dis]` fields after running discovery.
6. All API calls from the frontend go through a typed service layer (e.g. `src/services/`). No raw fetch calls in components.

---

## Auth (Supabase)

| Action | Method | Notes |
|--------|--------|-------|
| Sign up | `supabase.auth.signUp({ email, password })` | Returns session + user |
| Sign in | `supabase.auth.signInWithPassword({ email, password })` | Returns session + user |
| Sign out | `supabase.auth.signOut()` | Clears session |
| Get session | `supabase.auth.getSession()` | On app load |
| Auth state change | `supabase.auth.onAuthStateChange(callback)` | Subscribe in root provider |

---

## Suggestions API

### POST /suggestions
Called when user submits the suggestions form.

**Request:**
```ts
{
  plot_size_sqft: number,
  plot_type: "balcony" | "rooftop" | "backyard" | "community_lot",
  sunlight_hours: number,
  water_availability: "none" | "rain_fed" | "irrigation",
  tools: string[],           // e.g. ["spade", "watering_can"]
  budget_range: string,      // e.g. "20-50"
  soil_texture?: string      // optional
}
```

**Response:**
```ts
{
  suggestions: [
    {
      crop_id: string,
      crop_name: string,
      suitability_score: number,   // 0–100
      reason_tags: string[],       // e.g. ["Matches your pH", "Low water needs"]
      estimated_yield_kg: number,
      growing_notes?: string
    }
  ]
}
```

**Error cases:** 400 if required fields missing; 422 if values out of range.

---

## Farm Node API

### POST /farms
Create a new farm node (called at end of onboarding).

**Request:**
```ts
{
  user_id: string,           // from Supabase auth
  name: string,
  plot_type: string,
  plot_size_sqft: number,
  location: { lat: number, lng: number },
  soil: {
    texture?: string,
    depth_cm?: number,
    drainage?: string,
    ph?: number,
    organic_matter_pct?: number,
    nitrogen_ppm?: number,
    phosphorus_ppm?: number,
    potassium_ppm?: number,
    salinity_ds_m?: number
  },
  climate: {
    sunlight_hours_day?: number,
    avg_temp_c?: number,
    growing_season_days?: number,
    rainfall_distribution?: string
  },
  water: {
    availability?: string,
    quality_ec?: number
  },
  resources: {
    tools: string[],
    budget_range: string,
    time_per_week_hours: string
  }
}
```

**Response:**
```ts
{
  farm_id: string,
  node_id: string,
  instruction_bundle: InstructionBundle   // first bundle, see below
}
```

### GET /farms/:farm_id
Fetch farm node details (for profile/review).

**Response:** Full farm object matching the POST shape above.

### PATCH /farms/:farm_id
Update farm variables (from profile edit or onboarding resume).

**Request:** Partial farm object (only fields being updated).

---

## Instruction Bundle API

### GET /farms/:farm_id/bundle/current
Fetch the current cycle instruction bundle.

**Response:**
```ts
type InstructionBundle = {
  bundle_id: string,
  farm_id: string,
  cycle_number: number,
  cycle_start: string,   // ISO date
  cycle_end: string,
  crops: [
    {
      crop_id: string,
      crop_name: string,
      quantity_target_kg: number,
      zone_label?: string
    }
  ],
  tasks: [
    {
      task_id: string,
      title: string,
      description: string,
      due_date: string,
      tools_required: string[],
      time_estimate_minutes: number,
      status: "pending" | "in_progress" | "completed" | "overdue"
    }
  ],
  risk_flags: [
    {
      type: string,       // e.g. "frost", "overwatering_risk"
      message: string,
      severity: "low" | "medium" | "high"
    }
  ],
  expected_yield_kg: number
}
```

**Realtime:** Subscribe to Supabase Realtime on the `instruction_bundles` table filtered by `farm_id` to receive live updates when re-optimization produces a new bundle.

---

## Cycle Update API

### POST /farms/:farm_id/updates
Submit a condition update or yield log.

**Request:**
```ts
{
  cycle_number: number,
  type: "conditions" | "yield",
  // if type === "conditions":
  conditions?: {
    soil_moisture?: number,
    temperature_c?: number,
    notes?: string,
    photo_url?: string
  },
  // if type === "yield":
  yield?: {
    crop_id: string,
    actual_yield_kg: number
  },
  task_progress?: [
    { task_id: string, status: "in_progress" | "completed" | "skipped" }
  ]
}
```

**Response:**
```ts
{
  update_id: string,
  synced_at: string,
  new_bundle?: InstructionBundle   // present if re-optimization ran
}
```

---

## Wallet & Delivery API

### GET /users/:user_id/wallet
Fetch currency balance and transaction history.

**Response:**
```ts
{
  balance: number,
  currency_symbol: "HC",
  transactions: [
    {
      transaction_id: string,
      type: "earn" | "spend",
      amount: number,
      description: string,
      hub_name: string,
      created_at: string,
      status: "confirmed" | "pending"
    }
  ]
}
```

**Realtime:** Subscribe to Supabase Realtime on wallet/transactions table for live balance updates.

### POST /deliveries
Log a new delivery.

**Request:**
```ts
{
  farm_id: string,
  hub_id: string,
  crop_id: string,
  quantity_kg: number,
  photo_url?: string
}
```

**Response:**
```ts
{
  delivery_id: string,
  status: "pending",
  submitted_at: string,
  estimated_credit: number   // HC amount if confirmed
}
```

---

## Hubs API

### GET /hubs/nearby
Fetch hubs near the farmer's location.

**Query params:** `lat`, `lng`, `radius_km` (default 5)

**Response:**
```ts
{
  hubs: [
    {
      hub_id: string,
      name: string,
      address: string,
      lat: number,
      lng: number,
      distance_km: number,
      is_accepting_deliveries: boolean
    }
  ]
}
```

---

## OCR API

### POST /ocr/extract
Send a photo for numeric value extraction.

**Request:** `multipart/form-data` with `image` file + `field_hint` string (e.g. `"ph"`, `"nitrogen"`)

**Response:**
```ts
{
  extracted_value: number | null,
  confidence: number,    // 0–1
  raw_text: string
}
```

**Rule:** If `confidence < 0.7`, frontend must show the raw photo + manual entry fallback rather than auto-filling.

---

## [TBD — check do dis]

Run `do dis` to confirm and fill in:
- Base URL / API gateway URL
- Auth header format (Bearer token vs Supabase anon key)
- Any existing endpoint paths that differ from above
- Supabase table names for Realtime subscriptions
- Whether OCR runs client-side (Tesseract.js) or server-side
