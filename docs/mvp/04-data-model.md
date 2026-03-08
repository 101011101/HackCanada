# Data Model & Relationships

Every data structure in the system, what it represents, how it's typed, and how it connects to everything else.

---

A node starts as a **struct** (a bundle of named properties). When it enters the computation pipeline, it gets transformed into a **row vector** in the yield matrix. At network scale, all nodes together form a **matrix**. But the node itself holds much more than just scores — it holds identity, state, history, and spatial position.

The full picture:

```
Node (struct)  →  suitability_vector (1×M)  →  yield_matrix row (1×M)
                                                        ↓
                                             yield_matrix (N×M)  ←  all nodes together
```

---

## 1. Primitive Types Used

Before defining structures, the raw types:

```
int         — whole numbers (node ID, cycle count)
float       — decimal numbers (pH = 6.5, yield = 12.4 kg)
bool        — true/false (is this node locked?)
string      — text labels ('tomato', 'basic', 'growing')
enum        — a string constrained to a fixed set of values
date        — calendar date (cycle_start, cycle_end)
array       — ordered list of values [1, 2, 3]
map/dict    — key→value lookup { 'tomato': 12.4, 'lettuce': 8.1 }
matrix      — 2D array of floats, indexed [row][col]
graph       — nodes + edges (adjacency structure)
```

---

## 2. The Farm Node

The fundamental unit of the system. Everything else is derived from or relates to this.

```
FarmNode {
  // Identity
  id:             int           // unique, stable identifier e.g. 42
  name:           string        // "Farm #42" or user-chosen name

  // Spatial
  location: {
    lat:          float         // latitude  e.g. 43.6532
    lng:          float         // longitude e.g. -79.3832
  }

  // Physical capabilities (static — set at onboarding, rarely changes)
  plot_size_sqft: float         // e.g. 40.0
  plot_type:      enum          // 'balcony' | 'rooftop' | 'backyard' | 'community'
  tools:          enum          // 'basic' | 'intermediate' | 'advanced'
  budget:         enum          // 'low' | 'medium' | 'high'

  // Soil conditions (dynamic — updated each cycle)
  soil: {
    pH:           float         // 0.0–14.0,  e.g. 6.5
    moisture:     float         // 0.0–100.0, e.g. 65.0 (percent)
    temperature:  float         // celsius,   e.g. 22.0
    humidity:     float         // 0.0–100.0, e.g. 70.0 (percent)
  }

  // Temporal state (changes every cycle)
  status:         enum          // 'new' | 'growing' | 'available'
  current_crop:   int | null    // crop ID currently assigned, null if new/idle
  cycle_start:    date | null
  cycle_end:      date | null

  // History (grows over time)
  yield_history:  map<int, float[]>
  // key = crop_id, value = array of actual kg yields per past cycle
  // e.g. { 1: [88.0, 92.0, 79.0], 3: [44.0] }
}
```

**What this node is NOT yet:** it is not a vector. It's a named record. The vector form is computed from it.

---

## 3. The Crop Definition

Static lookup table. Defined once, not changed by the optimizer.

```
Crop {
  id:                    int      // e.g. 1
  name:                  string   // 'Tomato'
  color:                 string   // hex color for visualization '#e74c3c'

  // Hard gate requirements
  min_sqft:              float    // minimum viable growing space
  tool_requirement:      enum     // 'basic' | 'intermediate' | 'advanced'
  budget_requirement:    enum     // 'low' | 'medium' | 'high'

  // Soft score ranges  [min, max]
  optimal_pH:            float[2] // e.g. [6.0, 7.0]
  optimal_moisture:      float[2] // e.g. [60.0, 80.0]
  optimal_temp:          float[2] // e.g. [18.0, 27.0]

  // Yield
  base_yield_per_sqft:   float    // kg per sqft per cycle under ideal conditions
  grow_weeks:            int      // cycle length

  // Network targets
  network_target_share:  float    // ideal fraction of network growing this e.g. 0.15
}
```

10 crops → this is just a 10-row table. Each row is one crop's properties.

---

## 4. The Hub Node

A special node type. Not a farm — a physical distribution point.

