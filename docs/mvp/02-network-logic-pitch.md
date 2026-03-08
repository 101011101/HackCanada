# Network Logic — Plain English

---

## The Core Problem

Imagine you're the coordinator of 100 community gardens across a city. Your job is to answer one question for every gardener: **"What should I grow?"**

You can't just tell everyone to grow tomatoes — then you'd have a thousand kilos of tomatoes and no lettuce, no carrots, no herbs. You need the whole network to produce a *complete, balanced food supply* — like a distributed farm that happens to be spread across a hundred backyards.

That's the optimization problem. And it's harder than it sounds because:
- Every garden is different (different soil, tools, space, climate)
- Farmers can't change crops mid-season
- New farmers join at random times
- Food needs to be physically reachable — you can't eat food from a farm 50km away

---

## The Four Pieces

### 1. How good is this farm at each crop? (Suitability Scoring)

Think of it like a job application. Each crop has minimum requirements — like a job posting says "must have 5 years experience." If a farm doesn't meet the minimums (too small, wrong pH, wrong tools), that crop is off the table entirely.

For farms that *do* meet the minimums, we score how *well* they match — like ranking job candidates. A farm with perfect soil pH, ideal temperature, and plenty of space scores higher than a farm that barely qualifies.

This produces a **score matrix** — every farm rated against every crop. That matrix is the input to the optimizer.

> *Technical: Hard gate + weighted suitability scoring → N×M yield matrix*

---

### 2. Who can reach which food hub? (Spatial Routing)

Hubs are physical pickup points — schools, community centers, churches. A farm can only deliver to hubs it can *actually reach* (within the configured max travel distance).

We draw a map of connections: farm A can reach hub 1 and hub 3, but not hub 7. Farm B can only reach hub 2.

This creates a **reachability graph** — a web of which farms feed which hubs. The optimizer must respect this: it's no good assigning a farm to grow lettuce if the only hub that needs lettuce is on the other side of the city.

> *Technical: Bipartite reachability graph with distance threshold*

---

### 3. Who's locked in, who's free? (Temporal Scheduler)

You can't tell a farmer to stop growing tomatoes in week 6 of a 12-week season. They're locked in until harvest.

So the system tracks two buckets at all times:
- **Locked nodes** — currently growing something, can't be changed
- **Free nodes** — just harvested (or brand new), waiting for their next assignment

The optimizer only touches free nodes. Locked nodes are treated as fixed — "we know 40kg of tomatoes is coming from those farms no matter what, so let's fill the gaps with the free ones."

As different crops finish at different times (lettuce = 3 weeks, tomatoes = 12 weeks), nodes naturally become free at staggered intervals. The system continuously re-optimizes as each one opens up.

> *Technical: Rolling horizon optimization with locked/available node classification*

---

### 4. What should each free farm grow? (The Optimizer)

This is the intellectual core. Given:
- What each free farm is good at (suitability scores)
- What the network is already producing (from locked farms)
- What the network still needs (the gaps)
- Which farms can reach which hubs

…assign each free farm to one crop such that the **total network output is maximized** while **every hub region has enough of every food type**.

The key insight is **comparative advantage** — a concept from economics. Imagine two farms:
- Farm A: great at tomatoes (9/10), decent at lettuce (7/10)
- Farm B: okay at tomatoes (6/10), okay at lettuce (6/10)

Farm A is better at *both*. But if the network desperately needs lettuce and already has plenty of tomatoes, Farm A should grow lettuce — because it's still better at lettuce than Farm B is, and Farm B can cover tomatoes adequately.

You never hard-code this logic. You just tell the optimizer "maximize total output, satisfy these coverage requirements" — and comparative advantage *emerges naturally* from the math.

> *Technical: Integer Linear Programming (ILP) — binary assignment, one crop per farm, globally optimal solution*

---

## New Farmer Joins Mid-Season

If someone joins mid-cycle, most of the network is locked. You can't re-run the full optimizer — it would disturb locked assignments.

Instead: fast greedy assignment. Look at what the network currently has, find the biggest gap, check what this new farm is good at, find the crop that best fills the gap *and* serves an underserved hub nearby. Assign that. Done in milliseconds.

> *Technical: Hub-aware greedy insertion — O(M) per new node*

---

## Preventing Chaos (Stability)

Without a stability mechanism, the optimizer could reassign every farm every cycle — constantly disrupting farmers. To prevent this, the system adds a small penalty for changing a farm's assignment from last cycle. Changes only happen when the benefit is worth the disruption.

Separately: even though the system re-optimizes continuously under the hood, farmers only *hear* about changes at fixed calendar windows (e.g., every 4 weeks). Internally rolling, externally predictable.

> *Technical: Assignment inertia term in objective function + epoch-based communication*

---

## What We're NOT Using (And Why)

**Neural networks** — people always ask. Neural networks learn patterns from historical data. We have no historical data. They also can't guarantee constraints are satisfied ("hub X must receive at least 5kg of leafy greens"). LP can. Wrong tool.

**Dijkstra's algorithm** — useful for routing through a road network with multiple hops. Our food routing is simpler: farm delivers directly to nearest reachable hub. No multi-hop needed at MVP.

**ML does have a role — later.** Once farms have a few cycles of real harvest data, a machine learning model can *predict* how much each farm will actually yield (vs. our formula-based estimate). That prediction feeds *into* the optimizer as a better input. ML improves the estimates. LP does the deciding.

---

## The Full Flow in One Sentence

> Every farm tells the network its conditions → the network scores every farm against every crop → figures out who's free vs locked → runs an optimizer that fills network gaps using each farm's comparative advantage → sends each farmer one instruction: *this is what you grow next cycle, here's why, here's how.*
