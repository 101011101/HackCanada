# MyCelium — Judging Criteria Mapping

Comprehensive mapping of every project aspect to **Technical Execution**, **Design and User Experience**, and **Innovation and Creativity**. (Presentation and Communication omitted per request.)

---

## 1. Technical Execution (40%)

### 1.1 Functionality and Completeness

| Feature / Component | What Exists (Docs / Planned) | How It Satisfies "Functionality and Completeness" |
|---------------------|------------------------------|---------------------------------------------------|
| **End-to-end data loop** | Data Input → Supabase → Optimization Server → Instruction bundles per node (MVP 00) | Complete pipeline from farmer input to actionable output; not just UI—real business logic. |
| **Data input paths** | Manual form (plot size, crop, soil); Photo → OCR for sensor/handwritten readings (MVP 00, PRD 03) | Multiple input modalities so the system works with or without hardware/sensors. |
| **Optimization engine** | Four-stage pipeline: Suitability → Spatial Routing → Temporal Scheduler → Optimizer (01, 03) | Fully specified: hard gates, range scoring, yield matrix, reachability, locked/available, LP + greedy. |
| **Suitability scoring** | Deterministic formula: pH, moisture, temp, size, tools, budget; range_score + weighted sum; yield = base_yield × suitability × sqft (01, 03) | No black box—every score is computable and testable; produces N×M yield matrix. |
| **Spatial routing** | Haversine distance; bipartite farm–hub reachability; max_travel_distance; hub coverage as constraint (01, 03, 04) | Real geography: which farms can serve which hubs; feeds into optimizer constraints. |
| **Temporal scheduler** | Node states: growing / available / new; rolling horizon; cycle_end events; locked_supply and gap vector (01, 03) | Handles real-world constraint that farms can’t change crops mid-season; continuous re-optimization. |
| **LP optimizer** | Integer Linear Programming: binary x[i][c], maximize Σ yield; constraints: one crop per farm, network targets, hub coverage, locked nodes (01, 03) | Provably optimal assignment; comparative advantage emerges from math, not ad-hoc rules. |
| **Greedy mid-cycle insertion** | New node join: O(M) scoring with gap + hub_urgency; assign to argmax(score) (01, 03) | Fast path when full re-solve isn’t needed; correct for single-node joins. |
| **Admin / visualization** | Live nodal network dashboard; Supabase realtime; nodes, edges, hubs; color by crop, size by capacity; pulsing/highlight (MVP 00) | Demo artifact is functional—live updates, no refresh; judges see optimization in real time. |
| **AR plot scan** | WebXR AR measure (points on ground + scale) or photo+outline+scale → plot_size_sqft; form → POST /suggestions → ranked crops (AR-plot-scan-README) | Complete flow: measure plot → get crop suggestions using same suitability engine; fallbacks (photo, manual). |
| **Suggestions API** | POST /suggestions: virtual farm → scorer → top N crops with suitability (and optional yield); stateless (AR-plot-scan-README, 05) | Reuses core suitability logic; no new algorithm—consistent with network logic. |
| **Instruction packager** | Converts assignment → per-node task bundle (01, 05); versioned, actionable tasks (PRD 03) | Optimization output becomes something farmers can execute. |
| **Data model** | FarmNode, Crop, HubNode, NetworkConfig; derived: suitability_matrix, yield_matrix, reachability_matrix, assignment, supply, gap (04) | Every structure defined—types, shapes, relationships; no ambiguity for implementation. |
| **Digital twin** | Server-side model: soil, plot, tools, yield history, cycle state per node; network-level supply/gaps (PRD 03) | Single source of truth for optimizer inputs; keeps model current. |

### 1.2 Choice of Tools, Frameworks, and Architecture

