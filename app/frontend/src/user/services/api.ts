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
  NewFarmRequest,
  SoilReadingResponse,
  TaskItem,
  RiskFlag,
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
