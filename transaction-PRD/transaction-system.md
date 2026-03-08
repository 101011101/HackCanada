# Transaction System — PRD

MyCelium's currency and food exchange layer. Defines how nodes give and receive food through hubs, how Hub Currency moves, and how all of it is stored.

---

## 1. Overview

Every node in MyCelium — farmer or community member — can grow food, hold food, and exchange food. Hubs are the physical intermediaries. They act as banks: nodes deposit food, nodes withdraw food, and the hub tracks inventory and confirms every transaction.

When a node deposits food at a hub, they earn Hub Currency. When a node withdraws food from a hub, they spend Hub Currency. The hub is always in the middle — there is no peer-to-peer exchange.

Requests are how nodes express intent. A node submits a give request ("I want to deposit X kg of crop Y at hub Z") or a receive request ("I want to withdraw X kg of crop Y from hub Z"). Requests are stored in a central master table. A cron job periodically scans open requests and settles them against hub inventory when conditions are met.

---

## 2. Data Model & Schemas

### 2.1 FarmNode — additions

Three new fields added to the existing `FarmNode` dataclass:

```python
@dataclass
class FarmNode:
    # ... all existing fields unchanged ...

    # Currency
    currency_balance: float = 0.0
    # Current Hub Currency balance. Increases on confirmed deposit.
    # Decreases on confirmed withdrawal.

    # Crop tracking
    crops_on_hand: dict = field(default_factory=dict)   # {crop_id: kg}
    # What the node currently holds — harvested and not yet deposited.
    # Farmer-facing only. Used for dashboard display.
    # Updated manually by farmer when logging a harvest.

    crops_lifetime: dict = field(default_factory=dict)  # {crop_id: kg}
    # Running total of all food ever produced by this node, per crop.
    # Incremented each time a harvest is logged.
    # Never decreases.
```

**`crops_on_hand`** — this is a self-reported, display-only field. It helps the farmer track what they have sitting at home before a deposit. It is not authoritative — hub inventory is the authoritative record of food in the system.

**`crops_lifetime`** — a denormalized running total. `yield_history` stores per-cycle arrays; `crops_lifetime` stores the sum across all cycles per crop. Kept as a direct field so dashboards and leaderboards can read it without summing arrays.

---

### 2.2 HubNode — unchanged

`HubNode` retains its existing fields. `local_demand` stays as the optimizer's input (how much of each crop the hub needs per cycle). Food inventory is **not** stored on the hub record — it lives in the central `HubInventory` table.

```python
@dataclass
class HubNode:
    id:           int
    name:         str
    lat:          float
    lng:          float
    priority:     str            # 'critical' | 'standard'
    capacity_kg:  float          # max total food the hub can hold at once
    local_demand: dict           # {crop_id: kg needed per cycle} — optimizer input only
```

---

### 2.3 HubInventory — new central table

Stored in `app/data/hub_inventory.json`. This is the authoritative record of what food is physically at each hub right now.

```python
@dataclass
class HubInventoryEntry:
    hub_id:       int
    crop_id:      int
    quantity_kg:  float          # current stock on hand
    last_updated: str            # ISO datetime string
```

Stored as a flat list. Looked up by `(hub_id, crop_id)` pair.

Example `hub_inventory.json`:
```json
[
  { "hub_id": 0, "crop_id": 1, "quantity_kg": 42.5, "last_updated": "2026-03-07T14:00:00" },
  { "hub_id": 0, "crop_id": 3, "quantity_kg": 18.0, "last_updated": "2026-03-07T09:30:00" },
  { "hub_id": 1, "crop_id": 1, "quantity_kg": 5.0,  "last_updated": "2026-03-06T18:00:00" }
]
```

When a deposit is confirmed: `quantity_kg` increases.
When a withdrawal is confirmed: `quantity_kg` decreases.
The hub can never go below `0.0` for any crop.
Total inventory across all crops at a hub must never exceed `hub.capacity_kg`.

---

### 2.4 Request — new central table

Stored in `app/data/requests.json`. Every give and receive intent lives here.

```python
@dataclass
class Request:
    id:           int            # unique, auto-incrementing
    type:         str            # 'give' | 'receive'
    node_id:      int            # farm_id of the requesting node
    hub_id:       int            # which hub this request is directed at
    crop_id:      int
    quantity_kg:  float
    status:       str            # 'pending' | 'matched' | 'confirmed' | 'cancelled'
    created_at:   str            # ISO datetime
    matched_at:   str | None     # when cron job matched it
    confirmed_at: str | None     # when hub confirmed physical exchange
```

**`node_id`** — all nodes (farmers and community members alike) use the same `farm_id` identity. No separate community member table.