```
HubNode {
  id:            int
  name:          string          // 'Greenwood Public School'
  location: {
    lat:         float
    lng:         float
  }
  type:          enum            // 'school' | 'community_center' | 'church' | 'other'
  priority:      enum            // 'critical' | 'standard'
                                 // critical hubs get hard coverage constraints
  capacity_kg:   float           // max food the hub can store at once
  local_demand:  map<int, float> // crop_id → kg needed per cycle
                                 // e.g. { 1: 20.0, 2: 15.0, 3: 10.0 }
}
```

---

## 5. The Network Configuration

The top-level settings that govern the whole system. Set by whoever runs the network.

```
NetworkConfig {
  max_travel_distance:   float          // meters e.g. 5000 (5km)
  food_targets:          map<int,float> // crop_id → total kg target per cycle
  food_ratios:           map<int,float> // crop_id → fraction of total e.g. 0.15
  cycle_epoch_weeks:     int            // how often full re-optimization runs e.g. 4
  inertia_weight:        float          // γ — penalty for changing assignments (0.0–1.0)
  overproduction_buffer: float          // allowed surplus fraction e.g. 0.20
}
```

---

## 6. Computed Data Structures (Derived at Runtime)

These are not stored permanently — they're computed fresh each optimization run.

### 6a. The Suitability Matrix

Shape: **N × M** (farms × crops)

```
suitability_matrix: float[N][M]

suitability_matrix[i][c] = suitability score of farm i for crop c
                         ∈ [0.0, 1.0]
                         = 0.0 if any hard gate fails
```

Example (4 farms, 4 crops):
```
            tomato  lettuce  spinach  herbs
Farm 0  [   1.00,    0.72,    0.68,   0.85  ]
Farm 1  [   0.00,    0.95,    0.91,   0.40  ]  ← 0.00: failed hard gate (too small for tomato)
Farm 2  [   0.61,    0.33,    0.28,   1.00  ]
Farm 3  [   0.84,    0.55,    0.50,   0.77  ]
```

Each row is a farm's **suitability vector** — a 1×M vector describing that farm's fitness across all crops. This is the closest thing to "a node as a vector."

### 6b. The Yield Matrix

Shape: **N × M** (farms × crops), in kg

```
yield_matrix: float[N][M]

yield_matrix[i][c] = suitability_matrix[i][c]
                   * crop[c].base_yield_per_sqft
                   * farm[i].plot_size_sqft
```

Example (same 4 farms):
```
            tomato   lettuce  spinach  herbs
Farm 0  [  100.00,   43.20,   30.60,  68.00  ]
Farm 1  [    0.00,   57.00,   40.95,  32.00  ]
Farm 2  [   61.00,   19.80,   12.60,  80.00  ]
Farm 3  [   84.00,   33.00,   22.50,  61.60  ]
```

This is what the optimizer actually uses. Not suitability — yield in kg. Suitability is just the intermediate step.

### 6c. The Reachability Matrix

Shape: **N × H** (farms × hubs), binary

```
reachability_matrix: bool[N][H]

reachability_matrix[i][h] = haversine(farm[i].location, hub[h].location)
                           ≤ network_config.max_travel_distance
```

Example (4 farms, 3 hubs):
```
        Hub0   Hub1   Hub2
Farm 0 [ true, true,  false ]
Farm 1 [ true, false, false ]
Farm 2 [ false,false, true  ]
Farm 3 [ false,true,  true  ]
```

Farm 2 can only reach Hub 2. Farm 0 can reach Hub 0 and Hub 1.

This is a **bipartite adjacency matrix** — a graph stored as a 2D boolean array.

### 6d. The Assignment Vector

Shape: **N × 1** (one crop ID per farm)

```
assignment: int[N]

assignment[i] = crop_id assigned to farm i by the optimizer
```

Example:
```
Farm 0 → 0  (tomato)
Farm 1 → 1  (lettuce)
Farm 2 → 3  (herbs)
Farm 3 → 0  (tomato)
```

This is the optimizer's output. One integer per farm.

### 6e. The Supply Vector

Shape: **M × 1** (one total kg value per crop)

```
supply: float[M]

supply[c] = Σᵢ yield_matrix[i][c] * (assignment[i] == c ? 1 : 0)
```

