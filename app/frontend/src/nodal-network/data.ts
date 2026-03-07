export interface FarmNode {
  id: number;
  name: string;
  lat: number;
  lng: number;
  plot_size_sqft: number | null;
  plot_type: "balcony" | "rooftop" | "backyard" | "community" | null;
  tools: "basic" | "intermediate" | "advanced" | null;
  budget: "low" | "medium" | "high" | null;
  pH: number | null;
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  status: "new" | "available" | "growing";
  current_crop_id: number | null;
  cycle_end_date: string | null;
}

export interface HubNode {
  id: number;
  name: string;
  lat: number;
  lng: number;
  priority: "critical" | "standard";
  capacity_kg: number;
  local_demand: Record<number, number>;
}

export interface Crop {
  id: number;
  name: string;
  color: string;
  min_sqft: number;
  grow_weeks: number;
  base_yield_per_sqft: number;
}

// ── Crops (from main branch engine) ─────────────────────────────────────────
export const crops: Crop[] = [
  { id: 0, name: "Tomato",       color: "#e74c3c", min_sqft: 10, grow_weeks: 10, base_yield_per_sqft: 2.5 },
  { id: 1, name: "Lettuce",      color: "#2ecc71", min_sqft: 4,  grow_weeks: 4,  base_yield_per_sqft: 1.5 },
  { id: 2, name: "Spinach",      color: "#27ae60", min_sqft: 4,  grow_weeks: 4,  base_yield_per_sqft: 1.2 },
  { id: 3, name: "Herbs",        color: "#1abc9c", min_sqft: 2,  grow_weeks: 6,  base_yield_per_sqft: 0.8 },
  { id: 4, name: "Carrots",      color: "#e67e22", min_sqft: 6,  grow_weeks: 10, base_yield_per_sqft: 2.0 },
  { id: 5, name: "Kale",         color: "#16a085", min_sqft: 4,  grow_weeks: 6,  base_yield_per_sqft: 1.3 },
  { id: 6, name: "Peppers",      color: "#c0392b", min_sqft: 8,  grow_weeks: 12, base_yield_per_sqft: 1.8 },
  { id: 7, name: "Microgreens",  color: "#f1c40f", min_sqft: 2,  grow_weeks: 2,  base_yield_per_sqft: 0.5 },
  { id: 8, name: "Strawberries", color: "#e91e63", min_sqft: 6,  grow_weeks: 8,  base_yield_per_sqft: 1.5 },
  { id: 9, name: "Beans",        color: "#8bc34a", min_sqft: 6,  grow_weeks: 8,  base_yield_per_sqft: 1.0 },
];

const cropMap = new Map(crops.map(c => [c.id, c]));
export function getCrop(id: number): Crop | undefined {
  return cropMap.get(id);
}

// ── Hubs (3 distribution points in Toronto) ─────────────────────────────────
export const hubs: HubNode[] = [
  {
    id: 0, name: "Greenwood Public School", lat: 43.6532, lng: -79.3832,
    priority: "critical", capacity_kg: 500,
    local_demand: { 0: 30, 1: 25, 2: 20, 3: 15, 4: 20, 5: 20, 6: 15, 7: 15, 8: 10, 9: 10 },
  },
  {
    id: 1, name: "North Community Centre", lat: 43.6700, lng: -79.4000,
    priority: "standard", capacity_kg: 400,
    local_demand: { 0: 15, 1: 12, 2: 10, 3: 8, 4: 10, 5: 10, 6: 8, 7: 8, 8: 5, 9: 5 },
  },
  {
    id: 2, name: "East Neighbourhood Hub", lat: 43.6400, lng: -79.3600,
    priority: "standard", capacity_kg: 300,
    local_demand: { 0: 15, 1: 12, 2: 10, 3: 8, 4: 10, 5: 10, 6: 8, 7: 8, 8: 5, 9: 5 },
  },
];

