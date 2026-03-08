import type {
  BundleResponse,
  TaskItem,
  RiskFlag,
  BalanceResponse,
  SoilReadingResponse,
  ReadingEntryResponse,
  CropSuggestion,
} from '../../types';

// ---------------------------------------------------------------------------
// BundleResponse fixtures
// ---------------------------------------------------------------------------

export const BUNDLE_TOMATO: BundleResponse = {
  farm_id: 1,
  farm_name: 'Test Farm Alpha',
  crop_id: 0,
  crop_name: 'Tomato',
  quantity_kg: 18.5,
  grow_weeks: 10,
  reason: 'Suitability 85% for Tomato — soil pH 6.5 (optimal 6.0–7.0), network gap 42% unfilled',
  preference_match: true,
  sqft_allocated: 100.0,
  cycle_start_date: '2026-01-01',
  cycle_number: 3,
  joined_at: '2025-06-15T00:00:00',
};

export const BUNDLE_LETTUCE: BundleResponse = {
  farm_id: 1,
  farm_name: 'Test Farm Alpha',
  crop_id: 1,
  crop_name: 'Lettuce',
  quantity_kg: 12.0,
  grow_weeks: 6,
  reason: 'Suitability 92% for Lettuce — soil pH 6.5 (optimal 6.0–7.0), network gap 30% unfilled',
  preference_match: false,
  sqft_allocated: 100.0,
  cycle_start_date: '2026-01-01',
  cycle_number: 3,
  joined_at: '2025-06-15T00:00:00',
};

export const BUNDLE_NO_CYCLE: BundleResponse = {
  farm_id: 2,
  farm_name: 'New Farm',
  crop_id: 3,
  crop_name: 'Herbs',
  quantity_kg: 5.0,
  grow_weeks: 8,
  reason: 'Suitability 70% for Herbs',
  preference_match: false,
  sqft_allocated: null,
  cycle_start_date: null,
  cycle_number: null,
  joined_at: null,
};

// ---------------------------------------------------------------------------
// TaskItem fixtures
// ---------------------------------------------------------------------------

export const TASK_WATER: TaskItem = {
  id: 1,
  crop_id: 0,
  crop_name: 'Tomato',
  title: 'Water your tomatoes',
  subtitle: 'Morning watering session',
  why: 'Tomatoes need consistent moisture during fruiting.',
  how: 'Water at the base, avoid wetting leaves. Use about 1–2L per plant.',
  target: 'Soil stays moist 2–3cm deep',
  tools_required: 'Watering can or hose',
  day_from_start: 1,
  due_date: '2026-01-02',
  status: 'upcoming',
};

export const TASK_FERTILIZE: TaskItem = {
  id: 2,
  crop_id: 0,
  crop_name: 'Tomato',
  title: 'Fertilize plants',
  subtitle: 'Apply balanced fertilizer',
  why: 'Phosphorus supports root development early in the cycle.',
  how: 'Mix 10mL liquid fertilizer per litre of water and apply to soil.',
  target: 'Nutrients reach root zone',
  tools_required: 'Measuring cup, watering can',
  day_from_start: 14,
  due_date: '2026-01-15',
  status: 'future',
};

export const TASK_HARVEST: TaskItem = {
  id: 3,
  crop_id: 0,
  crop_name: 'Tomato',
  title: 'Harvest ripe tomatoes',
  subtitle: 'Pick fruits at peak ripeness',
  why: 'Timely harvest maximizes yield quality and triggers more production.',
  how: 'Twist and pull gently. Harvest when fully red and slightly firm.',
  target: 'All ripe fruits collected',
  tools_required: 'Harvest basket',
  day_from_start: 65,
  due_date: '2026-03-07',
  status: 'done',
};

export const TASKS_SAMPLE: TaskItem[] = [TASK_WATER, TASK_FERTILIZE, TASK_HARVEST];

// ---------------------------------------------------------------------------
// RiskFlag fixtures
// ---------------------------------------------------------------------------

export const RISK_LOW_MOISTURE: RiskFlag = {
  type: 'moisture',
  message: 'Soil moisture is low (42%). Tomatoes prefer 60–80%. Increase watering frequency.',
  severity: 'medium',
};

export const RISK_HIGH_TEMP: RiskFlag = {
  type: 'temperature',
  message: 'Temperature is high (32°C). Optimal range is 18–27°C. Consider shade cloth.',
  severity: 'high',
};

// ---------------------------------------------------------------------------
// Balance fixtures
// ---------------------------------------------------------------------------

export const BALANCE_BASIC: BalanceResponse = {
  node_id: 1,
  currency_balance: 125.50,
  crops_on_hand: { '0': 3.5, '1': 1.2 },
  crops_lifetime: { '0': 45.0, '1': 12.0 },
};

export const BALANCE_ZERO: BalanceResponse = {
  node_id: 2,
  currency_balance: 0.0,
  crops_on_hand: {},
  crops_lifetime: {},
};

// ---------------------------------------------------------------------------
// Soil reading fixtures
// ---------------------------------------------------------------------------

export const SOIL_READING_GOOD: SoilReadingResponse = {
  farm_id: 1,
  pH: 6.5,
  moisture: 65,
  temperature: 22,
  humidity: 65,
};

export const SOIL_READING_STRESS: SoilReadingResponse = {
  farm_id: 1,
  pH: 5.2,
  moisture: 30,
  temperature: 35,
  humidity: 20,
};

// ---------------------------------------------------------------------------
// Historical reading fixtures
// ---------------------------------------------------------------------------

export const READINGS_HISTORY: ReadingEntryResponse[] = [
  { id: 1, farm_id: 1, crop_id: 0, recorded_at: '2026-02-01T08:00:00', pH: 6.4, moisture: 62, temperature: 20, humidity: 63 },
  { id: 2, farm_id: 1, crop_id: 0, recorded_at: '2026-02-08T08:00:00', pH: 6.5, moisture: 65, temperature: 22, humidity: 65 },
  { id: 3, farm_id: 1, crop_id: 0, recorded_at: '2026-02-15T08:00:00', pH: 6.6, moisture: 68, temperature: 23, humidity: 67 },
  { id: 4, farm_id: 1, crop_id: 0, recorded_at: '2026-02-22T08:00:00', pH: 6.3, moisture: 60, temperature: 21, humidity: 61 },
  { id: 5, farm_id: 1, crop_id: 0, recorded_at: '2026-03-01T08:00:00', pH: 6.5, moisture: 65, temperature: 22, humidity: 65 },
];

// ---------------------------------------------------------------------------
// Crop suggestion fixtures
// ---------------------------------------------------------------------------

export const SUGGESTIONS_SAMPLE: CropSuggestion[] = [
  {
    crop_id: 0,
    crop_name: 'Tomato',
    suitability_pct: 87.5,
    estimated_yield_kg: 22.5,
    grow_weeks: 10,
    reason: 'Excellent pH match. High demand in your network.',
  },
  {
    crop_id: 1,
    crop_name: 'Lettuce',
    suitability_pct: 92.0,
    estimated_yield_kg: 15.0,
    grow_weeks: 6,
    reason: 'Thrives in your temperature range. Fastest growing option.',
  },
  {
    crop_id: 5,
    crop_name: 'Kale',
    suitability_pct: 78.0,
    estimated_yield_kg: 18.0,
    grow_weeks: 8,
    reason: 'Good moisture tolerance. Community hub has high demand.',
  },
];
