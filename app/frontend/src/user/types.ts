// ---------------------------------------------------------------------------
// API response types — mirrors app/backend/api/models.py
// ---------------------------------------------------------------------------

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
  cycle_start_date: string | null;
  cycle_number: number | null;
  joined_at: string | null;
}

export interface SoilReadingResponse {
  farm_id: number;
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
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

export interface HubEntry {
  id: number;
  name: string;
  lat: number;
  lng: number;
  priority: 'critical' | 'standard' | 'low';
  capacity_kg: number;
}

export interface BalanceResponse {
  node_id: number;
  currency_balance: number;
  crops_on_hand: Record<string, number>;
  crops_lifetime: Record<string, number>;
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

export interface RequestResponse {
  id: number;
  type: string;
  node_id: number;
  hub_id: number | null;
  crop_id: number;
  quantity_kg: number;
  status: string;
  hub_options: unknown[];
  created_at: string;
  matched_at: string | null;
  confirmed_at: string | null;
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
  preferred_crop_ids: number[];
}

export interface ReadingEntryResponse {
  id: number;
  farm_id: number;
  crop_id: number;
  recorded_at: string;
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
}

// ---------------------------------------------------------------------------
// User task completion state (localStorage-backed)
// ---------------------------------------------------------------------------

export type UserTaskState = 'done' | 'skipped';

// ---------------------------------------------------------------------------
// Suggestions / Add-plot flow
// ---------------------------------------------------------------------------

export interface AddPlotFormData {
  name: string;
  lat: number | null;
  lng: number | null;
  plot_size_sqft: number;
  plot_type: string;
  sunlight_hours: number;
  tools: 'basic' | 'intermediate' | 'advanced';
  budget: 'low' | 'medium' | 'high';
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
}

export interface CropSuggestion {
  crop_id: number;
  crop_name: string;
  suitability_pct: number;
  estimated_yield_kg: number;
  grow_weeks: number;
  reason: string;
}

export interface SuggestionsRequest {
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