Example `requests.json`:
```json
[
  {
    "id": 1,
    "type": "give",
    "node_id": 4,
    "hub_id": 0,
    "crop_id": 1,
    "quantity_kg": 8.0,
    "status": "pending",
    "created_at": "2026-03-07T10:00:00",
    "matched_at": null,
    "confirmed_at": null
  },
  {
    "id": 2,
    "type": "receive",
    "node_id": 7,
    "hub_id": 0,
    "crop_id": 1,
    "quantity_kg": 3.0,
    "status": "matched",
    "created_at": "2026-03-07T11:00:00",
    "matched_at": "2026-03-07T12:00:00",
    "confirmed_at": null
  }
]
```

---

### 2.5 LedgerEntry — new central table

Stored in `app/data/ledger.json`. Append-only audit trail of every currency movement.

```python
@dataclass
class LedgerEntry:
    id:           int
    type:         str            # 'credit' | 'debit'
    node_id:      int
    request_id:   int            # which request triggered this entry
    amount:       float          # Hub Currency amount (always positive)
    balance_after: float         # node's balance after this entry
    created_at:   str            # ISO datetime
    note:         str            # human-readable e.g. "Deposit 8kg tomato at Hub #1"
```

Never modified, only appended to. `balance_after` allows full balance reconstruction from the ledger alone without querying `FarmNode`.

---

## 3. Request Lifecycle

### 3.1 Give request (deposit)

A node has harvested food and wants to deposit it at a hub.

```
Node submits give request
    → status: 'pending'
    → cron job runs
    → checks: hub has capacity for this crop+quantity
    → if yes: status → 'matched'
    → hub staff / hub confirms physical drop-off
    → status → 'confirmed'
    → hub_inventory[hub_id][crop_id] += quantity_kg
    → node.currency_balance += earned_amount
    → LedgerEntry created (type: 'credit')
    → node.crops_on_hand[crop_id] -= quantity_kg  (if > 0)
```

### 3.2 Receive request (withdrawal)

A node wants food from a hub.

```
Node submits receive request
    → status: 'pending'
    → cron job runs
    → checks: hub has enough of this crop in inventory
    → checks: node has enough currency_balance
    → if both yes: status → 'matched'
    → node goes to hub and picks up food
    → hub confirms physical pickup
    → status → 'confirmed'
    → hub_inventory[hub_id][crop_id] -= quantity_kg
    → node.currency_balance -= cost_amount
    → LedgerEntry created (type: 'debit')
```

### 3.3 Status transitions

```
pending → matched     cron job determines conditions are met
matched → confirmed   hub confirms physical exchange happened
matched → pending     cron job re-queues if conditions change (inventory dropped, etc.)
pending → cancelled   node cancels, or request expires
matched → cancelled   node cancels before physical exchange
```

### 3.4 Rules

- A node cannot submit a receive request if `currency_balance < cost_amount`. Request is rejected at submission, not at matching.
- A hub cannot accept a deposit if it would exceed `hub.capacity_kg`. Cron job skips matching until capacity frees up.
- A request does not expire automatically at MVP — cancellation is manual.
- A node can have multiple open requests simultaneously (e.g. give tomatoes + receive lettuce).

---

## 4. Hub as Bank

The hub is the only entity that can confirm a transaction. No currency moves and no inventory changes without hub confirmation.

**Deposit flow:**
1. Node arrives at hub with food
2. Hub staff confirms quantity received
3. System calls confirm endpoint with `request_id`
4. Inventory updated, currency credited

**Withdrawal flow:**
1. Node arrives at hub to collect food
2. Hub staff confirms quantity given out
3. System calls confirm endpoint with `request_id`
4. Inventory decremented, currency debited

The hub does not need to initiate anything — it only confirms. All intent comes from nodes.

**Inventory integrity:**
- `hub_inventory` is the single source of truth for food stock
- It is only ever modified by a confirmed transaction
- The cron job reads it but never writes to it — only confirmed requests trigger writes

---

## 5. Currency

### 5.1 Earning (credit)

Currency is earned when a **give request is confirmed** by a hub. The amount is proportional to the quantity deposited.

```
earned = quantity_kg * crop.currency_rate
```

`currency_rate` is a per-crop constant (to be defined on `Crop` — higher-demand or harder-to-grow crops earn more). At MVP this can be a flat rate (e.g. 1.0 currency per kg) across all crops.

### 5.2 Spending (debit)

Currency is spent when a **receive request is confirmed**. The cost follows the same formula:

```
cost = quantity_kg * crop.currency_rate
```

At MVP: symmetric. Depositing 1kg of tomatoes earns the same as withdrawing 1kg of tomatoes costs. This keeps the economy balanced.

