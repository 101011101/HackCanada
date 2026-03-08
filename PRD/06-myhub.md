# MyHub — PRD

MyHub is the farmer-facing hub interface within the MyCelium app. It is where a node interacts with the food economy: trading food with other nodes, earning and spending Hub Currency, and viewing transaction history. Every food exchange in the network flows through MyHub.

---

## 1. Purpose

The optimization engine tells each node what to grow. MyHub handles what happens after harvest — how food moves between nodes and how value is exchanged. It closes the loop between production and consumption.

**Core principle:** food has value, and that value is tracked through Hub Currency. When two nodes trade food, the node contributing higher-valued food earns currency for the difference. Currency can then be spent to acquire food from other nodes. MyHub records every transaction so the network has a complete, auditable food economy.

---

## 2. Concepts

### Hub Currency

A network-internal unit of value. Cannot be purchased with fiat money. Earned only by contributing food of value to the network. Spent only on acquiring food from other nodes.

- **Backed by real production.** Currency enters circulation only when food changes hands.
- **Not freely mintable.** No admin can arbitrarily create currency. Supply grows proportionally with food production.
- **Non-expiring at MVP.** Simplifies early adoption; revisit expiry if hoarding becomes a problem.

### Food Valuation

Each crop in the network has a value score, determined by:

| Factor | Weight | Rationale |
|--------|--------|-----------|
| **Network demand** | High | Crops the network needs most are worth more |
| **Growing difficulty** | Medium | Harder-to-grow crops carry a premium |
| **Yield scarcity** | Medium | Low total network supply increases value |
| **Nutritional density** | Low | Baseline factor; prevents gaming with easy-to-grow, low-nutrition crops |

Value scores are recalculated each cycle by the optimization engine and published network-wide. Every node sees the same price table. This prevents bargaining, simplifies UX, and keeps the economy fair.

**Value of a food unit** = `quantity_kg × crop_value_score`

### Transaction

A completed food exchange between two nodes. Every transaction has:

- A **giver** (the node sending food)
- A **receiver** (the node accepting food)
- A **food item** (crop type + quantity in kg)
- A **currency delta** (the Hub Currency transferred based on food valuation)
- A **timestamp**
- A **status** (pending, confirmed, disputed, settled)

---

## 3. User Flows

### Flow 1: Initiate a Food Trade (Giver Side)

1. Giver opens MyHub → taps **Give Food**
2. Giver selects the crop and enters the quantity (kg)
3. Giver searches for the receiver node (by name or proximity)
4. Giver reviews the transaction summary:
   - Food: "2.5 kg Spinach"
   - Estimated currency earned: calculated from `quantity × crop_value_score`
   - Receiver: "Node 14 — Fatima"
5. Giver submits → transaction enters **pending** state
6. Receiver gets a notification (push + in-app)

### Flow 2: Confirm Receipt (Receiver Side)

1. Receiver opens MyHub → sees incoming request under **Pending Transactions**
2. Receiver reviews details: crop, quantity, giver identity
3. Receiver either:
   - **Confirms** receipt → transaction moves to **settled**
   - **Disputes** → transaction moves to **disputed** (see Flow 5)
4. On confirmation:
   - Giver's currency balance is credited
   - Receiver's currency balance is debited (if they owe currency for this trade)
   - Transaction is logged permanently

### Flow 3: Buy Food with Currency

1. Buyer opens MyHub → taps **Receive Food**
2. Buyer browses available food from nearby nodes:
   - Each listing shows: crop, quantity available, currency cost, distance
   - Listings are sorted by proximity (nearest first), filterable by crop
3. Buyer selects a listing → taps **Request**
4. The seller node receives a notification under **Incoming Requests**
5. Seller either:
   - **Accepts** → transaction enters **pending delivery** state
   - **Declines** → buyer is notified, can request from another node
6. Buyer and seller arrange handoff (at hub or direct)
7. Buyer confirms receipt → currency is debited from buyer, credited to seller
8. Transaction is settled

