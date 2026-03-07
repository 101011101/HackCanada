# Network Logic — Technical Explanation

Every calculation, algorithm, and optimization decision explained from first principles.

---


What we're building is a **mathematical optimization program**. You write down exactly what you want (maximize food output), exactly what the rules are (farm constraints, hub coverage, locked nodes), and a solver finds the mathematically provable best answer. No training. No weights. No black box. Every decision is traceable.

The difference in one line:
- Neural network: *"learn from examples what a good answer looks like"*
- Our system: *"compute the provably best answer given these exact rules"*

---

## The Full System: Every Calculation

---

### Step 1: Suitability Scoring

**What it does:** Takes a farm's raw conditions and produces a single number per crop — how well this farm could grow it.

**Raw farm data:**
```
farm = {
  pH:          6.5,
  moisture:    65%,
  temperature: 22°C,
  sqft:        40,
  tools:       'intermediate',
  budget:      'medium'
}
```

**Each crop has requirements:**
```
tomato = {
  optimal_pH:          [6.0, 7.0],
  optimal_moisture:    [60, 80],
  optimal_temp:        [18, 27],
  min_sqft:            10,
  tool_requirement:    'basic',
  budget_requirement:  'low',
  base_yield_per_sqft: 2.5 kg
}
```

**The calculation is two phases:**

**Phase 1 — Hard gates (pass/fail):**
```
eligible = (farm.sqft >= crop.min_sqft)
        AND (farm.tools >= crop.tool_requirement)
        AND (farm.budget >= crop.budget_requirement)
```
If any gate fails → `suitability = 0`, stop. This farm cannot grow this crop.

**Phase 2 — Soft score (continuous 0→1):**
For each condition that passed, score how *well* it fits using a range score function:

```
range_score(value, min, max):
  if min ≤ value ≤ max:  return 1.0
  if value < min:        return 1 - (min - value) / min    ← decays below range
  if value > max:        return 1 - (value - max) / max    ← decays above range
  clamp result to [0, 1]
```

For our farm vs tomato:
```
pH_score       = range_score(6.5, [6.0, 7.0]) = 1.0   ← perfect
moisture_score = range_score(65,  [60, 80])   = 1.0   ← perfect
temp_score     = range_score(22,  [18, 27])   = 1.0   ← perfect
```

**Weighted sum:**
```
suitability = 0.25 * pH_score
            + 0.25 * moisture_score
            + 0.25 * temp_score
            + 0.25 * size_score       ← (farm.sqft / crop.min_sqft), capped at 1

            = 0.25*1.0 + 0.25*1.0 + 0.25*1.0 + 0.25*1.0
            = 1.0
```

**Expected yield:**
```
yield(farm, crop) = crop.base_yield_per_sqft * suitability * farm.sqft
                  = 2.5 * 1.0 * 40
                  = 100 kg per cycle
```

Run this for every (farm, crop) pair. With 20 farms and 10 crops, that's 200 calculations. Output is a **20×10 matrix:**

```
            tomato  lettuce  spinach  herbs  carrots  ...
Farm 1  [   100,     60,      45,     80,     30    ]
Farm 2  [    20,     90,      85,     40,     70    ]
Farm 3  [    55,     30,      25,     95,     40    ]
...
```

This matrix is the input to everything else. No transformation beyond arithmetic. No learning. Pure math.

---

### Step 2: Spatial Routing

**What it does:** Figures out which farms can physically reach which hubs.

For each farm-hub pair, compute Haversine distance (straight-line distance on a sphere — correct for GPS coordinates):

```
haversine(lat1, lon1, lat2, lon2):
  R = 6371000  ← earth radius in meters
  φ1, φ2 = lat1 and lat2 in radians
  Δφ = (lat2 - lat1) in radians
  Δλ = (lon2 - lon1) in radians

  a = sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
  c = 2 * atan2(√a, √(1−a))
  return R * c   ← distance in meters
```

Build the **reachability matrix:**
```
reachable[i][h] = (haversine(farm_i, hub_h) ≤ max_travel_distance)
```

Result: a binary N×H matrix. Farm 3 can reach Hub 1 and Hub 2 but not Hub 3.

This matrix becomes a constraint in the optimizer — it restricts which farm-crop assignments actually count toward which hub's coverage.

---

### Step 3: Temporal Scheduler

**What it does:** Decides which farms are available for reassignment right now.

Each farm has a state:
```
farm.cycle_end_date = farm.cycle_start_date + crop.grow_weeks * 7  (days)
farm.status = 'growing'   if today < cycle_end_date
farm.status = 'available' if today >= cycle_end_date
```

At any point in time, partition all farms:
```
locked_farms    = [f for f in farms if f.status == 'growing']
available_farms = [f for f in farms if f.status == 'available' or f.status == 'new']
```

**Compute what locked farms will produce** (fixed — cannot be changed):
```
locked_supply[crop] = Σ over locked farms:
  yield_matrix[farm][crop] * (farm is assigned this crop ? 1 : 0)
```

**Compute the gap** — what the network still needs:
```
gap[crop] = network_target[crop] - locked_supply[crop]
```

A negative gap means surplus already covered by locked farms. A positive gap means available farms need to fill it.

This gap vector is the input to the optimizer.

---

### Step 4: The Optimizer (Integer Linear Programming)

**Decision variables:**
```
x[i][c] ∈ {0, 1}

x[i][c] = 1  means farm i is assigned to grow crop c
x[i][c] = 0  means farm i is NOT growing crop c
```

This is a binary matrix — N rows (farms), M columns (crops), exactly one 1 per row.

**Objective function — what we're maximizing:**
```
Maximize:  Σᵢ Σ_c  x[i][c] * yield_matrix[i][c]
```

