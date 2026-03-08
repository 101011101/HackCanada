# Transaction System — Build Plan

Everything that needs to be built, in order. Check off as completed.

---

## Stage 1 — Schema & Storage (data layer foundation)

Nothing else can be built until this is done. No logic, no routes, no engine.

### `app/engine/schemas.py`
- [ ] Add `currency_balance: float = 0.0` to `FarmNode`
- [ ] Add `crops_on_hand: dict = field(default_factory=dict)` to `FarmNode`
- [ ] Add `crops_lifetime: dict = field(default_factory=dict)` to `FarmNode`
- [ ] Add `base_currency_rate: float = 1.0` to `Crop`
- [ ] Add `HubInventoryEntry` dataclass
- [ ] Add `Request` dataclass
- [ ] Add `LedgerEntry` dataclass

### `app/api/storage.py`
- [ ] Add `load_requests()` → `list[dict]` (returns `[]` if missing)
- [ ] Add `save_requests(requests)`
- [ ] Add `load_ledger()` → `list[dict]` (returns `[]` if missing)
- [ ] Add `save_ledger(entries)`
- [ ] Add `load_hub_inventory()` → `list[dict]` (returns `[]` if missing)
- [ ] Add `save_hub_inventory(inventory)`
- [ ] Add `load_current_rates()` → `dict` (returns `{}` if missing)
- [ ] Add `save_current_rates(rates)`
- [ ] Update `dict_to_farmnode()` — handle new fields with `.get()` defaults
- [ ] Update `dict_to_crop()` — handle `base_currency_rate` with `.get()` default
- [ ] Update `seed_if_missing()` — seed all 4 new files

### `app/data/` (seeded by storage layer)
- [ ] `hub_inventory.json` — one entry per hub per crop, all `quantity_kg: 0.0`
- [ ] `requests.json` — empty list `[]`
- [ ] `ledger.json` — empty list `[]`
- [ ] `current_rates.json` — `{crop_id: 1.0}` for all crops

---

## Stage 2 — API Routes (request submission & hub confirmation)

Depends on: Stage 1 complete.

### `app/api/routes/requests.py` (new file)
- [ ] `POST /requests` — submit give or receive request
  - Validate `type` is `give` or `receive`
  - Validate `hub_id`, `crop_id` exist
  - For `receive`: reject if `node.currency_balance < cost`
  - For `give`: reject if `quantity_kg <= 0`
  - Auto-assign `id` (max existing id + 1), `status: pending`, `created_at: now`
  - Save to `requests.json`
- [ ] `GET /requests` — list requests, filter by `?node_id`, `?hub_id`, `?status`, `?type`
- [ ] `GET /requests/{request_id}` — get single request
- [ ] `DELETE /requests/{request_id}` — cancel (only if `pending` or `matched`)
- [ ] `POST /requests/{request_id}/confirm` — hub confirms physical exchange
  - Accepts `actual_quantity_kg`
  - Marks request `confirmed`
  - Updates `hub_inventory.json`
  - Updates `node.currency_balance` in `farms.json`
  - Appends to `ledger.json`
  - Reads rate from `current_rates.json` at confirmation time
  - Triggers transaction engine run (price recalc + re-match pending requests)

### `app/api/routes/nodes.py` (extend existing)
- [ ] `GET /nodes/{node_id}/balance` — return `currency_balance`, `crops_on_hand`, `crops_lifetime`
- [ ] `PATCH /nodes/{node_id}/crops-on-hand` — self-report crops on hand

### `app/api/routes/hubs.py` (extend existing)
- [ ] `GET /hubs/{hub_id}/inventory` — return hub inventory with crop names, total kg, capacity

### `app/api/routes/ledger.py` (new file)
- [ ] `GET /ledger` — full ledger, filterable by `?node_id`

### Register new routers in `app/engine/main.py` (or wherever routers are registered)
- [ ] Register `requests` router
- [ ] Register `ledger` router

---

## Stage 3 — Transaction Engine (matching & pricing)

Depends on: Stage 1 complete. Stage 2 confirm endpoint triggers this.

### `app/engine/transaction_engine.py` (new file)

- [ ] `run(farms, hubs, crops, config) → None` — main entry point called by cron + post-confirm

**Matching logic:**
- [ ] Load all `pending` requests from `requests.json`
- [ ] For each pending `give` request:
  - Find reachable hubs using `haversine` from `app/engine/router.py`
  - Score each reachable hub: `demand_gap[h][crop] / capacity_remaining[h]`
  - Assign to highest-scoring hub that has capacity
  - Mark `matched`, update `hub_id` if rerouted
- [ ] For each pending `receive` request:
  - Find reachable hubs
  - Score each: `hub_inventory[h][crop] / hub.local_demand[h][crop]`
  - Assign to highest-scoring hub that has sufficient stock AND node can afford it
  - Mark `matched`, update `hub_id` if rerouted
- [ ] Re-queue `matched` requests back to `pending` if conditions no longer met

**Pricing logic:**
- [ ] Load `hub_inventory.json` and sum per crop across all hubs → `network_supply[c]`
- [ ] Load `config.food_targets` → `target_supply[c]`
- [ ] Compute `scarcity_ratio[c] = target_supply[c] / max(network_supply[c], 0.01)`
- [ ] Compute `current_rate[c] = crop.base_currency_rate * clamp(scarcity_ratio[c], 0.25, 4.0)`
- [ ] Write updated rates to `current_rates.json`

---

## Stage 4 — Cron Job (scheduled execution)

Depends on: Stage 3 complete.

### Cron setup (location TBD — separate script or FastAPI startup task)
- [ ] Run `transaction_engine.run()` every 15 minutes
- [ ] Also triggered after every `POST /requests/{id}/confirm`

---

## Summary Table

| Stage | What | Depends on | Status |
|---|---|---|---|
| 1 | Schema + Storage | nothing | not started |
| 2 | API Routes | Stage 1 | not started |
| 3 | Transaction Engine | Stage 1 | not started |
| 4 | Cron Job | Stage 3 | not started |
