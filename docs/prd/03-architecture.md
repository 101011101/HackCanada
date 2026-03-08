# Architecture

## System Overview

```
┌──────────────────────────────────────────────────────┐
│                    FARM NODE (App)                    │
│  Data Input → Sync Module → Instruction Display       │
└──────────────────┬───────────────────────────────────┘
                   │ upload (telemetry + variables)
                   ▼
┌──────────────────────────────────────────────────────┐
│                   INGESTION LAYER                     │
│  API Gateway → Auth → Validation → Event Queue        │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│                  NETWORK MODEL                        │
│  Digital Twin per Node → Full Network State           │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│             OPTIMIZATION ENGINE                       │
│  Comparative Advantage → Crop Assignment → Actions    │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│            INSTRUCTION PACKAGER                       │
│  Per-node task list → formatted bundle → delivery     │
└──────────────────┬───────────────────────────────────┘
                   │ push to node
                   ▼
┌──────────────────────────────────────────────────────┐
│                    FARM NODE (App)                    │
│  Receives instructions → farmer executes              │
└──────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Farm Node (App)

The farmer's interface. Handles:
- **Onboarding:** collect plot variables, tools, budget, location
- **Data input:** manual entry, photo/OCR capture of readings, optional sensor kit
- **Sync module:** batches data, uploads when connectivity available, retries on failure
- **Instruction display:** renders the current cycle's task list (text, optionally AR overlays)
- **Wallet:** Hub Currency balance, transaction history
- **Marketplace:** browse hub inventory, request food, manage pickups

The app is the only thing a farmer directly interacts with. Everything else is invisible to them.

---

### 2. Data Ingestion Layer

Receives data from nodes and prepares it for processing.

- **API Gateway:** single entry point, handles auth (device/user tokens), rate limiting, schema validation
- **Event queue:** accepted data is pushed to a queue so downstream services process asynchronously — ingestion never blocks on optimization
- **OCR / Vision pipeline:** if data arrives as an image (photo of a soil meter, handwritten reading), extract numeric values before storing

---

### 3. Network Model (Digital Twin)

The server's representation of the current state of every node and the full network.

Per node, tracks:
- Soil conditions (moisture, pH, temperature, humidity) — current and historical
- Plot layout and zone map
- What is currently planted, at what stage
- Tools and resource constraints
- Yield history

At the network level, aggregates:
- What is being grown across all nodes by region
- Hub inventory levels
- Demand signals (food requests, community size)
- Supply gaps (what the network is missing)

This is the input to the optimization engine. It must be kept current — stale data produces bad instructions.

---

### 4. Optimization Engine

The intellectual core of MyCelium. Runs once per farm cycle (or when triggered by a significant change).

**What it solves:** assign crop production across all nodes such that the network's collective output is maximized, waste is minimized, and each node is assigned what it is comparatively best at.

**Inputs:**
- Full network state (from digital twin)
- Each node's constraints (tools, budget, space, time)
- Current supply and demand across hubs
- Historical yield performance per node per crop
- Seasonal and environmental context

**Outputs:**
- Per-node crop assignment for the next cycle
- Growing instructions (quantities, timing, methods)
- Resource sharing recommendations between nearby nodes
- Risk flags (frost, disease, overwatering risk, etc.)

**Algorithm (TBD — see open questions):** likely a constrained optimization or graph-based assignment problem. Could start with a weighted scoring system and evolve toward ML as data accumulates.

---

### 5. Instruction Packager

Converts optimization outputs into something a farmer can actually follow.

- Translates "plant 2kg of spinach in zone B, irrigate every 3 days" into clear, step-by-step tasks
- Attaches tool requirements, time estimates, and cost estimates
- Versions instructions per node per cycle ("Cycle 5, Node 42, v1")
- Packages for delivery: full AR overlay (capable device) or plain text (low bandwidth / basic device)
- Signs the bundle so the app can verify it hasn't been tampered with

---

### 6. Hub & Marketplace

Physical distribution points with a software backend.

- **Hub inventory service:** tracks what food is available at each hub, updated on delivery confirmation
- **Order service:** handles food requests — finds nearest hub with stock, reserves inventory, issues pickup code
- **Settlement:** dual confirmation (farmer delivers → hub logs it; community member picks up → hub logs it) triggers currency transfer
- **Routing:** directs users to the right hub based on location and inventory

---

### 7. Currency / Ledger

Simple, auditable ledger to start.

- Each confirmed delivery credits the delivering node
- Each confirmed pickup debits the recipient
- Balances are per-user, stored server-side
- No blockchain required at MVP — a conventional database is sufficient, with optional chain-anchoring later for transparency

---

### 8. Visualization Layer

The network made visible. Primarily for pitch and admin purposes at MVP stage.

- Nodal network diagram: each farm is a node, edges represent data flow and food exchange relationships
- Node state reflected visually: active / idle / producing / at risk
- Hub locations overlaid
- Supply/demand heatmap by region
- Real-time update as new data arrives

This is built on the existing `nodalnetwork.html` canvas-based foundation.

---

## Data Flow Summary

```
Farmer inputs data
    → OCR / manual entry
    → Sync module batches + uploads
    → API Gateway validates + queues
    → Digital Twin updated
    → Optimization Engine runs
    → Instructions generated + packaged
    → App receives + displays instructions
    → Farmer executes
    → Produces food → delivers to hub
    → Hub confirms → currency credited
    → Community member requests food
    → Hub serves → currency debited
    → Inventory updated → Digital Twin updated
    → Cycle repeats
```

---

## Storage

| Data Type | Store |
|-----------|-------|
| Sensor readings / telemetry | Time-series DB (InfluxDB / TimescaleDB) |
| Users, farms, cycles, instructions | Relational DB (PostgreSQL) |
| Hub inventory, orders, currency | Relational DB (PostgreSQL) |
| AR scans, images | Object storage (S3 / GCS) |
| Analytics / projections | Data warehouse (separate ETL) |