### Flow 4: Mutual Trade (Food for Food)

When two nodes each have surplus the other wants:

1. Node A initiates a trade with Node B, offering crop X
2. Node B sees the request → can respond with a counter-offer of crop Y
3. Both parties review the combined trade:
   - Node A gives: 3 kg Tomatoes (value: 15 HC)
   - Node B gives: 2 kg Herbs (value: 10 HC)
   - Net: Node A earns 5 HC (contributed higher-valued food)
4. Both confirm → both food transfers settle → net currency flows to the node that contributed more value

### Flow 5: Dispute Resolution

1. Receiver reports an issue: food not received, wrong quantity, poor quality
2. Transaction moves to **disputed**
3. Hub admin (or automated rule) reviews:
   - If quantity mismatch: receiver enters actual quantity → recalculates currency
   - If food not received: transaction is voided, no currency moves
   - If quality issue: partial credit at admin discretion
4. Both parties are notified of the resolution
5. Transaction status moves to **settled** (with adjustment) or **voided**

---

## 4. MyHub Screens

### 4.1 Home (Dashboard)

The landing screen when a user opens MyHub.

| Element | Description |
|---------|-------------|
| **Currency Balance** | Prominent display of current Hub Currency balance |
| **Quick Actions** | Three buttons: Give Food, Receive Food, View History |
| **Pending Transactions** | List of transactions awaiting confirmation (incoming and outgoing) |
| **Recent Activity** | Last 5 settled transactions with crop, quantity, currency, and counterparty |

### 4.2 Give Food

| Element | Description |
|---------|-------------|
| **Crop Selector** | Dropdown of crops the user is currently growing (pulled from their farm data) |
| **Quantity Input** | Numeric input (kg), validated against estimated available surplus |
| **Recipient Search** | Search by node name or browse nearby nodes on a mini-map |
| **Value Preview** | Live-calculated currency value as crop and quantity are selected |
| **Submit Button** | Creates pending transaction and notifies recipient |

### 4.3 Receive Food

| Element | Description |
|---------|-------------|
| **Available Listings** | Cards showing nearby nodes with surplus: crop, quantity, cost (HC), distance |
| **Filters** | By crop type, max distance, max cost |
| **Sort** | By distance (default), price, crop name |
| **Request Button** | Per-listing; sends request to the seller node |
| **Your Requests** | Tab showing outbound requests and their status |

### 4.4 Transaction History

| Element | Description |
|---------|-------------|
| **Transaction List** | Scrollable, date-sorted list of all transactions |
| **Per Transaction** | Crop, quantity, counterparty, currency earned/spent, status, timestamp |
| **Filters** | By date range, crop, earned vs spent, status |
| **Export** | Download as CSV (for personal records) |
| **Running Balance** | Currency balance over time, displayed as a simple line chart |

### 4.5 Pending Transactions

| Element | Description |
|---------|-------------|
| **Incoming** | Transactions where this node is the receiver, awaiting confirmation |
| **Outgoing** | Transactions where this node is the giver, awaiting the other party's confirmation |
| **Per Item** | Crop, quantity, counterparty, value, time since created |
| **Actions** | Confirm, Dispute (incoming); Cancel (outgoing, if not yet confirmed) |

### 4.6 Manage Local Nodes

| Element | Description |
|---------|-------------|
| **Nearby Nodes List** | Nodes within the user's hub radius, showing name, distance, active crops |
| **Node Detail** | Tap a node to see its profile: crops, surplus availability, trade history with you |
| **Connection Status** | Whether this node is actively producing, idle, or offline |
| **Direct Trade** | Shortcut to initiate a trade with this specific node |

---

## 5. Currency Mechanics

### Earning

| Trigger | Currency Credited |
|---------|-------------------|
| Give food to another node (confirmed) | `quantity_kg × crop_value_score` |
| Deliver food to a community hub | `quantity_kg × crop_value_score × hub_bonus_multiplier` |
| Complete a network-assigned growing cycle | Flat bonus (incentivizes compliance with optimizer) |