| Decision | Choice | Justification (Technical Rigor) |
|----------|--------|---------------------------------|
| **Optimization method** | Linear Programming (ILP) with Branch and Bound on LP relaxation | Correct for combinatorial assignment under linear constraints; no training data; explainable; industry standard (crew scheduling, logistics). |
| **Why not neural networks** | Explicitly rejected for optimizer (01, 02, 03) | NN can’t guarantee constraint satisfaction; no historical data; LP guarantees feasibility and optimality. |
| **Database** | Supabase (Postgres + Realtime) (MVP 00, 05) | Single source of truth; realtime subscriptions for live admin viz without polling. |
| **Backend** | FastAPI (Python) (05); optimizer as pure Python engine | Stateless optimizer; same inputs → same outputs; testable in isolation; API orchestrates DB + optimizer. |
| **Frontend** | React (TypeScript) (05); Admin + Farmer + Community UIs | Clear separation: UI only; no optimization logic in client. |
| **Visualization base** | Canvas-based nodal network (nodalnetwork.html) extended to be data-driven (MVP 00, PRD 03) | Reuse of existing foundation; data-driven so it reflects real optimization state. |
| **OCR / Vision** | Tesseract.js or Google Vision API for photo → numeric extraction (MVP 00) | Handles non-digital inputs (sensor photos, handwritten notes); appropriate for MVP. |
| **AR / plot measure** | WebXR for AR; Canvas 2D for photo+outline; feature-detect and fallback (AR-plot-scan-README) | One code path for AR, one for photo, one for manual—scalable beyond demo device. |
| **Spatial math** | Haversine for GPS distance (03) | Correct for lat/lng on sphere; standard for geographic reachability. |
| **Scheduler** | Cron / Celery for epoch; event-driven for cycle_end and new node (01, 05) | Fits “rolling horizon” and “full network re-optimization” semantics. |

### 1.3 Scalability Beyond a Demo Laptop

| Aspect | How the Design Scales | Evidence in Docs |
|--------|------------------------|------------------|
| **Optimizer complexity** | LP with N farms × M crops: 20×10 = 200 binary variables → milliseconds (03); Branch and Bound prunes search space | Explicitly stated; no exponential blow-up at demo scale. |
| **Greedy insertion** | O(M) per new node (01, 03) | Constant in N; suitable for many nodes joining over time. |
| **Stateless optimizer** | Engine has no DB; receives full state, returns assignments (05) | Can be moved to a separate worker or server; horizontal scaling of API vs compute. |
| **Realtime subscriptions** | Supabase Realtime for admin dashboard (MVP 00) | Avoids polling; scales to many concurrent viewers. |
| **Suggestions endpoint** | Stateless; rate-limit if needed (AR-plot-scan-README) | No session state; can sit behind CDN/load balancer. |
| **Data model** | Matrices and schemas defined for arbitrary N, M, H (04) | Same formulas and structures whether 20 or 2000 nodes. |
| **Rolling horizon** | Only available nodes are re-optimized; locked nodes fixed (01) | Work scales with “free” nodes, not total nodes, each cycle. |
| **Hub placement** | k-medoids on farm locations for K hubs mentioned as future (01) | Facility location heuristic for when hub count grows. |
| **ML later** | Yield estimator, demand forecasting, suitability tuning designed as post-MVP (01, 03) | Clear extension path without changing optimizer contract. |

---

## 2. Design and User Experience (20%)

### 2.1 Clear User Flow from Start to Finish

| Flow | Steps (Start → Finish) | Source |
|------|------------------------|--------|
| **Farmer onboarding** | Open app → Enter variables (plot, location, tools, budget) → Optionally scan plot (AR/photo) → Submit → Receive first Instruction Bundle → Begin growing (PRD 02, MVP 00) | Single path from “new user” to “acting on instructions.” |
| **Ongoing cycle** | Record conditions (manual/OCR) → Sync → Model updates → Re-optimization → Updated instructions → Harvest → Deliver to hub → Currency credited (PRD 02, 05) | Repeating loop with clear cause-effect. |
| **Get crop suggestions (pre-join)** | “Scan my plot” or “Get suggestions” → Choose AR / photo / manual → Get plot_size_sqft → Fill form (plot type, tools, budget, soil) → Submit → View ranked crops → Optional “Join network” (AR-plot-scan-README) | Linear: measure → form → results → optional join. |
| **Admin / judge demo** | View live nodal map → See nodes (color = crop, size = capacity) → Optional: “Join as new node” → Network rebalances visibly → Select node → Sidebar with farm details (MVP 00) | Designed for “start to finish” in a demo: see network → see reaction to change. |
| **Community member** | “Find Food” → See nearest hubs + inventory → Spend currency → Pickup code → Collect at hub → Confirmation (PRD 02) | Clear path from hunger to food. |

