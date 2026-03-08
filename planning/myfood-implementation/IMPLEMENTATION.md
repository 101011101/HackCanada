# MyFood Implementation Document

Implementation plan for the MyFood consumer app, using a dedicated API plan. All content is organized below with clear section gaps.

---

## Context

- **MyFood** = consumer-facing app (Hub Currency balance, “My Groceries” / “My Donations”, request tickets). Reference UI: `final-kits/myfood-mobile-wireframe.html`.
- **Backend** already exposes the needed flows: `app/backend/api/routes/requests.py`, `app/backend/api/routes/ledger.py`, `app/backend/api/routes/rates.py`, and `GET /nodes/{id}/balance` in `app/backend/api/routes/nodes.py`. Summarized (with types) in `frontend-PRD/implementation/01-api-service-layer.md`, which notes “My Food / marketplace — Not built — stub page”.
- No **dedicated** “API plan for MyFood” existed; this document defines it and the implementation that uses it.

---

## Part 1 — API Plan for MyFood

Single source-of-truth for the API surface used by the MyFood consumer app.

---

### 1.1 Scope

- Defines the API surface for the **MyFood consumer app**.
- Identity = one `node_id`.
- Flows = balance, requests, rates, ledger.

---

### 1.2 Identity

- Consumer is represented by a **node** (same as farmer: `node_id` = farm/node id).
- How the app obtains `node_id`: e.g. from existing onboarding (user already has a farm) or a lightweight “consumer registration” (if added). Document the chosen approach in the gaps section below.

---

### 1.3 Endpoints and Contracts


| Area               | Endpoints                                                                                                   | MyFood usage                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Balance & identity | `GET /nodes/{node_id}/balance`                                                                              | Hero “42 HC”, stats (consumed/donated/requests counts derived from balance + requests).                                        |
| Requests (tickets) | `POST /requests`, `GET /requests?node_id=`, `POST /requests/{id}/select-hub`, `POST /requests/{id}/confirm` | My Groceries = `type: 'receive'`, My Donations = `type: 'give'`. Ticket states: pending → options_ready → matched → confirmed. |
| Rates              | `GET /rates`, `GET /rates/cost?crop_id=&quantity_kg=&action=`                                               | Pre-fill cost (receive) or earn (give) in bottom sheets.                                                                       |
| Ledger             | `GET /ledger?node_id=`                                                                                      | Transaction history (optional in v1).                                                                                          |
| Reference data     | `GET /crops`, `GET /hubs`                                                                                   | Crop list for sheets; hub list for hub picker when `options_ready`.                                                            |


- Request/response types must match `app/backend/api/models.py`: `RequestBody`, `RequestResponse`, `BalanceResponse`, `LedgerEntryResponse`, etc.

---

### 1.4 Request Lifecycle

1. Submit (no hub).
2. Engine sets `options_ready`.
3. User selects hub via `POST /requests/{id}/select-hub`.
4. Confirm with actual quantity via `POST /requests/{id}/confirm`.

- Validation: e.g. balance check for `receive` (backend returns 422 if insufficient).

---

### 1.5 Polling / Realtime

- MyFood must detect when a request becomes `options_ready` (show hub picker) and when confirmed (update balance).
- **Strategy:** Poll `GET /requests?node_id=X` every 30s on the MyFood screen. Optionally poll `GET /nodes/{node_id}/balance` to update hero. Align with `frontend-PRD/implementation/01-api-service-layer.md` “Polling strategy”.

---

### 1.6 Gaps — API Plan

- **Identity:** Decide and document how MyFood obtains `node_id` (reuse `farm_id` from localStorage vs. consumer-only registration).
- **Base URL:** Confirm `VITE_API_BASE_URL` (or equivalent) and auth header format if any.
- **Backend gaps:** List any missing backend support (e.g. consumer-only registration, or hub_options shape in `RequestResponse`).

---

## Part 2 — Implementation Plan (Uses the API Plan)

Implementation assumes the API plan above is the contract for all MyFood API usage.

---

### Phase 1 — API Plan and Service Layer

1. **Write the API plan**
  Create or finalize the MyFood API plan (this document or a separate `API-PLAN.md`). Get reviewed if needed.
2. **MyFood API service layer**
  - Under `app/frontend/src/` (or `myfood/` subfolder), add a **typed** service module (e.g. `services/myfood-api.ts` or extend `user/services/api.ts`) with **only** the calls from the API plan:
    - `getBalance(nodeId)`, `listRequests({ node_id })`, `submitRequest(body)`, `selectHub(requestId, hub_id)`, `confirmRequest(requestId, actual_quantity_kg)`, `getRates()`, `getDeliveryCost(crop_id, quantity_kg, action)`, `getLedger(node_id)`, `getCrops()`, `getHubs()`.
  - Types must match the API plan and backend models. No raw `fetch` in MyFood UI components.
3. **Identity**
  - Implement how MyFood gets `node_id` (see Gaps 1.6). Document in API plan.

**Done when:** API plan doc exists, service layer exists and compiles, and one smoke test (e.g. `getBalance(nodeId)`) works against the running backend.

