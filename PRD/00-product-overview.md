# MyCelium — Product Overview

**MyCelium coordinates urban farmers like mycelium coordinates a forest — each node contributing what it does best, the whole network thriving because of it.**

---

## The Problem

Urban farming is underutilized — not because of lack of land or interest, but because of coordination and knowledge. New farmers don't know what to grow. Everyone grows the same things. Surplus goes to waste. There is no system connecting individual growers into something greater than the sum of its parts.

## The Solution

MyCelium connects urban farmers into a shared network. Each farmer is a **node**. Nodes contribute their local data — plot conditions, tools, yield — and receive back precise growing instructions optimized not just for their plot, but for what the whole network needs. The system applies comparative advantage: each node grows what it is best suited for, filling gaps rather than duplicating effort. Together, the nodes function as a distributed, complete food system.

## How It Works

1. A farmer joins, enters their variables (plot size, tools, conditions, budget)
2. Their data enters the network; the system updates its model
3. The optimization engine assigns crops across all nodes based on comparative advantage
4. Each farmer receives an instruction bundle — what to grow, how, and when
5. Farmers harvest and deliver food to local **hubs**
6. Community members access that food using **Hub Currency**, earned by producing and contributing
7. The cycle repeats; the network improves as more nodes join

## Key Components

**Farm Node (App)** — the farmer's interface for data input, instruction delivery, and the currency wallet.

**Optimization Engine** — the core of the platform. Takes the full network state and assigns crop production across nodes to maximize collective output and minimize waste.

**Digital Twin** — the server's live model of every farm. Tracks soil state, crop stage, yield history, and constraints per node. Input to the optimizer.

**Instruction Bundle** — the packaged output per node per cycle: concrete tasks, timing, tools required, expected cost.

**Hub** — physical distribution points where farmers drop food and community members collect it.

**Hub Currency** — earned by delivering food, spent to receive food. Backed by real production, not freely mintable. Keeps the food economy fair and abuse-resistant.

**Nodal Visualization** — a live network map showing all nodes, their states, data flow, and hub locations. The primary pitch artifact.

## Why It Works

The network effect is real: every node that joins improves the optimizer's model, diversifies supply, and makes the food economy more complete. A single urban farmer growing tomatoes on a balcony is just a hobby. A thousand coordinated urban farmers growing complementary crops is a food system.

## What Needs to Be Built

| Component | Status |
|-----------|--------|
| Nodal network visualization | Foundation exists (`nodalnetwork.html`) |
| Data input → server → instruction loop | To be built |
| Optimization algorithm | To be designed |
| Farm kit / data capture (OCR) | To be scoped |
| Hub & currency system | To be designed |
