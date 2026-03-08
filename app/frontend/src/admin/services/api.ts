import type { FarmNode, HubNode } from "../nodal-network/data";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export interface BundleResponse {
  farm_id: number;
  farm_name: string;
  crop_id: number;
  crop_name: string;
  quantity_kg: number;
  grow_weeks: number;
  reason: string;
}

export interface NewFarmRequest {
  name: string;
  lat: number;
  lng: number;
  plot_size_sqft: number;
  plot_type: string;
  tools: string;
  budget: string;
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
  preferred_crop_ids?: number[];
}

export interface SoilUpdateRequest {
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
  sunlight_hours?: number;
}

export function getFarms(): Promise<FarmNode[]> {
  return request<FarmNode[]>('/farms');
}

export function getHubs(): Promise<HubNode[]> {
  return request<HubNode[]>('/hubs');
}

export function createFarm(body: NewFarmRequest): Promise<BundleResponse[]> {
  return request<BundleResponse[]>('/nodes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateSoil(farmId: number, body: SoilUpdateRequest): Promise<void> {
  return request<void>(`/nodes/${farmId}/data`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export interface Crop {
  id: number;
  name: string;
  color: string;
  min_sqft: number;
  grow_weeks: number;
  base_yield_per_sqft: number;
}

export interface OverproductionAlert {
  crop_name: string;
  target_kg: number;
  supplied_kg: number;
  surplus_kg: number;
  surplus_ratio: number;
}

export interface UnlockingSoonItem {
  farm_id: number;
  farm_name: string;
  crop_name: string;
  cycle_end_date: string;
  days_remaining: number;
}

export interface ReportResponse {
  network_health_pct: number;
  total_yield_kg: number;
  farms_total: number;
  farms_assigned: number;
  farms_locked: number;
  coverage_by_crop: Record<string, {
    target_kg: number;
    supplied_kg: number;
    gap_pct: number;
    surplus_kg: number;
    met: boolean;
  }>;
  hub_coverage: Record<string, unknown>;
  unlocking_soon: UnlockingSoonItem[];
  overproduction_alerts: OverproductionAlert[];
}

export function getCrops(): Promise<Crop[]> {
  return request<Crop[]>('/crops');
}

export function getAssignments(): Promise<Record<string, number[]>> {
  return request<Record<string, number[]>>('/assignments');
}

export function getReport(): Promise<ReportResponse> {
  return request<ReportResponse>('/report');
}

export function runOptimize(): Promise<{ status: string; farms_optimized: number; network_health_pct: number }> {
  return request<{ status: string; farms_optimized: number; network_health_pct: number }>('/optimize', {
    method: 'POST',
  });
}

export function getHubRouting(): Promise<Record<string, number[]>> {
  return request<Record<string, number[]>>('/hubs/routing');
}

export function computeHubRouting(): Promise<Record<string, number[]>> {
  return request<Record<string, number[]>>('/hubs/routing/compute', { method: 'POST' });
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

export function getFarmTasks(farmId: number): Promise<TaskItem[]> {
  return request<TaskItem[]>(`/nodes/${farmId}/tasks`);
}

export interface LedgerEntry {
  id: number;
  node_id: number;
  request_id: number | null;
  type: string;
  amount: number;
  currency: string;
  created_at: string;
}

export function getLedger(nodeId?: number): Promise<LedgerEntry[]> {
  const qs = nodeId != null ? `?node_id=${nodeId}` : '';
  return request<LedgerEntry[]>(`/ledger${qs}`);
}

export function deleteFarm(farmId: number): Promise<{ status: string; farm_id: number }> {
  return request<{ status: string; farm_id: number }>(`/nodes/${farmId}`, {
    method: 'DELETE',
  });
}

export interface SuggestionItem {
  crop_id: number;
  crop_name: string;
  suitability_pct: number;
  estimated_yield_kg: number;
  grow_weeks: number;
  reason: string;
}

export interface SuggestionRequest {
  plot_size_sqft: number;
  plot_type: string;
  tools: string;
  budget: string;
  pH?: number;
  moisture?: number;
  temperature?: number;
  humidity?: number;
  preferred_crop_ids?: number[];
}

export function getSuggestions(req: SuggestionRequest): Promise<SuggestionItem[]> {
  return request<SuggestionItem[]>('/suggestions', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export interface NewHubRequest {
  name: string;
  lat: number;
  lng: number;
  priority: string;
  capacity_kg: number;
  local_demand: Record<string, number>;
}

export function createHub(body: NewHubRequest): Promise<HubNode> {
  return request<HubNode>('/hubs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteHub(hubId: number): Promise<{ status: string; hub_id: number }> {
  return request<{ status: string; hub_id: number }>(`/hubs/${hubId}`, {
    method: 'DELETE',
  });
}

export function generateHubKey(hubId: number): Promise<{ hub_id: number; key: string }> {
  return request<{ hub_id: number; key: string }>(`/hubs/${hubId}/key/generate`, {
    method: 'POST',
  });
}

export function getHubKeys(): Promise<Record<string, string>> {
  return request<Record<string, string>>('/hubs/keys');
}
