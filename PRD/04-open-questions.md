# Open Questions & Areas to Expand

These are the things that need to be defined before or during build. Grouped by priority.

---

## 1. The Optimization Algorithm

This is the most important unresolved question. The engine needs to:
- Assign crop production across N nodes to satisfy network demand
- Respect each node's constraints (space, tools, climate, budget)
- Route toward comparative advantage (each node does what it's best at)
- Rebalance as nodes join, leave, or underperform

**Candidate approaches (to evaluate):**
- **Weighted assignment / linear programming** — fast, explainable, works well at small scale. Start here.
- **Graph-based routing (Dijkstra-style)** — useful if the problem is framed as resource flow through a network.
- **Constraint satisfaction** — good for hard constraints (node can't grow X without greenhouse).
- **ML / reinforcement learning** — powerful but requires historical data. Layer on later, not at MVP.

**Key questions:**
- What is the objective function? (Maximize total yield? Minimize supply gaps? Minimize waste?)
- How do we handle nodes that don't follow instructions (yield gap vs prediction)?
- How does the algorithm handle a new node with no history?
- What's the update frequency — per cycle, real-time, or event-triggered?

---

## 2. Farm Kit Specification

What does a node actually use to input data?

**Options (from simple to complex):**

| Tier | Input Method | Notes |
|------|-------------|-------|
| Minimal | Manual entry in app | Lowest friction, lowest accuracy |
| Basic | Photo of soil meter / reading → OCR | Simple to build, good enough for MVP |
| Standard | Bluetooth sensor kit (moisture, pH, temp, humidity) | Better data, higher cost |
| Advanced | Full sensor array + AR plot mapping | Best data, significant hardware complexity |

**What needs to be decided:**
- What is the minimum viable input set to run optimization?
- Do we sell/supply the kit or let farmers self-source?
- What sensors are strictly necessary vs nice to have?
- Is AR mapping required at MVP or deferred?

---

## 3. Network Update Mechanics

How does the network model stay current and how does it handle change?

**Questions to answer:**
- How often does the digital twin update per node?
- What happens when a node goes offline for a cycle?
- How do new nodes get "onboarded" into the optimization without destabilizing existing assignments?
- How does the system handle a node permanently leaving the network?
- Is there a minimum node count before optimization produces meaningful output?

---

## 4. Hub Operations

Hubs are the physical settlement layer. Key open questions:

- Who operates a hub — community volunteer, paid operator, partner organization?
- What is the physical setup? (A fridge, a shelf, a storefront?)
- How is hub inventory tracked — honor system, QR scan, weight sensor?
- How does a new hub get added to the network?
- What happens if a hub has no inventory?

---

## 5. Currency Design

The currency system needs more precise definition:

- What is the exchange rate between currency and food? (Fixed, dynamic, market-based?)
- Can currency be transferred peer-to-peer or only node → hub → user?
- What prevents a farmer from gaming the delivery confirmation?
- Is there a currency floor (minimum spend) or ceiling (maximum earn per cycle)?
- What happens to unspent currency? Does it expire?

---

## 6. Abuse & Trust

- What is the minimum viable abuse prevention at MVP?
- How do we verify that a delivery actually happened? (Dual-scan, photo, weight, honor?)
- How do we prevent fake nodes (accounts with no real farm)?
- What's the escalation path for a dispute?

---

## 7. Launch Strategy

The network has zero value at zero nodes. How do we get to critical mass?

- What is the target geography for the pilot?
- What is the minimum number of nodes to produce a meaningful, diverse food supply?
- Do we pre-seed with a few committed farms before opening to the public?
- Is the first version fully manual (instructions delivered by a human coordinator) before automating?

---

## 8. MVP Scope Decision

For the pitch, what is the minimum that needs to be real vs simulated?

**Likely real:**
- Nodal network visualization (already exists as a foundation)
- Data input → server → transformation → instruction output (core loop)
- Business logic demonstrating comparative advantage assignment

**Likely simulated for pitch:**
- Sensor data (use dummy/seeded data)
- Multiple nodes (simulate 10-20 nodes with realistic data)
- Currency transactions (show the flow, not live settlement)
- Hub operations (illustrate the concept)

**The question:** what does the demo need to show to be convincing to an investor or partner?
