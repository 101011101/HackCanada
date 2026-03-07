# Network Logic & Optimization Engine

The intellectual core of MyCelium. This document defines how the system decides what each farm should grow, how food flows between nodes, and how the network re-optimizes over time.

---

## Problem Statement

Given N farm nodes (each with different capabilities) and a set of hub nodes (physical distribution points), assign crop production across nodes such that:

1. **Total food output** across the network is maximized
2. **Every node** can access diverse food within its maximum travel distance
3. **Assignments only change at harvest time** — no mid-cycle disruption
4. **New nodes joining mid-cycle** get the best possible assignment given locked state

These goals conflict, which is why you need an optimizer rather than a simple greedy heuristic.

---

## Problem Decomposition

The system breaks into four sub-problems solved in sequence:

```
┌─────────────────────────────────────────────────────┐
│ 1. SUITABILITY SCORING                              │
│    Farm conditions → expected yield per crop        │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ 2. SPATIAL ROUTING                                  │
│    Farm → Hub reachability graph (max distance)     │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ 3. TEMPORAL SCHEDULER                               │
│    Which nodes are locked vs free this cycle        │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ 4. OPTIMIZER                                        │
│    LP (global) or greedy (mid-cycle) assignment     │
└─────────────────────────────────────────────────────┘
```

---

## System Inputs

### Network Configuration (set at launch, adjustable per cycle)
```
network_config = {
  food_targets[crop]       // target kg per cycle per crop across the network
  food_ratios[crop]        // % of total production each crop should represent
  max_travel_distance      // meters — how far a node can go to access food
  hub_locations[]          // lat/lng of hubs (schools, community centers, etc.)
  cycle_length_default     // fallback cycle length in weeks
}
```

### Farm Node Schema
```
farm_node = {
  id, location,            // lat/lng
  plot_size_sqft,
  plot_type,               // 'balcony' | 'rooftop' | 'backyard' | 'community'
  tools,                   // 'basic' | 'intermediate' | 'advanced'
  budget,                  // 'low' | 'medium' | 'high'
  soil: {
    pH,                    // 0–14
    moisture,              // 0–100%
    temperature,           // celsius
    humidity               // 0–100%
  },
  current_crop,            // null if new/idle
  cycle_start_date,
  cycle_end_date,
  status,                  // 'growing' | 'available' | 'new'
  yield_history            // { cropId: [yield_kg, ...] } — grows over time
}
```

### Crop Definition Table
```
crop = {
  id, name, color,
  min_sqft,                // minimum viable growing space
  water_needs,             // 'low' | 'medium' | 'high'
  tool_requirement,        // 'basic' | 'intermediate' | 'advanced'
  budget_requirement,      // 'low' | 'medium' | 'high'
  optimal_pH: [min, max],
  optimal_moisture: [min, max],
  optimal_temp: [min, max],
  base_yield_per_sqft,     // kg per sqft per cycle (ideal conditions)
  grow_weeks,              // cycle length
  network_target_share     // ideal % of network nodes growing this
}
```

Starting crops: Tomatoes, Lettuce, Spinach, Herbs, Carrots, Kale, Peppers, Microgreens, Strawberries, Beans.

---

## Sub-problem 1: Suitability Scoring

Pure deterministic math. No ML required.

For each (farm, crop) pair, compute a suitability score 0–1 based on how well the farm's conditions match the crop's requirements.

```
suitability(farm, crop) =
  w_ph      * range_score(farm.pH,          crop.optimal_pH)
+ w_moisture * range_score(farm.moisture,    crop.optimal_moisture)
+ w_temp    * range_score(farm.temp,         crop.optimal_temp)
+ w_size    * clamp(farm.sqft / crop.min_sqft, 0, 1)
+ w_tools   * (farm.tools >= crop.tool_requirement ? 1 : 0)
+ w_budget  * (farm.budget >= crop.budget_requirement ? 1 : 0)
```

Where `range_score(value, [min, max])` = 1.0 if in range, smooth decay outside.

**Expected yield** per node per crop:
```
yield(farm, crop) = crop.base_yield_per_sqft * suitability(farm, crop) * farm.sqft
```

This produces an **N × M yield matrix** — the primary input to the optimizer.

---

## Sub-problem 2: Spatial Routing

**Structure:** Farms and hubs form a bipartite graph. An edge exists between farm `i` and hub `h` if:
```
distance(farm_i.location, hub_h.location) ≤ max_travel_distance
```

**Farm → Hub assignment:** Each farm delivers to its nearest reachable hub (or top-k reachable hubs for resilience). Simple nearest-neighbor lookup — O(N × H).

**Dijkstra applies** only if multi-hop relay routing is needed (farm → intermediate hub → destination hub). For MVP: direct delivery to nearest reachable hub only.

**Hub placement:** Hubs are user-configured inputs (real locations). If hub placement needs to be suggested, use k-medoids clustering on farm locations to find K optimal sites. This is a facility location problem — NP-hard in general, but the greedy k-medoids heuristic works well in practice.

**Hub coverage check:** For each hub region, track:
```
hub_coverage[h][c] = Σ farms reachable from h: x[farm][crop=c] * yield[farm][c]
```