### 2.2 Logical Layout and Navigation

| Element | Design Choice | UX Rationale |
|---------|----------------|--------------|
| **Nodal visualization** | Nodes = farms; edges = flow to hubs; hubs = larger nodes; color = crop; size = capacity (MVP 00) | One glance: who grows what and how they connect. |
| **Side panel** | Selected node → sidebar with farm details (MVP 00) | Detail on demand; main view stays overview. |
| **Network-level stats** | Total nodes, crops covered, supply gaps, last optimization run (MVP 00) | High-level health visible without drilling down. |
| **Pulsing node** | Indicates “just submitted data” or “received new instructions” (MVP 00) | Draws attention to what changed. |
| **Before/after + live join** | Option A/B/C combined: before/after plus “judge joins as node” plus supply/demand overlay (MVP 00) | Demo narrative: unoptimized → optimized, or join → rebalance. |
| **Farmer UI** | Onboarding → Data input → Instruction display → Wallet (05, PRD 03) | One app; sequential entry points (onboard once, then cycle). |
| **Suggestions flow** | Single entry (“Scan my plot” / “Get suggestions”); then method choice (AR / photo / manual); then form; then results (AR-plot-scan-README) | No dead ends; fallbacks at each step. |

### 2.3 Consistency in Interaction Patterns

| Pattern | Where It Appears | Consistency |
|---------|------------------|-------------|
| **Submit → loading → result** | Data input (soil/plot), Suggestions (form → ranked list), Onboarding (submit → instructions) | Same mental model: user acts, system computes, result appears. |
| **Progressive disclosure** | Map shows summary; click node → sidebar details; “Join network” from suggestions → full onboarding | Detail only when needed; primary surfaces stay simple. |
| **Fallbacks** | No AR → photo+outline; no photo → manual area; no auth for suggestions (AR-plot-scan-README) | Every path has a fallback so users aren’t blocked. |
| **Instructions as primary artifact** | Farmer always receives a bundle (what to grow, how, when) (PRD 00, 02) | Same “output” type regardless of path (new join vs cycle update). |
| **Realtime updates** | Admin dashboard via Supabase Realtime (MVP 00) | No “refresh” habit; interface stays in sync with backend. |

---

## 3. Innovation and Creativity (25%)

### 3.1 Originality of the Idea

| Idea | What’s Original | Ref |
|------|-----------------|-----|
| **Network as coordinator** | Urban farmers as nodes in a single optimization problem; “the network does the thinking” rather than each farmer deciding alone (PRD 00, 01, 02) | Core product thesis. |
| **Comparative advantage at plot level** | Applying trade/comparative-advantage thinking to micro-plots (balcony, rooftop, backyard); usually applied to nations or firms (02, 03) | Reframing scale. |
| **Mycelium metaphor** | Explicit analogy: “coordinates urban farmers like mycelium coordinates a forest—each node contributes what it does best” (PRD 00) | Memorable framing and naming. |
| **Operational vs informational** | Not another “what could you grow” app—tells you what you *should* grow given network state (PRD 02) | Clear differentiation from guides/calculators/forums. |
| **Hub-backed currency** | Currency earned by delivery, spent at hubs; backed by real production; abuse-resistant (PRD 00, 02) | Ties value to physical output and local hubs. |
| **Digital twin for farms** | Server-side live model of every farm as input to optimization (PRD 03) | Brings “digital twin” idea to smallholder/urban context. |

### 3.2 Creative or Unexpected Use of Technology