`hub_bonus_multiplier` (e.g. 1.2x) rewards farmers who deliver to hubs over direct peer trades, since hub food serves the broader community.

### Spending

| Trigger | Currency Debited |
|---------|------------------|
| Receive food from another node (confirmed) | `quantity_kg × crop_value_score` |
| Pick up food from a community hub | `quantity_kg × crop_value_score` |

### Net Settlement in Trades

In a mutual trade (food-for-food), only the **net difference** in currency moves:

```
Node A gives: 3 kg Tomatoes → value 15 HC
Node B gives: 2 kg Herbs    → value 10 HC
─────────────────────────────────────────
Net: 5 HC flows from Node B to Node A
```

If both contributions are equal, no currency moves — it's a clean barter.

### Balance Rules

- A node's balance can go negative (up to a configurable floor, e.g. -50 HC) to allow new nodes to participate before they've earned. This functions as a starter credit.
- Nodes with deeply negative balances are flagged for admin review and may be rate-limited on food requests.
- No upper cap on positive balance at MVP.

---

## 6. The Request System

The dual-confirmation request system is the trust layer for MyHub. No food transaction settles until both parties confirm.

### State Machine

```
                  ┌─────────┐
   Giver submits  │ PENDING │  Receiver notified
                  └────┬────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
        ┌──────────┐     ┌──────────┐
        │CONFIRMED │     │ DECLINED │
        │(by recv) │     │(by recv) │
        └────┬─────┘     └──────────┘
             │
             ▼
      ┌─────────────┐
      │   SETTLED    │  Currency transferred
      └─────────────┘
             │
      (if issue)
             ▼
      ┌─────────────┐
      │  DISPUTED   │  Admin reviews
      └──────┬──────┘
             │
       ┌─────┴──────┐
       ▼            ▼
  ┌─────────┐  ┌────────┐
  │ADJUSTED │  │ VOIDED │
  └─────────┘  └────────┘
```

### Timeouts

- **Pending → auto-cancelled** after 48 hours if receiver does not respond.
- **Pending delivery → flagged** after 72 hours if buyer does not confirm receipt.
- Timeouts prevent stale transactions from clogging the system.

### Notifications

| Event | Notification To |
|-------|-----------------|
| New incoming trade request | Receiver |
| Trade confirmed | Giver |
| Trade declined | Giver |
| Trade disputed | Both parties + admin |
| Dispute resolved | Both parties |
| Pending transaction about to expire | Both parties |

---

## 7. Data Model

### Transaction

```
Transaction {
  id:             UUID
  giver_id:       UUID (FK → User)
  receiver_id:    UUID (FK → User)
  crop_id:        UUID (FK → Crop)
  quantity_kg:     Decimal
  crop_value:      Decimal (snapshot of crop_value_score at time of trade)
  total_value:     Decimal (quantity_kg × crop_value)
  currency_delta:  Decimal (net HC transferred; positive = giver earned)
  status:         Enum (pending, confirmed, settled, disputed, adjusted, voided, cancelled)
  created_at:     Timestamp
  confirmed_at:   Timestamp (nullable)
  settled_at:     Timestamp (nullable)
  notes:          Text (nullable; used for disputes)
}
```

### Mutual Trade (linked transactions)

```
MutualTrade {
  id:               UUID
  transaction_a_id: UUID (FK → Transaction)
  transaction_b_id: UUID (FK → Transaction)
  net_currency:     Decimal (difference flows to the higher-value contributor)
}
```

### Currency Ledger

```
LedgerEntry {
  id:             UUID
  user_id:        UUID (FK → User)
  transaction_id: UUID (FK → Transaction, nullable; null for bonuses)
  amount:         Decimal (positive = credit, negative = debit)
  balance_after:  Decimal
  entry_type:     Enum (trade, hub_delivery, hub_pickup, bonus, adjustment)
  created_at:     Timestamp
}
```

### Crop Value Table