This feeds directly into the optimizer as a hard constraint.

---

## Sub-problem 3: Temporal Scheduler

Farms cannot change crops mid-season. The scheduler tracks which nodes are locked vs available.

### Node States
```
'growing'   — currently in a cycle, assignment locked until cycle_end_date
'available' — just harvested, can be reassigned
'new'       — just joined the network, no history
```

### Rolling Horizon

As cycles complete at different times (staggered naturally by different crop grow times), nodes become available one by one. On each `cycle_end` event:

```
1. node.status → 'available'
2. Collect all currently available nodes
3. Compute locked_supply = Σ growing nodes' expected remaining yield
4. Compute remaining_gap[crop] = target[crop] - locked_supply[crop]
5. Run optimizer on available nodes only to fill remaining_gap
6. Assign crops, set new cycle_end_date per node
7. node.status → 'growing'
```

This is a **rolling horizon optimization** — continuously re-solving as nodes become free, rather than waiting for the entire network to reset.

### Full Network Re-optimization

Once per "network cycle" (configurable — e.g., every 4 weeks, aligned to the shortest crop cycle), a full LP solve runs across all nodes that have recently completed. This is the "ideal state" — maximum optimization, best comparative advantage assignments.

---

## Sub-problem 4: The Optimizer

### Algorithm Choice: Linear Programming

LP is the correct tool here, not a neural network.

- LP guarantees food ratio constraints are satisfied
- LP guarantees hub coverage constraints are met
- LP requires zero training data
- LP produces explainable results ("Node 7 grows spinach because network needs leafy greens and its pH of 6.2 is ideal")
- LP solves 100-farm networks in milliseconds

Neural networks are prediction machines, not constraint solvers. They cannot guarantee constraint satisfaction and require training data that doesn't exist yet.

### LP Formulation (Global Mode)

**Variables:**
```
x[i][c] ∈ [0, 1]   — fraction of farm i's land growing crop c
```

**Objective:**
```
Maximize: Σᵢ Σ_c  x[i][c] * yield[i][c]
```

**Constraints:**
```
// Each farm's land sums to 1
For each farm i:
  Σ_c x[i][c] = 1

// Locked nodes cannot be reassigned
For each locked farm i, current crop c0:
  x[i][c0] = 1

// Network food ratio targets must be met
For each crop c:
  Σᵢ x[i][c] * yield[i][c] ≥ target[c]

// Each hub region must have local coverage per crop
For each hub h, for each crop c:
  Σᵢ reachable(i,h): x[i][c] * yield[i][c] ≥ local_demand[h][c]
```

**Comparative advantage emerges automatically.** The LP naturally routes each farm to the crop where it creates the most value relative to what the network needs. You don't implement comparative advantage — it's a consequence of the objective function.

### Greedy Mode (Mid-Cycle, New Node Joining)

When a single new node joins mid-cycle, a full LP re-solve is unnecessary. Use greedy insertion:

```
current_supply[c] = Σ all locked nodes: x[i][c] * yield[i][c]
gap[c] = target[c] - current_supply[c]

// Also factor in whether this node is near an underserved hub
hub_urgency[c] = max over reachable hubs h: (local_demand[h][c] - current_hub_supply[h][c])

For each crop c:
  score[c] = yield[new_node][c] * gap[c] * (1 + hub_urgency[c])

Assign new_node → argmax(score)
```

Runs in O(M) per new node. Good enough mid-cycle because you're filling gaps, not globally re-solving.

---

## Full Data Flow

```
Network config + hub locations (given)
    → Precompute reachability_matrix[N][H]

Farm nodes join / update
    → Compute suitability_matrix[N][M]
    → Compute yield_matrix[N][M]

Scheduler fires (cycle_end event or new node join)
    → Classify locked vs available nodes
    → Compute locked_supply[M]
    → Compute remaining_gap[M]

Optimizer runs
    → Global LP: if many nodes available (full cycle reset)
    → Greedy: if single new node joining mid-cycle

Output: assignment[node] = crop + quantities
    → Instruction packager → per-node task bundle
    → Network state updated → visualization layer
```

---

## What ML Adds (Later, Not MVP)

ML is not part of the optimizer. It improves the optimizer's *inputs* over time:

| Component | ML Role | When |
|---|---|---|
| Yield estimator | Supervised learning on historical harvest data replaces the base yield formula | After 2–3 cycles of real data |
| Demand forecasting | Time-series model on hub consumption patterns | After hubs are live |
| Suitability tuning | Adjust crop requirement thresholds based on local outcomes | After sufficient yield history |

---

## MVP Build Order

1. **Crop & farm schemas** — define the data model
2. **Suitability scorer** — pure functions, deterministic
3. **Greedy optimizer** — demonstrates comparative advantage, fast to build
4. **Spatial router** — farm → hub distance graph, coverage check
5. **LP optimizer** — replaces greedy for full-cycle re-optimization
6. **Scheduler** — event queue, rolling horizon, mid-cycle insertion
7. **Instruction packager** — converts assignment into actionable farm tasks

Steps 1–3 with 15–20 simulated nodes is enough to demonstrate the core logic convincingly.