How much of each crop the network will produce given current assignments.

### 6f. The Gap Vector

Shape: **M × 1**

```
gap: float[M]

gap[c] = food_targets[c] - locked_supply[c]
```

What still needs to be filled by available (free) farms. This is what the optimizer is solving for.

### 6g. The ILP Decision Matrix

Shape: **N_free × M** (available farms × crops), binary

```
x: bool[N_free][M]

x[i][c] = 1 if the optimizer assigns available farm i to crop c
         = 0 otherwise
```

Constraint: exactly one 1 per row.

This is the variable the optimizer is solving for. It starts unknown, and Branch and Bound fills it in to satisfy all constraints while maximizing Σ x[i][c] * yield_matrix[i][c].

---

## 7. How All Data Structures Relate

```
NetworkConfig
  └── governs everything (targets, distances, epoch, inertia)

FarmNode[N]
  ├── location → reachability_matrix[N][H]  (via Haversine vs HubNode locations)
  ├── soil + capabilities → suitability_matrix[N][M]  (vs Crop definitions)
  ├── suitability_matrix × plot_size → yield_matrix[N][M]
  ├── status/cycle_end → locked_farms[] + available_farms[]
  └── assignment → supply_vector[M]

Crop[M]
  ├── requirements → gates in suitability_matrix
  ├── base_yield → scale factor in yield_matrix
  └── network_target_share → food_targets[M] in NetworkConfig

HubNode[H]
  ├── location → reachability_matrix[N][H]
  └── local_demand[M] → hub coverage constraints in ILP

ILP Optimizer
  inputs:  yield_matrix, reachability_matrix, gap_vector, locked_supply
  solves:  x[N_free][M]  (the assignment matrix for free farms)
  outputs: assignment[N], supply[M], coverage_report
```

---

## 8. The Network as a Graph

Beyond the matrices, the system is also a **graph** in the graph-theory sense:

```
Nodes:  FarmNode[N] + HubNode[H]
Edges:  reachability_matrix[N][H]  (farm → hub, directed, within max_distance)
```

This graph answers: "can food flow from farm i to hub h?" It's not used for pathfinding (no multi-hop routing at MVP) — it's used purely for constraint scoping in the optimizer.

If multi-hop routing is added later (farm → intermediate hub → destination hub), Dijkstra's algorithm runs on this graph to find minimum-distance paths. At MVP, each farm delivers directly to its nearest reachable hub — no pathfinding needed.

---

## 9. Temporal Dimension

Each FarmNode also has a **time series** dimension:

```
FarmNode over time:

  Cycle 1: { soil: {...}, assignment: 'tomato', yield_actual: 88.0 kg }
  Cycle 2: { soil: {...}, assignment: 'tomato', yield_actual: 92.0 kg }
  Cycle 3: { soil: {...}, assignment: 'lettuce', yield_actual: 44.0 kg }
  ...

Stored as: farm.yield_history = { 1: [88.0, 92.0], 2: [44.0] }
```

Once enough history accumulates, a yield predictor (ML model) replaces the formula:
```
yield_matrix[i][c] = predict(farm[i].yield_history, farm[i].soil, crop[c])
                   ← replaces: base_yield * suitability * sqft
```

The matrix shape doesn't change. Only how each cell is computed changes.

---

## 10. Summary: What Each Data Structure Is

| Structure | Type | Shape | What it represents |
|---|---|---|---|
| FarmNode | struct | — | A farm's full identity, state, and history |
| Crop | struct | — | A crop's requirements and yield constants |
| HubNode | struct | — | A hub's location, demand, and capacity |
| NetworkConfig | struct | — | Global network parameters |
| suitability_matrix | float matrix | N × M | How well each farm fits each crop (0–1) |
| yield_matrix | float matrix | N × M | Expected kg output per farm per crop |
| reachability_matrix | bool matrix | N × H | Which farms can reach which hubs |
| gap_vector | float array | M | How much of each crop the network still needs |
| supply_vector | float array | M | How much of each crop is currently assigned |
| assignment | int array | N | Which crop each farm is assigned to |
| x (ILP variable) | bool matrix | N_free × M | The optimizer's decision variable |
