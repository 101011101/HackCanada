/**
 * MyFood API client. All MyFood API calls go through this module.
 * Backend: app/backend/api/ (FastAPI).
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.join?.(" ") ?? res.statusText;
    throw new ApiError(res.status, detail, detail);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Types (match app/backend/api/models.py)
// ---------------------------------------------------------------------------

export interface RequestBody {
  type: "give" | "receive";
  node_id: number;
  hub_id?: number | null;
  crop_id: number;
  quantity_kg: number;
}

export interface RequestResponse {
  id: number;
  type: string;
  node_id: number;
  hub_id: number | null;
  crop_id: number;
  quantity_kg: number;
  status: string;
  hub_options: HubOption[];
  created_at: string;
  matched_at: string | null;
  confirmed_at: string | null;
}

export interface HubOption {
  hub_id?: number;
  hub_name?: string;
  distance_km?: number;
}

export interface BalanceResponse {
  node_id: number;
  currency_balance: number;
  crops_on_hand: Record<string, number>;
  crops_lifetime: Record<string, number>;
}

export interface SelectHubResponse {
  status: string;
  hub_id: number;
  message: string;
}

export interface AcceptResponse {
  status: string;
  hub_id: number;
  message: string;
}

export interface ConfirmResponse {
  status: string;
  currency_delta: number;
  node_balance_after: number;
  hub_inventory_after: number;
}

export interface LedgerEntryResponse {
  id: number;
  type: string;
  node_id: number;
  request_id: number;
  amount: number;
  balance_after: number;
  created_at: string;
  note: string;
}

export interface RateItem {
  crop_id: number;
  crop_name: string;
  rate: number;
}

export interface RateCostResponse {
  crop_id: number;
  quantity_kg: number;
  action: string;
  rate: number;
  earn?: number;
  cost?: number;
}

export interface Hub {
  id: number;
  name: string;
  lat?: number;
  lng?: number;
  capacity_kg?: number;
  [key: string]: unknown;
}

export interface Crop {
  id: number;
  name: string;
  grow_weeks?: number;
  color?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function getBalance(nodeId: number) {
  return request<BalanceResponse>(`/nodes/${nodeId}/balance`);
}

export function listRequests(params?: {
  node_id?: number;
  hub_id?: number;
  status?: string;
  type?: string;
}) {
  const qs = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  return request<RequestResponse[]>(`/requests${qs ? `?${qs}` : ""}`);
}

export function getRequest(requestId: number) {
  return request<RequestResponse>(`/requests/${requestId}`);
}

export function submitRequest(body: RequestBody) {
  return request<RequestResponse>("/requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function selectHub(requestId: number, hub_id: number) {
  return request<SelectHubResponse>(`/requests/${requestId}/select-hub`, {
    method: "POST",
    body: JSON.stringify({ hub_id }),
  });
}

export function acceptRequest(requestId: number, hub_id: number) {
  return request<AcceptResponse>(`/requests/${requestId}/accept`, {
    method: "POST",
    body: JSON.stringify({ hub_id }),
  });
}

export function confirmRequest(requestId: number, actual_quantity_kg: number) {
  return request<ConfirmResponse>(`/requests/${requestId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ actual_quantity_kg }),
  });
}

export function getRates() {
  return request<RateItem[]>("/rates");
}

export function getDeliveryCost(
  crop_id: number,
  quantity_kg: number,
  action: "give" | "receive"
) {
  return request<RateCostResponse>(
    `/rates/cost?crop_id=${crop_id}&quantity_kg=${quantity_kg}&action=${action}`
  );
}

export function getLedger(node_id?: number) {
  const qs = node_id != null ? `?node_id=${node_id}` : "";
  return request<LedgerEntryResponse[]>(`/ledger${qs}`);
}

export function cancelRequest(requestId: number) {
  return request<{ status: string; request_id: number }>(`/requests/${requestId}`, {
    method: "DELETE",
  });
}

export function getCrops() {
  return request<Crop[]>("/crops");
}

export function getHubs() {
  return request<Hub[]>("/hubs");
}

export interface FarmBasic {
  id: number;
  name: string;
  [key: string]: unknown;
}

export function getFarms() {
  return request<FarmBasic[]>("/farms");
}
