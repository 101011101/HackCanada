# API Service Layer

[MODE: DISCOVER]

All API calls go through `src/user/services/api.ts`. No raw `fetch` in components.

---

## Base Config

```ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

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

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
```

---

## Types (from backend models)

```ts
// POST /nodes request
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
}

export interface BalanceResponse {
  node_id: number;
  currency_balance: number;
  crops_on_hand: Record<string, number>;   // {crop_id_str: kg}
  crops_lifetime: Record<string, number>;
}

export interface SoilUpdateRequest {
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
}

export interface RequestBody {
  type: 'give' | 'receive';
  node_id: number;
  hub_id: number;
  crop_id: number;
  quantity_kg: number;
}

export interface RequestResponse {
  id: number;
  type: 'give' | 'receive';
  node_id: number;
  hub_id: number;
  crop_id: number;
  quantity_kg: number;
  status: 'pending' | 'matched' | 'confirmed' | 'cancelled';
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
  priority: string;
  // address not in current model — derive from name for display
}

export interface Crop {
  id: number;
  name: string;
  grow_weeks: number;
  color?: string;
  base_yield_per_sqft?: number;
  optimal_pH?: [number, number];
}

export interface CropsOnHandBody {
  crop_id: number;
  quantity_kg: number;
}
```

---

## Service Functions

### Node / Farm

```ts
// Create new farm node — called at end of onboarding
export const createNode = (body: NewFarmRequest) =>
  request<BundleResponse[]>('/nodes', { method: 'POST', body: JSON.stringify(body) });

// Get current crop bundle for a farm
export const getNode = (farmId: number) =>
  request<BundleResponse[]>(`/nodes/${farmId}`);

// Update soil/climate readings
export const updateNodeData = (farmId: number, body: SoilUpdateRequest) =>
  request<{ status: string; farm_id: number }>(`/nodes/${farmId}/data`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

// Get balance + crops on hand
export const getBalance = (nodeId: number) =>
  request<BalanceResponse>(`/nodes/${nodeId}/balance`);

// Update crops on hand (after harvest / self-consumption)
export const updateCropsOnHand = (nodeId: number, body: CropsOnHandBody) =>
  request<{ crops_on_hand: Record<string, number> }>(`/nodes/${nodeId}/crops-on-hand`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
```

### Requests (Deliveries)

```ts
// Submit a give (delivery to hub) or receive request
export const submitRequest = (body: RequestBody) =>
  request<RequestResponse>('/requests', { method: 'POST', body: JSON.stringify(body) });

// List requests — filter by node for user's history
export const listRequests = (params: {
  node_id?: number;
  hub_id?: number;
  status?: string;
  type?: string;
}) => {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  );
  return request<RequestResponse[]>(`/requests?${qs}`);
};

export const getRequest = (requestId: number) =>
  request<RequestResponse>(`/requests/${requestId}`);

export const cancelRequest = (requestId: number) =>
  request<{ status: string; request_id: number }>(`/requests/${requestId}`, {
    method: 'DELETE',
  });
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

---

## What the Staged PRD Planned That Doesn't Exist

| Planned endpoint | Status | MVP decision |
|-----------------|--------|-------------|
| `POST /suggestions` | ❌ Not built | Client-side: GET /crops + score against user inputs |
| `GET /farms/:id/bundle/current` | ❌ Not built | Use `GET /nodes/{id}` (returns BundleResponse[], not full bundle) |
| `POST /farms/:id/updates` (cycle update) | ❌ Not built | Use `PATCH /nodes/{id}/data` for soil update; yield logging is local-only for MVP |
| `GET /users/:id/wallet` | ❌ Not built | Compose from `GET /nodes/{id}/balance` + `GET /ledger?node_id=X` |
| `POST /deliveries` | ❌ Not built | Use `POST /requests` with `type: "give"` |
| `GET /hubs/nearby` | ❌ Not built | Use `GET /hubs` (returns all) + client-side distance sort using farm lat/lng |
| `POST /ocr/extract` | ❌ Not built | Omit for MVP — manual entry only |
| Auth (Supabase) | ❌ Not applicable | No auth — localStorage farm_id only |
| Supabase Realtime | ❌ Not applicable | Poll balance every 30s when wallet page is open |

---

## Polling Strategy (no Realtime)

```ts
// In useBalance hook
useEffect(() => {
  if (!farmId) return;
  const fetchBalance = () => getBalance(farmId).then(setBalance).catch(setError);
  fetchBalance();
  const id = setInterval(fetchBalance, 30_000); // 30s
  return () => clearInterval(id);
}, [farmId]);
```

Same pattern for `listRequests` on wallet page — poll every 30s to catch hub confirmations.