| Technology | Use | Why It’s Creative / Unexpected |
|------------|-----|---------------------------------|
| **LP/ILP for crop assignment** | Using operations-research (LP) for community farming; comparative advantage as emergent from objective + constraints, not hand-coded (01, 02, 03) | LP is standard in logistics/airlines; applying it to urban gardens is non-obvious. |
| **WebXR for plot measurement** | AR in browser to measure plot area for crop suggestions; no native app (AR-plot-scan-README) | Low-friction, device-agnostic way to get plot size. |
| **Photo + polygon + scale** | Single known length on a photo → full area in sq ft for plots (AR-plot-scan-README) | Simple geometry in the browser; no special hardware. |
| **Realtime subscriptions for “live optimization”** | Admin view updates as data/assignments change so judges see the network react (MVP 00) | Demo feels alive; optimization becomes visible. |
| **OCR for soil/sensor readings** | Photo of meter or handwritten note → numeric values into digital twin (MVP 00, PRD 03) | Bridges non-digital tools with digital optimization. |
| **Same suitability engine for suggestions and network** | Pre-join “what should I grow?” uses identical suitability formula as the full optimizer (AR-plot-scan-README, 01) | One math, two experiences (explore vs commit). |
| **Rolling horizon + mid-cycle greedy** | Mix of full ILP at epoch and O(M) greedy on new-node join (01, 03) | Matches real-world timing (can’t re-solve entire network on every join). |
| **Bipartite reachability as constraint** | Farm–hub graph as hard constraint in LP (01, 03) | Geography directly encoded in the math. |

### 3.3 Clever Problem Framing or Reframing

| Reframing | From → To | Impact |
|-----------|-----------|--------|
| **“What should I grow?”** | Individual question → **Network question**: what should this node grow so the *network* is complete and efficient? (01, 02) | Shifts from personal preference to system optimum. |
| **Barrier to entry** | “Lack of land or interest” → **Coordination and knowledge** (PRD 01) | Problem becomes solvable with software and data. |
| **Optimization** | “AI/ML” → **Exact math**: LP with constraints and objective (01, 02, 03) | Explainable, no training data, provable. |
| **New node join** | “Disruption” → **Gap-filling**: greedy assignment to maximize fill for current gaps and hub urgency (01, 03) | New nodes improve the network instead of destabilizing it. |
| **Stability** | “Re-optimize everything every time” → **Inertia term + epoch-based communication** (02, 03) | Farmers get stable instructions; system still re-optimizes internally. |
| **Supply gaps** | “We need more lettuce” (vague) → **Gap vector**: target[c] − locked_supply[c] per crop (01, 03) | Precise, computable, and directly drives the optimizer. |
| **Plot size** | “Guess or tape measure” → **AR or photo + scale** (AR-plot-scan-README) | Low-friction, accurate enough for suitability. |
| **Suggestions vs assignment** | “Join or nothing” → **Preview (suggestions)** then **Commit (join network)** (AR-plot-scan-README) | Reduces commitment anxiety; same engine behind both. |

---

## 4. Feature Checklist (All Features That Count for Creativity and Technical Rigor)

- [ ] **End-to-end pipeline**: Data in → DB → Optimizer → Instructions out  
- [ ] **Dual input**: Manual form + Photo/OCR for readings  
- [ ] **Suitability scoring**: Hard gates + weighted range_score → N×M yield matrix  
- [ ] **Spatial routing**: Haversine, reachability matrix, hub coverage constraints  
- [ ] **Temporal scheduler**: Locked vs available, rolling horizon, cycle_end events  
- [ ] **LP optimizer**: Binary assignment, one crop per farm, network + hub constraints  
- [ ] **Greedy mid-cycle**: New node → gap + hub_urgency → O(M) assignment  
- [ ] **Comparative advantage**: Emergent from LP objective, not hard-coded  
- [ ] **Live nodal visualization**: Nodes, edges, hubs, color/size, realtime, sidebar  
- [ ] **Demo modes**: Before/after, live node join, supply/demand overlay  
- [ ] **AR plot measure**: WebXR, points + scale → plot_size_sqft  
- [ ] **Photo fallback**: Upload/draw polygon + one edge length → area  
- [ ] **Suggestions API**: Virtual farm → scorer → ranked crops (same suitability)  
- [ ] **Instruction packager**: Assignment → per-node task bundle  
- [ ] **Data model**: FarmNode, Crop, HubNode, NetworkConfig + all derived matrices  
- [ ] **Digital twin**: Per-node and network-level state for optimizer  
- [ ] **Hub Currency**: Earn by delivery, spend at hub; backed by production  
- [ ] **Clear flows**: Onboarding, cycle, suggestions, admin demo, community food access  
- [ ] **Consistent patterns**: Submit → loading → result; fallbacks; realtime where needed  

---

*This document maps every documented feature and design decision in the MyCelium repo (MVP/, PRD/) to Technical Execution, Design/UX, and Innovation/Creativity. Use it to ensure nothing is missed in submissions or judge briefs.*
