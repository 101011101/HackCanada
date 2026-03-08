# API Service Layer

[MODE: DISCOVER — Updated after reading app/backend/]

Base URL: `app/backend/api/main.py` — FastAPI at `http://localhost:8000`
All calls go through `src/user/services/api.ts`. No raw fetch in components.

---

## Base Config

```ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new ApiError(res.status, detail?.detail ?? res.statusText);
  }
  return res.json();
}
```

---

## TypeScript Types (matching backend models.py exactly)

```ts
// POST /nodes
export interface NewFarmRequest {
  name: string;
  lat: number;
  lng: number;
  plot_size_sqft: number;
  plot_type: 'balcony' | 'rooftop' | 'backyard' | 'community';
  tools: 'basic' | 'intermediate' | 'advanced';
  budget: 'low' | 'medium' | 'high';
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
  preferred_crop_ids?: number[];
}

export interface BundleResponse {
  farm_id: number;
  farm_name: string;
  crop_id: number;
  crop_name: string;
  quantity_kg: number;
  grow_weeks: number;
  reason: string;
  preference_match: boolean;
  sqft_allocated: number | null;
  cycle_start_date: string | null;   // ISO date e.g. "2026-03-08"
  cycle_number: number | null;
  joined_at: string | null;          // ISO datetime
}

export interface SoilReadingResponse {
  farm_id: number;
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
}

export interface ReadingEntry {
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
}

export interface ReadingEntryResponse extends ReadingEntry {
  farm_id: number;
  timestamp: string;
}

export interface TaskItem {
  id: number;
  crop_id: number;
  crop_name: string;
  title: string;
  subtitle: string;
  why: string;
  how: string;
  target: string;
  tools_required: string;
  day_from_start: number;
  due_date: string | null;
  status: 'done' | 'upcoming' | 'future' | null;
}

export interface RiskFlag {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SuggestionRequest {
  plot_size_sqft: number;
  plot_type: string;
  tools: string;
  budget: string;
  pH?: number;
  moisture?: number;
  temperature?: number;
  preferred_crop_ids?: number[];
}

export interface SuggestionItem {
  crop_id: number;
  crop_name: string;
  suitability_pct: number;
  estimated_yield_kg: number;
  grow_weeks: number;
  reason: string;
}

export interface BalanceResponse {
  node_id: number;
  currency_balance: number;
  crops_on_hand: Record<string, number>;
  crops_lifetime: Record<string, number>;
}

export interface RequestBody {
  type: 'give' | 'receive';
  node_id: number;
  hub_id?: number | null;   // optional — engine assigns hub options
  crop_id: number;
  quantity_kg: number;
}

export interface HubOption {
  hub_id: number;
  hub_name: string;
  distance_km?: number;
}

export interface RequestResponse {
  id: number;
  type: 'give' | 'receive';
  node_id: number;
  hub_id: number | null;
  crop_id: number;
  quantity_kg: number;
  status: 'pending' | 'options_ready' | 'matched' | 'confirmed' | 'cancelled';
  hub_options: HubOption[];
  created_at: string;
  matched_at: string | null;
  confirmed_at: string | null;
}

export interface LedgerEntry {
  id: number;
  type: 'credit' | 'debit';
  node_id: number;
  request_id: number;
  amount: number;
  balance_after: number;
  created_at: string;
  note: string;
}

export interface Hub {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity_kg: number;
  priority: 'critical' | 'standard';
}

export interface Crop {
  id: number;
  name: string;
  grow_weeks: number;
  color?: string;
  base_yield_per_sqft?: number;
  optimal_pH?: [number, number];
}

export interface RateItem {
  crop_id: number;
  crop_name: string;
  rate: number;
}

export interface RateCostResponse {
  crop_id: number;
  quantity_kg: number;
  action: 'give' | 'receive';
  rate: number;
  earn?: number;
  cost?: number;
}

export interface CycleEndRequest {
  actual_yield_kg: Record<string, number>;  // { "crop_id_str": kg }
}

export interface CropGuide {
  crop_id: number;
  crop_name: string;
  guide: string;
}
```

---

## Service Functions

### Node / Farm

```ts
// Onboarding — create farm node
export const createNode = (body: NewFarmRequest) =>
  request<BundleResponse[]>('/nodes', { method: 'POST', body: JSON.stringify(body) });

// Dashboard — get current crop assignment + cycle info
export const getNode = (farmId: number) =>
  request<BundleResponse[]>(`/nodes/${farmId}`);

// Cycle end — log actual yield, get new assignment
export const cycleEnd = (farmId: number, body: CycleEndRequest) =>
  request<BundleResponse[]>(`/nodes/${farmId}/cycle-end`, {
    method: 'POST', body: JSON.stringify(body),
  });

// Balance + crops on hand
export const getBalance = (nodeId: number) =>
  request<BalanceResponse>(`/nodes/${nodeId}/balance`);

// Update crops on hand after harvest
export const updateCropsOnHand = (nodeId: number, crop_id: number, quantity_kg: number) =>
  request<{ crops_on_hand: Record<string, number> }>(`/nodes/${nodeId}/crops-on-hand`, {
    method: 'PATCH', body: JSON.stringify({ crop_id, quantity_kg }),
  });
```