// ── Farms (21 nodes clustered around Toronto) ───────────────────────────────
// Lat/lng are all within ~3 km of downtown Toronto (43.65, -79.38)
export const farms: FarmNode[] = [
  // Available / New
  { id: 0,  name: "Farm #01 — Balcony",        lat: 43.6520, lng: -79.3820, plot_size_sqft: 25,  plot_type: "balcony",   tools: "basic",        budget: "low",    pH: 6.5, moisture: 65, temperature: 22, humidity: 65, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 2,  name: "Farm #03 — Backyard",        lat: 43.6490, lng: -79.3750, plot_size_sqft: 120, plot_type: "backyard",  tools: "basic",        budget: "low",    pH: 6.2, moisture: 58, temperature: 19, humidity: 55, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 4,  name: "Farm #05 — Balcony",         lat: 43.6480, lng: -79.3810, plot_size_sqft: 15,  plot_type: "balcony",   tools: "basic",        budget: "low",    pH: 5.8, moisture: 45, temperature: 24, humidity: 58, status: "new",        current_crop_id: null, cycle_end_date: null },
  { id: 5,  name: "Farm #06 — Rooftop",         lat: 43.6680, lng: -79.4020, plot_size_sqft: 90,  plot_type: "rooftop",   tools: "intermediate", budget: "medium", pH: 6.6, moisture: 68, temperature: 21, humidity: 63, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 8,  name: "Farm #09 — Balcony",         lat: 43.6510, lng: -79.3870, plot_size_sqft: 20,  plot_type: "balcony",   tools: "basic",        budget: "low",    pH: 6.4, moisture: 60, temperature: 23, humidity: 62, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 10, name: "Farm #11 — Backyard",        lat: 43.6450, lng: -79.3700, plot_size_sqft: 200, plot_type: "backyard",  tools: "basic",        budget: "medium", pH: 6.1, moisture: 55, temperature: 18, humidity: 52, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 12, name: "Farm #13 — Balcony",         lat: 43.6540, lng: -79.3800, plot_size_sqft: 18,  plot_type: "balcony",   tools: "basic",        budget: "low",    pH: 6.3, moisture: 55, temperature: 22, humidity: 60, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 13, name: "Farm #14 — Rooftop",         lat: 43.6590, lng: -79.3920, plot_size_sqft: 110, plot_type: "rooftop",   tools: "advanced",     budget: "high",   pH: 6.8, moisture: 72, temperature: 22, humidity: 65, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 15, name: "Farm #16 — Community Lot",   lat: 43.6700, lng: -79.3960, plot_size_sqft: 320, plot_type: "community", tools: "intermediate", budget: "medium", pH: 6.5, moisture: 67, temperature: 20, humidity: 64, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 16, name: "Farm #17 — Balcony",         lat: 43.6500, lng: -79.3840, plot_size_sqft: 12,  plot_type: "balcony",   tools: "basic",        budget: "low",    pH: 6.6, moisture: 63, temperature: 23, humidity: 61, status: "new",        current_crop_id: null, cycle_end_date: null },
  { id: 17, name: "Farm #18 — Rooftop",         lat: 43.6360, lng: -79.3560, plot_size_sqft: 85,  plot_type: "rooftop",   tools: "intermediate", budget: "medium", pH: 6.4, moisture: 60, temperature: 19, humidity: 55, status: "available",  current_crop_id: null, cycle_end_date: null },
  { id: 18, name: "Farm #19 — Backyard",        lat: 43.6470, lng: -79.3770, plot_size_sqft: 250, plot_type: "backyard",  tools: "advanced",     budget: "high",   pH: 6.9, moisture: 73, temperature: 21, humidity: 67, status: "available",  current_crop_id: null, cycle_end_date: null },
  // Locked (growing)
  { id: 1,  name: "Farm #02 — Rooftop",         lat: 43.6550, lng: -79.3900, plot_size_sqft: 80,  plot_type: "rooftop",   tools: "intermediate", budget: "medium", pH: 6.8, moisture: 70, temperature: 21, humidity: 60, status: "growing",    current_crop_id: 0,    cycle_end_date: "2026-03-20" },
  { id: 3,  name: "Farm #04 — Community Lot",   lat: 43.6610, lng: -79.3950, plot_size_sqft: 400, plot_type: "community", tools: "advanced",     budget: "high",   pH: 7.0, moisture: 72, temperature: 20, humidity: 68, status: "growing",    current_crop_id: 1,    cycle_end_date: "2026-03-10" },
  { id: 6,  name: "Farm #07 — Backyard",        lat: 43.6420, lng: -79.3650, plot_size_sqft: 150, plot_type: "backyard",  tools: "basic",        budget: "low",    pH: 6.3, moisture: 62, temperature: 19, humidity: 57, status: "growing",    current_crop_id: 5,    cycle_end_date: "2026-03-15" },
  { id: 7,  name: "Farm #08 — Community Lot",   lat: 43.6720, lng: -79.3980, plot_size_sqft: 350, plot_type: "community", tools: "advanced",     budget: "high",   pH: 6.9, moisture: 75, temperature: 22, humidity: 70, status: "growing",    current_crop_id: 0,    cycle_end_date: "2026-03-25" },
  { id: 9,  name: "Farm #10 — Rooftop",         lat: 43.6380, lng: -79.3580, plot_size_sqft: 70,  plot_type: "rooftop",   tools: "intermediate", budget: "medium", pH: 6.7, moisture: 65, temperature: 20, humidity: 58, status: "growing",    current_crop_id: 7,    cycle_end_date: "2026-03-05" },
  { id: 11, name: "Farm #12 — Community Lot",   lat: 43.6660, lng: -79.4050, plot_size_sqft: 280, plot_type: "community", tools: "intermediate", budget: "medium", pH: 7.1, moisture: 78, temperature: 21, humidity: 72, status: "growing",    current_crop_id: 2,    cycle_end_date: "2026-03-12" },
  { id: 14, name: "Farm #15 — Backyard",        lat: 43.6430, lng: -79.3640, plot_size_sqft: 180, plot_type: "backyard",  tools: "basic",        budget: "low",    pH: 5.9, moisture: 50, temperature: 17, humidity: 48, status: "growing",    current_crop_id: 4,    cycle_end_date: "2026-03-30" },
  { id: 19, name: "Farm #20 — Community Lot",   lat: 43.6640, lng: -79.4030, plot_size_sqft: 180, plot_type: "community", tools: "basic",        budget: "low",    pH: 6.2, moisture: 58, temperature: 20, humidity: 58, status: "growing",    current_crop_id: 9,    cycle_end_date: "2026-03-18" },
  { id: 20, name: "Test Balcony",               lat: 43.6600, lng: -79.4000, plot_size_sqft: 80,  plot_type: "balcony",   tools: "basic",        budget: "medium", pH: 6.5, moisture: 55, temperature: 18, humidity: 60, status: "new",        current_crop_id: null, cycle_end_date: null },
];