---

### Phase 2 — MyFood Shell and Layout

1. **Routes**
  Add MyFood route tree (e.g. `/myfood` or `/food`) so the app can load the MyFood flow without affecting existing MyCelium routes.
2. **Layout from wireframe**
  Using `final-kits/myfood-mobile-wireframe.html` and `frontend-PRD/final/user-dashboard.html`:
  - Topbar (same as user-dashboard nav).
  - Hero: Hub Currency label, balance (e.g. “42 HC”), subtitle, 3 stat chips (Consumed kg, Donated kg, Requests).
  - “Tasks” row with “My Groceries” and “My Donations” buttons.
  - Ticket list (Phase 3).
  - Bottom tabbar (same as user-dashboard footer).
3. **CSS**
  Reuse or copy wireframe CSS (variables, `.m-topbar`, `.m-hero`, `.ticket`, `.m-tabbar`, etc.) so the screen matches the wireframe.

**Done when:** MyFood route renders full layout with static/mock data (balance, 2–3 mock tickets), no live API yet.

---

### Phase 3 — Tickets and Request State

1. **Map API status to ticket UI**
  - `pending` → “Pending” ticket, no hub yet.
  - `options_ready` → “Approved” style, show hub picker (from `request.hub_options` or `GET /hubs`).
  - `matched` → show “Drop off by …” / instructions.
  - `confirmed` → “Completed” ticket, optional link to ledger.
2. **Ticket list data**
  - Feed from `listRequests({ node_id })`.
  - Derive hero stats (Consumed kg, Donated kg, Requests) from balance + requests or a future summary endpoint.
3. **Hub picker and confirm**
  - When `options_ready`, show hub selection; call `selectHub(requestId, hub_id)`.
  - When user has dropped off/picked up, call `confirmRequest(requestId, actual_quantity_kg)` (optional quantity edit).
  - After confirm, refetch balance and requests.

**Done when:** Tickets reflect real request status; user can select hub and confirm; balance and list update after confirm.

---

### Phase 4 — My Groceries and My Donations Sheets

1. **My Groceries sheet**
  - Crop selector (`getCrops()`), quantity input.
  - Before submit: `getDeliveryCost(crop_id, quantity_kg, 'receive')` → show cost (e.g. “7.5 HC”).
  - Validate balance ≥ cost; show clear error if backend returns 422.
  - Submit: `submitRequest({ type: 'receive', node_id, crop_id, quantity_kg })` (no `hub_id`).
  - Close sheet and refresh request list.
2. **My Donations sheet**
  - Same crop + quantity.
  - Show `getDeliveryCost(..., 'give')` as “Estimated earnings” (e.g. “9.0 HC”).
  - Submit: `submitRequest({ type: 'give', node_id, crop_id, quantity_kg })`.
  - Close sheet and refresh request list.
3. **Polling**
  - On MyFood screen, poll `listRequests({ node_id })` (e.g. every 30s) so `options_ready` shows hub picker without reload. Optionally poll `getBalance(node_id)` for hero.

**Done when:** User can request groceries and donations from sheets; cost/earn shown; submissions create requests and tickets update via polling or refetch.

---

### Phase 5 — Polish and Edge Cases

1. **Error handling**
  - Insufficient balance (receive): show API message (e.g. 422 detail).
  - Network/API errors: retry or inline error per existing app patterns.
2. **Empty and loading states**
  - No requests: empty state in ticket list.
  - Loading: skeleton or spinners for hero and ticket list.
3. **Optional**
  - Ledger page or section (`GET /ledger?node_id=`).
  - Desktop layout for MyFood (same components, different breakpoints).

**Done when:** MyFood is usable end-to-end with clear errors and loading/empty states.

---

## Gaps — Implementation

- **Phase 1:** Location of MyFood code: under `user/` vs. separate `myfood/` tree.
- **Phase 1:** Identity implementation (see API plan gaps 1.6).
- **Phase 2:** Exact route path (`/myfood` vs. `/food`) and whether MyFood shares layout with MyCelium.
- **Phase 3:** Source of hub list for picker — `request.hub_options` vs. `GET /hubs` (and filtering).
- **Phase 4:** Quantity step/validation (min, max, decimals).
- **Phase 5:** Ledger and desktop layout in or out of v1 scope.

---

## Dependency Overview

- **API plan** defines scope, identity, endpoints, lifecycle, polling.
- **Backend** already provides: requests, balance, rates, ledger, nodes, hubs, crops.
- **Implementation** order: Service layer → Shell/layout → Tickets → Sheets/polling → Polish. Every API call must conform to the API plan.

---

## Summary

- **API plan for MyFood** = scope, identity, endpoints (with types), request lifecycle, polling. Aligns with existing backend and `frontend-PRD/implementation/01-api-service-layer.md`.
- **Implementation** = five phases: (1) API plan + service layer + identity, (2) shell and layout, (3) tickets and request state, (4) Groceries/Donations sheets and polling, (5) polish and edge cases.