### 5.3 Rules

- `currency_balance` cannot go below `0.0`. Receive requests are blocked at submission if the node can't afford them.
- Currency is non-transferable between nodes at MVP — it can only be earned by depositing and spent by withdrawing.
- No free minting. The only source of currency is a confirmed deposit.
- `crops_lifetime` is a stat, not a currency input — it tracks production volume, not earnings.

---

## 6. Cron Job — Matching & Settlement Prep

The cron job does not confirm transactions. It prepares them. Confirmation is always done by the hub.

**What it does:**

```
For each pending give request:
    load hub inventory for (hub_id, crop_id)
    load hub.capacity_kg and total current inventory at hub
    if hub has capacity:
        mark request as 'matched'
        notify node (future: push notification)

For each pending receive request:
    load hub inventory for (hub_id, crop_id)
    load node.currency_balance
    if hub_inventory[hub_id][crop_id] >= quantity_kg
    AND node.currency_balance >= cost:
        mark request as 'matched'
        soft-reserve inventory (future: reservation field)
        notify node
```

**When it runs:** on a schedule (e.g. every 15 minutes). Also triggered on any hub confirmation event — a new confirmation frees capacity or adds inventory, which may unblock pending requests.

**What it does not do:**
- It does not move currency
- It does not modify hub inventory
- It does not confirm anything on behalf of the hub

At MVP, soft-reservation is not implemented — matched requests are advisory, not guaranteed. If two matched receive requests race to the hub and only one can be fulfilled, the second goes back to `pending`.

---

## 7. API Contracts

All new endpoints. Base path: `/api`.

---

### POST `/requests`
Submit a new give or receive request.

**Request body:**
```json
{
  "type": "give",
  "node_id": 4,
  "hub_id": 0,
  "crop_id": 1,
  "quantity_kg": 8.0
}
```

**Validation:**
- For `receive`: reject if `node.currency_balance < cost`
- For `give`: reject if `quantity_kg <= 0`
- Reject if `hub_id` or `crop_id` not found

**Response:**
```json
{
  "request_id": 12,
  "status": "pending",
  "message": "Request submitted. Awaiting matching."
}
```

---

### GET `/requests`
List all requests. Supports query params: `?node_id=4`, `?hub_id=0`, `?status=pending`, `?type=give`.

**Response:** array of `Request` objects.

---

### GET `/requests/{request_id}`
Get a single request by ID.

---

### DELETE `/requests/{request_id}`
Cancel a request. Only allowed if status is `pending` or `matched` (not yet confirmed).

---

### POST `/requests/{request_id}/confirm`
Hub confirms a physical exchange. This is the only endpoint that moves currency and updates inventory.

**Request body:**
```json
{
  "actual_quantity_kg": 7.5
}
```

`actual_quantity_kg` allows the hub to confirm a slightly different amount than requested (e.g. farmer brought 7.5kg instead of 8kg). The ledger entry and currency transfer use the actual quantity.

**Response:**
```json
{
  "status": "confirmed",
  "currency_delta": 7.5,
  "node_balance_after": 22.5,
  "hub_inventory_after": 50.0
}
```

---

### GET `/nodes/{node_id}/balance`
Get a node's current currency balance and crops on hand.

**Response:**
```json
{
  "node_id": 4,
  "currency_balance": 22.5,
  "crops_on_hand": { "1": 2.5 },
  "crops_lifetime": { "1": 88.0, "3": 44.0 }
}
```

---

### PATCH `/nodes/{node_id}/crops-on-hand`
Node manually updates their crops on hand (dashboard self-reporting after harvest).

**Request body:**
```json
{
  "crop_id": 1,
  "quantity_kg": 10.0
}
```

**Response:** updated `crops_on_hand` dict.

---

### GET `/hubs/{hub_id}/inventory`
Get current food stock at a hub.

**Response:**
```json
{
  "hub_id": 0,
  "inventory": [
    { "crop_id": 1, "crop_name": "Tomato", "quantity_kg": 42.5 },
    { "crop_id": 3, "crop_name": "Herbs",  "quantity_kg": 18.0 }
  ],
  "total_kg": 60.5,
  "capacity_kg": 200.0
}
```

---

### GET `/ledger`
Full ledger. Supports query params: `?node_id=4`.

**Response:** array of `LedgerEntry` objects, ordered by `created_at` descending.

---

## 8. Dynamic Pricing

### 8.1 Purpose

A flat `currency_rate` per crop does not reflect reality. If the network is flooded with tomatoes, depositing more tomatoes should earn less — the signal discourages oversupply. If lettuce is scarce, depositing lettuce should earn more — the signal incentivizes it. Prices are network-wide: one rate per crop at any given time, not per-hub.