Sum up the expected yield across all assignments. The optimizer adjusts the x values to make this sum as large as possible.

**Constraints — rules the optimizer must respect:**
```
// Rule 1: Each farm grows exactly one crop
For each farm i:
  Σ_c x[i][c] = 1

// Rule 2: Network crop targets must be met
For each crop c:
  Σᵢ x[i][c] * yield_matrix[i][c] ≥ gap[c]

// Rule 3: Each hub region needs local coverage of each crop
For each hub h, for each crop c:
  Σᵢ where reachable[i][h]=1:
    x[i][c] * yield_matrix[i][c] ≥ local_demand[h][c]

// Rule 4: Inertia — penalize changing from last cycle's assignment
Objective -= γ * Σᵢ (1 - x[i][prev_crop[i]])
```

**How the solver works (Branch and Bound):**

The solver can't try all possible combinations — at 20 farms × 10 crops, that's 10^20 possibilities. Instead:

1. **Relax** the integer constraint — allow x[i][c] to be any number between 0 and 1. This is now a standard LP, solvable in polynomial time with the Simplex algorithm.
2. **Solve the relaxation** — get fractional values like x[3][tomato] = 0.7.
3. **Branch** — pick a fractional variable, create two sub-problems: one where it's forced to 0, one where it's forced to 1.
4. **Bound** — use the LP relaxation value as an upper bound. Prune branches that can't beat the best integer solution found so far.
5. **Repeat** until all branches are resolved. The best integer solution found is provably optimal.

At 20 farms × 10 crops = 200 binary variables, this runs in milliseconds.

**Output:** Every available farm mapped to exactly one crop, guaranteed to satisfy all constraints, guaranteed to maximize total network yield.

**Comparative advantage emerges automatically.** You never hard-code it. When the optimizer solves, it naturally routes each farm to the crop where it creates the most value relative to what the network needs. It's a consequence of the objective function, not a separate rule.

---

### Step 5: Greedy Mid-Cycle Insertion

When a new node joins mid-cycle, running the full ILP is unnecessary. Use greedy:

```
For the new farm n:

  current_supply[c] = Σ all locked+assigned farms: yield[farm][c] if assigned c
  gap[c] = target[c] - current_supply[c]

  // Hub urgency: how badly does the nearest reachable hub need each crop?
  hub_urgency[c] = Σ reachable hubs h: max(0, local_demand[h][c] - hub_supply[h][c])

  // Score each crop for this new farm
  For each crop c:
    score[c] = yield_matrix[n][c] * gap[c] * (1 + hub_urgency[c])

  Assign n → crop with highest score[c]
```

This is O(M) — scales to any number of new nodes instantly. Not globally optimal, but correct for single-node gap-filling mid-cycle.

---

## How It All Connects

```
RAW INPUTS
  farm conditions (pH, temp, moisture, sqft, tools, budget)
  crop definitions (requirements, yield constants, grow times)
  network config (food targets, hub locations, max distance)
          │
          ▼
SUITABILITY SCORER
  Hard gate filter → eligible crops per farm
  Weighted range scoring → suitability[i][c] ∈ [0,1]
  Yield formula → yield_matrix[i][c] in kg
          │
          ▼
SPATIAL ROUTER
  Haversine distance → reachability_matrix[i][h] ∈ {0,1}
          │
          ▼
TEMPORAL SCHEDULER
  locked vs available classification
  locked_supply[c] computed
  gap[c] = target[c] - locked_supply[c]
          │
          ▼
OPTIMIZER
  Full cycle → ILP (Branch & Bound on LP relaxation)
  Mid-cycle  → Greedy O(M) insertion
          │
          ▼
OUTPUT
  assignment[farm] = crop
  instruction bundle per farm
  network coverage report
```

---

## What Kind of Math Is This?

| Component | Math Type | Why |
|---|---|---|
| Suitability scoring | Arithmetic + piecewise functions | Simple, fast, deterministic |
| Range scoring | Linear interpolation | Smooth penalty curves |
| Distance calculation | Trigonometry (Haversine) | GPS coordinates on a sphere |
| Reachability graph | Set theory / graph theory | Discrete yes/no connections |
| Optimizer | Integer Linear Programming | Constrained combinatorial optimization |
| LP relaxation | Linear algebra (Simplex algorithm) | Finds continuous optimum fast |
| Branch and Bound | Tree search + pruning | Finds integer optimum efficiently |
| Greedy insertion | Scoring + argmax | Fast single-node assignment |

No matrix multiplication beyond arithmetic. No backpropagation. No gradient descent. No activation functions. No layers. This is not a neural network at any point.

---

## Why Not Optimize Differently?

**Gradient descent** (how neural networks learn) requires a smooth, differentiable function. Our objective has hard integer constraints — you can't take a derivative of "must assign exactly one crop per farm." Wrong tool.

**Simulated annealing / genetic algorithms** — both are stochastic search methods. They find *good* solutions but not *provably optimal* ones, and they're slower than Branch and Bound at this scale.

**ILP with Branch and Bound** is the standard industry approach for exactly this class of problem — combinatorial assignment under linear constraints. It's what airlines use for crew scheduling, logistics companies use for routing. It is the right tool.

---

## What ML Adds — Later

ML is not the optimizer. It improves the optimizer's inputs over time:

| Component | ML Role | When |
|---|---|---|
| Yield estimator | Supervised learning on real harvest data replaces the base yield formula | After 2–3 cycles of real data |
| Demand forecasting | Time-series model on hub consumption patterns | After hubs are live |
| Suitability tuning | Adjust crop requirement thresholds based on observed local outcomes | After sufficient yield history |

ML improves the estimates. ILP does the deciding.
