# MyCelium — MVP Overview

**Goal:** A pitch-ready demo that makes judges *feel* the network working. Not a full product — a believable, visual proof of the core idea.

---

## What We're Building

Three components, wired together:

### 1. Data Input (Frontend + OCR)
A simple interface where a "farmer" submits their farm data. Input can be:
- Manual form entry (plot size, crop, soil readings)
- Photo capture → OCR extracts values from an image of a sensor reading or handwritten note

Data lands in **Supabase** (Postgres + realtime subscriptions).

### 2. Business Logic (Optimization Server)
A backend service that runs when new data arrives. It reads all nodes from Supabase, runs the optimization algorithm, and writes instruction bundles back per node.

This is the core IP — the thing that makes the network smart. It handles:
- Comparative advantage assignment (who grows what)
- Supply gap detection (what the network is missing)
- Per-node instruction generation (what to do this cycle)

### 3. Admin Panel (Visualization)
The pitch artifact. A live dashboard judges interact with that shows:
- The nodal network
- The optimization happening in real time
- Each node's state and assignment

Uses Supabase realtime so the visualization updates live as data changes — no refresh needed.

---

## The Hard Problem: Visualizing Optimization

Showing that "the network is optimizing" is not obvious. Here are the key visualization decisions to make:

**Option A — Before/After**
Show the network in an unoptimized state (everyone growing the same thing, supply gaps visible), then trigger optimization and animate the reassignment. Judges see the delta.

**Option B — Live Node Join**
A judge "joins" as a new node mid-demo. The network visibly rebalances — existing nodes shift their assignments, the new node gets a crop that fills a gap. The network reacts.

**Option C — Supply/Demand Overlay**
Nodes are colored by what they're growing. A separate layer shows demand coverage — what the network is producing vs what it needs. Optimization visibly fills the gaps.

**Recommendation: combine B + C.** The most compelling demo moment is a new node joining and the whole network responding. Color-coded crop assignments make the comparative advantage legible at a glance.

---

## Nodal Visualization — What Judges See

Built on the existing `nodalnetwork.html` canvas foundation, extended to be data-driven.

| Visual Element | Represents |
|---------------|-----------|
| Node (dot) | A farm |
| Node color | Crop assigned (e.g. green = leafy greens, orange = root veg) |
| Node size | Plot size / output capacity |
| Edge | Relationship / food flow between nodes and hubs |
| Pulsing node | Node that just submitted data or received new instructions |
| Hub (larger node) | Distribution point |
| Highlighted node | Currently selected — shows sidebar with farm details |

On the side: a panel showing network-level stats — total nodes, crops covered, supply gaps remaining, last optimization run.

---

## Stack

| Layer | Tech |
|-------|------|
| Database | Supabase (Postgres + Realtime) |
| Backend / Business Logic | TBD (Node.js / Python service) |
| OCR / Vision | TBD (Tesseract.js / Google Vision API) |
| Admin Panel + Visualization | TBD (React or vanilla JS + Canvas) |
| Hosting | TBD |

---

## What We're Not Building for MVP

- Real sensor hardware
- Actual Hub Currency transactions
- Mobile app
- Multi-region / large-scale infrastructure
- Full abuse prevention

All node data can be seeded or manually entered. The demo needs to *show* the idea, not run in production.

---

## Open Questions

- [ ] What does the optimization algorithm actually compute? (See `04-open-questions.md`)
- [ ] How many seeded nodes do we need for the visualization to look compelling? (Probably 15–30)
- [ ] Do we show a map (geographic) or abstract nodal layout?
- [ ] Is the OCR input live in the demo or pre-loaded?