```
CropValue {
  crop_id:          UUID (FK → Crop)
  value_score:      Decimal
  cycle_id:         UUID (FK → GrowCycle)
  computed_at:      Timestamp
}
```

---

## 8. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions` | Create a new food trade (giver initiates) |
| `PATCH` | `/transactions/:id/confirm` | Receiver confirms receipt |
| `PATCH` | `/transactions/:id/decline` | Receiver declines |
| `PATCH` | `/transactions/:id/cancel` | Giver cancels a pending transaction |
| `PATCH` | `/transactions/:id/dispute` | Either party raises a dispute |
| `PATCH` | `/transactions/:id/resolve` | Admin resolves a dispute |
| `GET` | `/transactions` | List transactions (filterable by status, date, counterparty) |
| `GET` | `/transactions/:id` | Get single transaction detail |
| `GET` | `/currency/balance` | Get current user's HC balance |
| `GET` | `/currency/ledger` | Get currency ledger entries (paginated) |
| `GET` | `/crops/values` | Get current crop value table |
| `GET` | `/nodes/nearby` | Get nearby nodes with surplus food listings |
| `GET` | `/nodes/:id/surplus` | Get a specific node's available surplus |
| `POST` | `/mutual-trades` | Create a linked mutual trade (food-for-food) |

---

## 9. Abuse Prevention

| Risk | Mitigation |
|------|------------|
| **Fake delivery** (giver claims to send food that never arrives) | Receiver must confirm. No confirmation = no currency. Repeated unconfirmed trades flag the giver. |
| **Collusion** (two nodes trade fake food to mint currency) | Trades are validated against farm data — you can only give food you're assigned to grow and have plausible surplus for. Anomalous volume triggers review. |
| **Receiver never confirms** (to avoid paying currency) | 72-hour auto-escalation. Repeated non-confirmations flag the receiver. |
| **Dispute abuse** (filing false disputes to reverse trades) | Dispute history tracked per user. Frequent disputers get reviewed and potentially rate-limited. |
| **Account farming** (creating fake nodes) | Nodes require valid farm data that passes optimization engine checks. Nodes with no growing activity earn nothing. |

---

## 10. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | **Should crop values be visible to all users or only shown at transaction time?** Full transparency helps farmers plan trades; hiding values prevents gaming (over-producing high-value crops at the expense of network needs). | UX, economy balance |
| 2 | **Physical handoff: hub-mediated or direct peer-to-peer or both?** Hub-mediated is easier to audit but adds friction. Peer-to-peer is faster but harder to verify. | Trust, logistics |
| 3 | **Starter credit amount for new nodes.** Too low and new farmers can't participate. Too high and it's exploitable. | Onboarding, abuse |
| 4 | **Should the system support scheduled/recurring trades?** (e.g. "send 1 kg lettuce to Node 7 every week") | UX, complexity |
| 5 | **Currency naming.** "Hub Currency" is a working name. Needs a final name that fits the MyCelium brand (e.g. "Spore", "Myco", "Root"). | Branding |
| 6 | **Admin tooling scope.** What does the dispute resolution interface look like? Is it a separate admin panel or integrated into the main dashboard? | Build scope |
| 7 | **How does MyHub interact with the community hub (physical)?** Is delivering to a physical hub a special case of "Give Food" or a separate flow? | Architecture |

---

## 11. MVP Scope

### In Scope (build for MVP)

- Give Food flow with dual confirmation
- Receive Food flow (browse nearby surplus, request, confirm)
- Currency balance display and ledger
- Transaction history with filters
- Crop value table (static or optimizer-published)
- Pending transaction management (confirm, decline, cancel)
- Push notifications for transaction state changes
- Nearby nodes list with surplus visibility

### Deferred (post-MVP)

- Mutual trades (food-for-food with net settlement)
- Dispute resolution (handle manually via admin at MVP; build UI later)
- Scheduled/recurring trades
- CSV export
- Running balance chart
- Hub delivery bonus multiplier (use flat rate at MVP)
- Negative balance floor system (start all nodes at a fixed starter balance instead)