### 8.2 Price calculation

The transaction engine calculates a `current_rate` per crop based on network-wide supply vs. the network's target supply.

```
network_supply[c]  = sum of hub_inventory[h][c] across all hubs
target_supply[c]   = config.food_targets[c]  (already exists)

scarcity_ratio[c]  = target_supply[c] / max(network_supply[c], 0.01)
                   — ratio > 1.0 means the network is undersupplied
                   — ratio < 1.0 means the network is oversupplied

current_rate[c]    = crop.base_currency_rate * clamp(scarcity_ratio[c], 0.25, 4.0)
```

- `base_currency_rate` — new field on `Crop`, the rate at perfect supply balance (e.g. `1.0`)
- `clamp(0.25, 4.0)` — floor and ceiling prevent rates from collapsing to zero or spiking uncontrollably
- At MVP: rates are recalculated each time the transaction engine runs, not in real time

### 8.3 Rate storage

Computed rates are stored in a new file `app/data/current_rates.json` — a simple map of crop_id → current rate.

```json
{
  "1": 0.75,
  "2": 1.40,
  "3": 2.10,
  "4": 1.00
}
```

The confirm endpoint reads from `current_rates.json` at time of confirmation to determine the actual currency delta. The rate in effect at confirmation time is used — not the rate at submission time.

### 8.4 Crop schema addition

```python
@dataclass
class Crop:
    # ... all existing fields unchanged ...
    base_currency_rate: float = 1.0   # currency earned/spent per kg at balanced supply
```

---

## 9. Transaction Engine

### 9.1 Purpose

Mirrors the farm optimizer (`app/engine/optimizer.py`) but for food distribution. Where the farm optimizer assigns crops to farms, the transaction engine assigns requests to hubs. It routes each pending request to the optimal hub and recalculates network prices.

Lives at: `app/engine/transaction_engine.py`

### 9.2 Inputs

```
hub_inventory[H][M]     — current kg of each crop at each hub (H hubs, M crops)
requests[]              — all pending requests (give and receive)
farms[]                 — for location data (lat/lng per node)
hubs[]                  — for location, capacity, local_demand
config                  — max_travel_distance, food_targets
```

### 9.3 What it computes

**Step 1 — Reachability**

For each pending request, determine which hubs the requesting node can reach:

```
reachable_hubs[request] = [h for h in hubs
                           if haversine(node.lat, node.lng, hub.lat, hub.lng)
                           <= config.max_travel_distance]
```

Reuses the existing `haversine` function from `app/engine/router.py`.

**Step 2 — Hub scoring**

For each reachable hub, score it for this request:

```
# For a give request (deposit):
score[h] = demand_gap[h][crop] / hub.capacity_remaining[h]
         — prefer hubs that need this crop and have room for it

# For a receive request (withdrawal):
score[h] = hub_inventory[h][crop] / hub.local_demand[h][crop]
         — prefer hubs that are well-stocked for this crop
```

`capacity_remaining[h] = hub.capacity_kg - sum(hub_inventory[h])`

**Step 3 — Assignment**

Each request is assigned to the highest-scoring reachable hub. If no hub is reachable or no hub can satisfy the request (no inventory for receive, no capacity for give), the request stays `pending` and is retried next run.

**Step 4 — Price recalculation**

After routing, recalculate `current_rates` from network-wide inventory totals and write to `current_rates.json`.

### 9.4 Output

- Updated `status` on matched requests (`pending` → `matched`)
- Updated `hub_id` on each request if rerouted to a better hub than originally submitted
- Updated `current_rates.json`

### 9.5 When it runs

The transaction engine is called by the cron job. It does not run on every API call — only on schedule (same cadence as the matching cron job, e.g. every 15 minutes) and after any hub confirmation event.

### 9.6 What it does not do

- Does not confirm transactions
- Does not write to `hub_inventory.json`
- Does not write to `ledger.json`
- Does not move currency

All writes that affect balances and inventory are gated behind hub confirmation only.

---

## 10. Storage Summary

| File | What it holds |
|---|---|
| `farms.json` | All nodes (farmers + community members) — extended with `currency_balance`, `crops_on_hand`, `crops_lifetime` |
| `hubs.json` | Hub definitions — unchanged |
| `hub_inventory.json` | Current food stock per hub per crop — new |
| `requests.json` | All give/receive requests — new |
| `ledger.json` | Append-only currency movement log — new |
| `crops.json` | Crop definitions — will need `base_currency_rate` field added |
| `current_rates.json` | Network-wide dynamic rate per crop — written by transaction engine |
| `assignments.json` | Optimizer assignments — unchanged |
| `config.json` | Network config — unchanged |