// Optimizer-assigned crops for available/new farms (farm_id → crop_id)
export const assignments: Record<number, number> = {
  0: 0, 2: 0, 4: 0, 5: 6, 8: 3, 10: 0, 12: 0, 13: 6, 15: 6, 16: 0, 17: 8, 18: 6, 20: 0,
};

// ── Routing helpers (ported from main engine/router.py) ─────────────────────

const R_EARTH = 6_371_000; // metres

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dphi = toRad(lat2 - lat1);
  const dlam = toRad(lng2 - lng1);
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MAX_TRAVEL_DISTANCE = 5000; // 5 km

export function getNearestHub(farm: FarmNode): HubNode | null {
  let best: HubNode | null = null;
  let bestDist = Infinity;
  for (const hub of hubs) {
    const d = haversine(farm.lat, farm.lng, hub.lat, hub.lng);
    if (d <= MAX_TRAVEL_DISTANCE && d < bestDist) {
      bestDist = d;
      best = hub;
    }
  }
  return best;
}

export interface NetworkEdge {
  farmId: number;
  hubId: number;
  distanceM: number;
}

export function buildNetworkEdges(farmList?: FarmNode[]): NetworkEdge[] {
  const edges: NetworkEdge[] = [];
  for (const farm of (farmList ?? farms)) {
    const hub = getNearestHub(farm);
    if (hub) {
      edges.push({
        farmId: farm.id,
        hubId: hub.id,
        distanceM: haversine(farm.lat, farm.lng, hub.lat, hub.lng),
      });
    }
  }
  return edges;
}

export function getEffectiveCropId(farm: FarmNode): number | null {
  if (farm.status === "growing" && farm.current_crop_id != null) {
    return farm.current_crop_id;
  }
  return assignments[farm.id] ?? null;
}
