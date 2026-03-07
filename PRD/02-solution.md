# The Solution

## Core Idea

MyCelium is a networked urban farming platform. Each farmer is a **node**. Nodes contribute their local data — plot conditions, what they're growing, what they've produced — into a shared system. The system processes the full network and returns each node a precise set of instructions: what to grow, how much, when, and how.

No individual farmer needs to understand the whole system. They just follow their instructions. The intelligence is in the network.

Because the system knows what every node is growing, it can route production through **comparative advantage** — each farmer grows what their plot does best, filling gaps in the network rather than duplicating what everyone else is already growing. Together, the nodes function as a complete, low-cost, sustainable food supply.

A built-in **currency system** handles exchange. Farmers earn currency by delivering food to community hubs. Anyone in the community can spend currency at hubs to access that food. This prevents abuse, keeps prices low, and creates a direct feedback loop between production and consumption.

---

## How It Works — End to End

```
Node joins → inputs variables → data enters the network
    → system updates its model of the full network
    → optimization runs: assigns comparative-advantage crops to each node
    → each node receives instructions (what to grow, how, when)
    → node grows, harvests, delivers to hub
    → earns currency
    → community members spend currency at hub
    → cycle repeats, network improves
```

---

## User Flows

### Flow 1: Joining the Network (Onboarding)

1. Farmer downloads the app and creates an account
2. Farmer enters their variables:
   - Plot size and type (balcony, rooftop, backyard, community lot)
   - Location
   - Available tools and resources
   - Budget
   - Time availability
3. Farmer optionally scans their plot (AR/camera mapping) to capture layout
4. Data is submitted to the network
5. System runs optimization including the new node
6. Farmer receives their first **Instruction Bundle**: exactly what to plant, where, and how
7. Farmer begins growing

### Flow 2: Ongoing Farm Cycle

Each cycle (weekly or per crop stage):

1. Farmer records current conditions (sensor kit or manual input / photo OCR)
2. Data syncs to server
3. System updates its model and re-runs optimization
4. Farmer receives updated instructions for the next cycle
5. Farmer harvests and delivers surplus to nearest hub
6. Delivery is confirmed → currency credited to farmer's account

### Flow 3: Food Access

1. Community member opens app → "Find Food"
2. App shows nearest hubs with current inventory
3. Member spends currency → receives pickup code
4. Member collects food at hub
5. Hub confirms pickup → transaction settled, inventory updated

### Flow 4: Network Effect in Action

As more nodes join:
- The optimization model has more variables to work with
- Production becomes more diverse and complete
- Hub inventory depth increases
- Prices effectively drop as supply grows
- Instructions become more accurate as historical yield data accumulates

---

## The Currency System

**Purpose:** prevent abuse, enable fair exchange, reward contribution.

**Earning:** farmers earn currency when food is confirmed delivered to a hub. No delivery, no currency.

**Spending:** currency is spent at hubs to access food. Prices are set by the network (not individual sellers), keeping costs low.

**Design principle:** currency supply is backed by real food production. It cannot be minted freely. This ties the economy directly to physical output.

**Why not just use money:** a separate currency lets the network control pricing for food access (keeping it affordable), creates a closed-loop economy within the community, and allows for network-specific incentive design (bonuses, contribution rewards) without depending on fiat.

---

## What Makes This Different

Most urban farming tools are informational — guides, calculators, forums. MyCelium is **operational**: it doesn't tell you what you could grow, it tells you what you *should* grow, given what the whole network needs right now. The intelligence is collective and continuous, not static.

The closest analogy is a **mycelium network** in a forest — a distributed system where each node contributes and receives, and the whole system is more resilient and productive than any individual part.