### Soil Readings

```ts
// Get current soil readings
export const getSoilData = (farmId: number) =>
  request<SoilReadingResponse>(`/nodes/${farmId}/data`);

// Update current soil readings (lightweight, no history)
export const updateSoilData = (farmId: number, body: ReadingEntry) =>
  request<{ status: string; farm_id: number }>(`/nodes/${farmId}/data`, {
    method: 'PATCH', body: JSON.stringify(body),
  });

// Post a reading to the history log (also updates current values)
export const postReading = (farmId: number, body: ReadingEntry) =>
  request<ReadingEntryResponse>(`/nodes/${farmId}/readings`, {
    method: 'POST', body: JSON.stringify(body),
  });

// Get reading history for chart
export const getReadings = (farmId: number, limit = 30) =>
  request<ReadingEntryResponse[]>(`/nodes/${farmId}/readings?limit=${limit}`);
```

### Tasks & Risks

```ts
// Get task list for current crop assignment
export const getTasks = (farmId: number) =>
  request<TaskItem[]>(`/nodes/${farmId}/tasks`);

// Get risk flags (frost, overwatering, etc.)
export const getRisks = (farmId: number) =>
  request<RiskFlag[]>(`/nodes/${farmId}/risks`);

// Get crop growing guide
export const getGuide = (farmId: number) =>
  request<{ farm_id: number; guides: CropGuide[] }>(`/nodes/${farmId}/guide`);
```

### Requests (Delivery flow — 4-step state machine)

```ts
// Step 1: Submit delivery (hub_id omitted — engine will suggest options)
export const submitRequest = (body: RequestBody) =>
  request<RequestResponse>('/requests', { method: 'POST', body: JSON.stringify(body) });

// Step 3: Select hub from options (after engine sets status to 'options_ready')
export const selectHub = (requestId: number, hub_id: number) =>
  request<{ status: string; hub_id: number; message: string }>(
    `/requests/${requestId}/select-hub`,
    { method: 'POST', body: JSON.stringify({ hub_id }) }
  );

// List requests for a node (poll for status changes)
export const listRequests = (params: {
  node_id?: number; hub_id?: number; status?: string; type?: string;
}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  );
  return request<RequestResponse[]>(`/requests?${qs}`);
};

export const getRequest = (requestId: number) =>
  request<RequestResponse>(`/requests/${requestId}`);

export const cancelRequest = (requestId: number) =>
  request<{ status: string; request_id: number }>(`/requests/${requestId}`, { method: 'DELETE' });
```

### Ledger

```ts
export const getLedger = (nodeId: number) =>
  request<LedgerEntry[]>(`/ledger?node_id=${nodeId}`);
```

### Hubs & Crops

```ts
export const getHubs = () => request<Hub[]>('/hubs');
export const getCrops = () => request<Crop[]>('/crops');
export const getHubInventory = (hubId: number) =>
  request<{ hub_id: number; inventory: Array<{ crop_id: number; crop_name: string; quantity_kg: number }>; total_kg: number; capacity_kg: number }>(
    `/hubs/${hubId}/inventory`
  );
```

### Rates

```ts
export const getRates = () => request<RateItem[]>('/rates');

export const getDeliveryCost = (crop_id: number, quantity_kg: number, action: 'give' | 'receive') =>
  request<RateCostResponse>(`/rates/cost?crop_id=${crop_id}&quantity_kg=${quantity_kg}&action=${action}`);
```

### Suggestions

```ts
export const getSuggestions = (body: SuggestionRequest) =>
  request<SuggestionItem[]>('/suggestions', { method: 'POST', body: JSON.stringify(body) });
```

---

## Polling Strategy

No Supabase Realtime. Use setInterval.

**Wallet page — poll every 30s:**
- `listRequests({ node_id: farmId })` → detect options_ready (show hub picker) and confirmed (update balance)
- `getBalance(farmId)` → update HC balance display

**When engine detects options_ready on a request, show hub picker to user inline in the
transaction list without needing a page reload.**

---

## What Still Doesn't Exist

| Item | Status |
|------|--------|
| Task user-completion tracking | ❌ No endpoint — localStorage only |
| Sunlight hours | ❌ Not in any model — localStorage from onboarding |
| My Food / marketplace | ❌ Not built — stub page |
| Hub distance info in hub_options | ❓ `hub_options` shape TBD — may just have hub_id |
