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

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

import type {
  BundleResponse,
  BalanceResponse,
  ReadingEntryResponse,
  NewFarmRequest,
  SoilReadingResponse,
  TaskItem,
  RiskFlag,
  HubEntry,
  CropSuggestion,
  SuggestionsRequest,
} from '../types';

export function createNode(body: NewFarmRequest): Promise<BundleResponse[]> {
  return request<BundleResponse[]>('/nodes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getNode(farmId: number): Promise<BundleResponse[]> {
  return request<BundleResponse[]>(`/nodes/${farmId}`);
}

export function getSoilData(farmId: number): Promise<SoilReadingResponse> {
  return request<SoilReadingResponse>(`/nodes/${farmId}/data`);
}

export function getTasks(farmId: number): Promise<TaskItem[]> {
  return request<TaskItem[]>(`/nodes/${farmId}/tasks`);
}

export function getRisks(farmId: number): Promise<RiskFlag[]> {
  return request<RiskFlag[]>(`/nodes/${farmId}/risks`);
}

export function postCycleEnd(
  farmId: number,
  actualYieldKg: Record<string, number>
): Promise<BundleResponse[]> {
  return request<BundleResponse[]>(`/nodes/${farmId}/cycle-end`, {
    method: 'POST',
    body: JSON.stringify({ actual_yield_kg: actualYieldKg }),
  });
}

export function postReadings(
  farmId: number,
  body: { crop_id: number; pH: number; moisture: number; temperature: number; humidity: number }
): Promise<ReadingEntryResponse> {
  return request<ReadingEntryResponse>(`/nodes/${farmId}/readings`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getBalance(farmId: number): Promise<BalanceResponse> {
  return request<BalanceResponse>(`/nodes/${farmId}/balance`);
}

export function getReadings(farmId: number, limit = 30, cropId?: number): Promise<ReadingEntryResponse[]> {
  const params = cropId !== undefined ? `?limit=${limit}&crop_id=${cropId}` : `?limit=${limit}`;
  return request<ReadingEntryResponse[]>(`/nodes/${farmId}/readings${params}`);
}

export function getSuggestions(body: SuggestionsRequest): Promise<CropSuggestion[]> {
  return request<CropSuggestion[]>('/suggestions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getHubs(): Promise<HubEntry[]> {
  return request<HubEntry[]>('/hubs');
}

export function addCropsToNode(
  farmId: number,
  cropIds: number[],
  replace: boolean
): Promise<BundleResponse[]> {
  return request<BundleResponse[]>(`/nodes/${farmId}/crops`, {
    method: 'PATCH',
    body: JSON.stringify({ crop_ids: cropIds, replace }),
  });
}
