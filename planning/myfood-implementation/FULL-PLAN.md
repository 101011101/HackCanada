# MyFood — Full Implementation Plan (Exact Steps)

This document is the fully finished plan: exactly what to do, in order. Each step is actionable and testable.

---

## Prerequisites

- Node.js and npm (or pnpm) for frontend.
- Python 3.x for backend. Backend runs from repo root or `app/` (see `app/api/main.py`).
- Existing API today: `POST/GET /nodes`, `GET /hubs`, `GET /crops`, `GET /report`, `POST /optimize`, etc. **No** requests, ledger, rates, or balance yet — those are built in Phase 0 below.

---

## Phase 0 — Backend: Add MyFood API (Requests, Balance, Rates, Ledger)

**Goal:** The API used by the implementation doc exists. All paths under `app/api/`.

### 0.1 — Data and storage

1. **Add request and ledger storage.**
   - In `app/api/storage.py`: add `load_requests()` / `save_requests()` reading/writing `data/requests.json` (default `[]`), and `load_ledger()` / `save_ledger()` for `data/ledger.json` (default `[]`).
   - In `app/api/storage.py`: add `load_current_rates()` / `save_current_rates()` or derive rates from `data/config.json` (e.g. a `rates` object or default 1.0 per crop). Ensure `seed_if_missing()` creates empty `requests.json` and `ledger.json` if you add it.

2. **Add `currency_balance` to farms.**
   - Ensure each farm in `data/farms.json` (and any code that creates farms) has a `currency_balance` field (float, default 0.0). Update `app/api/storage.py` and engine schemas if farms are typed (e.g. `FarmNode` or dict) so new farms get `currency_balance: 0.0`.

3. **Rates source.**
   - Decide where rates live: e.g. `data/rates.json` (crop_id → rate) or inside `config.json`. Implement `load_current_rates()` to return a dict `{str(crop_id): float}`. Seed default rates (e.g. 1.0 per crop) in seed data.

### 0.2 — Pydantic models

4. **In `app/api/models.py`, add:**
   - `RequestBody`: `type: str` ('give' | 'receive'), `node_id: int`, `hub_id: Optional[int]`, `crop_id: int`, `quantity_kg: float`.
   - `RequestResponse`: `id`, `type`, `node_id`, `hub_id`, `crop_id`, `quantity_kg`, `status: str`, `hub_options: list`, `created_at`, `matched_at`, `confirmed_at` (all as in existing PRD/service-layer doc).
   - `BalanceResponse`: `node_id`, `currency_balance`, `crops_on_hand: dict`, `crops_lifetime: dict`.
   - `SelectHubBody`: `hub_id: int`.
   - `ConfirmBody`: `actual_quantity_kg: float`.
   - `ConfirmResponse`: `status`, `currency_delta`, `node_balance_after`, etc.
   - `LedgerEntryResponse`: `id`, `type`, `node_id`, `request_id`, `amount`, `balance_after`, `created_at`, `note`.
   - Rate response types: e.g. list of `{crop_id, crop_name, rate}` and for cost: `{crop_id, quantity_kg, action, rate, earn?, cost?}`.

### 0.3 — Balance endpoint

5. **Add `GET /nodes/{node_id}/balance`.**
   - New route in `app/api/routes/nodes.py` (or a new file included in main). Load farm by `node_id`; return `BalanceResponse` with `currency_balance` from farm, and `crops_on_hand` / `crops_lifetime` (from farm or from assignments/ledger — define simple derivation if not already on farm, e.g. empty dicts for v1).

### 0.4 — Requests endpoints

6. **Add `POST /requests`.**
   - In new file `app/api/routes/requests.py`: validate body (type give/receive, quantity_kg > 0, crop exists). For `receive`, check farm’s `currency_balance` >= cost (quantity × rate); return 422 if insufficient. Append new request with `status: 'pending'`, `hub_options: []`. Save requests. Return `RequestResponse`.

7. **Add `GET /requests`.**
   - Query params: `node_id`, `hub_id`, `status`, `type`. Filter stored requests and return list of `RequestResponse`.

8. **Add `POST /requests/{request_id}/select-hub`.**
   - Body: `hub_id`. Validate request exists and is in `options_ready`. Set request’s `hub_id`, set `status` to `matched`. Save. Return simple success + message.

9. **Add `POST /requests/{request_id}/confirm`.**
   - Body: `actual_quantity_kg`. Validate request is `matched`. Apply currency logic: for `give` credit node, for `receive` debit node (using rate). Append ledger entry. Set request `status` to `confirmed`, set `confirmed_at`. Save requests, farms, ledger. Return `ConfirmResponse` with `currency_delta`, `node_balance_after`.

10. **Wire a minimal “engine” for `options_ready`.**
    - When a request is `pending`, something must set it to `options_ready` and fill `hub_options`. Options: (a) a background job/cron that calls an internal function, or (b) a manual `POST /internal/process-requests` for demo, or (c) synchronous in `POST /requests` (e.g. call a function that assigns hub options and sets status). Implement one of these so that after submit, a request can transition to `options_ready` with at least one hub in `hub_options` (e.g. from `GET /hubs` filtered by reachability or all hubs for demo).

### 0.5 — Rates endpoints

11. **Add `GET /rates`.**
    - Return list of `{crop_id, crop_name, rate}` using `load_crops()` and `load_current_rates()`.

12. **Add `GET /rates/cost`.**
    - Query: `crop_id`, `quantity_kg`, `action` ('give' | 'receive'). Return `{crop_id, quantity_kg, action, rate, earn? or cost?}`.

### 0.6 — Ledger endpoint

13. **Add `GET /ledger`.**
    - In new file `app/api/routes/ledger.py` or in `requests.py`: query param `node_id` (and optionally `hub_id`). Filter ledger entries, return list of `LedgerEntryResponse`.

### 0.7 — Register routes

14. **In `app/api/main.py`:**
    - Import and include routers for `requests` and `ledger` and `rates` (if in separate files). Ensure CORS allows the frontend origin (e.g. Vite dev server port).

**Phase 0 done when:** You can call `POST /requests`, `GET /requests?node_id=1`, `GET /nodes/1/balance`, `GET /rates`, `GET /rates/cost?...`, `GET /ledger?node_id=1`, and `POST /requests/{id}/select-hub` and `POST /requests/{id}/confirm` with the expected request/response shapes.

---

## Phase 1 — Frontend: API Plan Doc + Service Layer + Identity

**Goal:** API plan document exists; frontend has a typed MyFood API client and a way to get `node_id`.

### 1.1 — API plan document

1. Create or update `planning/myfood-implementation/API-PLAN.md` (or keep the API section in `IMPLEMENTATION.md`). Document: scope (MyFood consumer, one `node_id`), identity (see below), every endpoint (method, path, request/response), request lifecycle (submit → options_ready → select-hub → confirm), polling (e.g. poll `GET /requests?node_id=X` every 30s). Reference `app/api/models.py` and `app/api/routes/` for types.

### 1.2 — Identity decision and implementation

2. **Decide how MyFood gets `node_id`:**
   - **Option A (recommended for single app):** Reuse farmer identity. After a user registers a farm via `POST /nodes`, store `farm_id` in localStorage (e.g. key `mycelium:farm_id` or `myfood:node_id`). MyFood screen reads this; if missing, redirect to onboarding or a “Register” flow that calls `POST /nodes` and then stores the returned `farm_id`.
   - **Option B:** Separate “consumer” registration (e.g. `POST /consumers` that creates a node with no plot). Requires new backend endpoint and storage; document and implement if chosen.

3. **Implement identity in the app:**
   - Add a small context or hook, e.g. `NodeIdContext` or `useNodeId()`, that reads from localStorage and optionally validates against `GET /nodes/{id}/balance` (or `GET /nodes/{id}`). If no id or API returns 404, clear storage and redirect to landing/onboarding.
   - Document the chosen approach in the API plan.

### 1.3 — MyFood API service layer

4. **Create `app/frontend/src/services/myfood-api.ts`** (or `app/frontend/src/user/services/api.ts` if you prefer a single user app; the plan uses a dedicated MyFood module for clarity).
   - Base URL: `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'` (or the port your FastAPI runs on).
   - Define `ApiError` and a generic `request<T>(path, init)` that throws on non-ok response and returns `res.json()`.

5. **Add TypeScript types** matching backend: `RequestBody`, `RequestResponse`, `BalanceResponse`, `LedgerEntryResponse`, rate types, etc. Export them from the same file or from `types.ts`.

6. **Implement and export:**
   - `getBalance(nodeId: number)`
   - `listRequests(params: { node_id?: number; hub_id?: number; status?: string; type?: string })`
   - `submitRequest(body: RequestBody)`
   - `selectHub(requestId: number, hub_id: number)`
   - `confirmRequest(requestId: number, actual_quantity_kg: number)` (body type from backend)
   - `getRates()`
   - `getDeliveryCost(crop_id: number, quantity_kg: number, action: 'give' | 'receive')`
   - `getLedger(node_id: number)`
   - `getCrops()` and `getHubs()` (can delegate to existing API if present, or call same base URL).

7. **Rule:** No raw `fetch` in MyFood UI components; all calls go through this module.

**Phase 1 done when:** API plan doc exists; service layer compiles; one smoke test (e.g. in browser or a small test file) calls `getBalance(nodeId)` against the running backend and gets a valid response.

---

## Phase 2 — Frontend: MyFood Shell and Layout

**Goal:** A MyFood route renders the full wireframe layout with static/mock data.

### 2.1 — Routing

1. Install React Router if not present: `npm install react-router-dom`.

2. In `App.tsx`, add a router. Add a route for the MyFood screen (e.g. `/myfood` or `/food`). Decide whether the rest of the app (e.g. Homepage) stays at `/` or moves (e.g. `/` = Homepage, `/myfood` = MyFood). Document the chosen path.

### 2.2 — Layout components (wireframe-faithful)

3. **Topbar:** Create a component that matches `final-kits/myfood-mobile-wireframe.html` + `frontend-PRD/final/user-dashboard.html` nav: logo (MyCelium or MyFood), dot, avatar button, hamburger button. Use the same class names (e.g. `m-topbar`, `m-topbar-logo`, `m-topbar-name`, `m-topbar-dot`, `m-topbar-actions`).

4. **Hero:** Component with: “Hub Currency” label, balance value (e.g. “42 HC”), subtitle (“Earned through donations · This cycle”), and three stat chips (Consumed kg, Donated kg, Requests). Accept props for balance and the three stat values so you can plug mock data first.

5. **Tasks row:** A row with “Tasks” label and two buttons: “My Groceries” and “My Donations”. Wire to open bottom sheets later (Phase 4); for now they can be non-functional or log.

6. **Ticket list:** A container that renders a list of “ticket” items. Each ticket has: left stub (icon box), body (title, subtitle, instructions), right stub (status text: PENDING / APPROVED / COMPLETED). Use CSS classes from the wireframe (`.ticket`, `.ticket--pending`, `.ticket--approved`, `.ticket--completed`, `.ticket__stub-left`, `.ticket__body`, etc.). For Phase 2, pass 2–3 mock tickets (different statuses) as props.

7. **Bottom tabbar:** Same as user-dashboard footer: My Farm (or first tab), Add button, My Food (or second tab). Match class names and icons from the wireframe/dashboard.

### 2.3 — CSS

8. Copy the wireframe’s `:root` variables and all relevant class definitions (`.m-topbar`, `.m-hero`, `.hero-stats`, `.ticket`, `.m-tabbar`, `.bottom-sheet`, `.sheet-handle`, etc.) into the frontend (e.g. `app/frontend/src/index.css` or `app/frontend/src/myfood/myfood.css`). Ensure fonts (Inter, Space Grotesk) are loaded (e.g. via index.html or CSS import).

### 2.4 — MyFood page

9. Create a MyFood page component that composes: Topbar, Hero (mock balance + mock stats), Tasks row, Ticket list (mock tickets), Bottom tabbar. Render this on the MyFood route. No API calls yet.

**Phase 2 done when:** Navigating to `/myfood` (or chosen path) shows the full layout with static balance, static stats, and 2–3 mock tickets; buttons and tabs are present and styled.

---

## Phase 3 — Frontend: Tickets and Request State

**Goal:** Ticket list is driven by API; status mapping and hub picker/confirm work.

### 3.1 — Data binding

1. On the MyFood page, get `node_id` from context/hook (Phase 1). If missing, show “Please register” or redirect.

2. Call `listRequests({ node_id })` on mount. Store results in state. Map each request to a ticket variant:
   - `status === 'pending'` → pending ticket (grey, “Awaiting hub approval”).
   - `status === 'options_ready'` → approved ticket; show hub picker (list of hubs from `request.hub_options` or from `getHubs()` if backend doesn’t fill `hub_options`).
   - `status === 'matched'` → approved-style ticket with “Drop off by …” / instructions (use hub name/address from `getHubs()` by id if needed).
   - `status === 'confirmed'` → completed ticket.

3. Derive hero stats from balance + requests: e.g. “Consumed kg” = sum of confirmed receive quantities; “Donated kg” = sum of confirmed give quantities; “Requests” = count of non-confirmed requests (or total active). If backend doesn’t provide aggregates, compute client-side from `listRequests` and balance.

4. Call `getBalance(node_id)` and show balance in the Hero. Use the same node_id for both balance and requests.

### 3.2 — Hub picker and confirm

5. For a request with `options_ready`, render a hub picker (dropdown or list). On select, call `selectHub(requestId, hub_id)`. On success, refetch `listRequests` so the ticket moves to “matched”.

6. For a request with `status === 'matched'`, show a “Confirm” or “I’ve dropped off / picked up” control. On submit, call `confirmRequest(requestId, actual_quantity_kg)` (pre-fill with request’s `quantity_kg`, allow edit). On success, refetch `listRequests` and `getBalance` so UI updates.

**Phase 3 done when:** Tickets reflect live request status; user can select hub when options_ready and confirm when matched; balance and list update after confirm.

---

## Phase 4 — Frontend: My Groceries and My Donations Sheets

**Goal:** User can submit receive (groceries) and give (donations) requests from bottom sheets; cost/earn shown.

### 4.1 — My Groceries sheet

1. Build a bottom sheet component (or reuse one): title “My Groceries”, handle bar, body with: crop dropdown (options from `getCrops()`), quantity input (number, min 0.1, step 0.1).

2. When crop and quantity are set, call `getDeliveryCost(crop_id, quantity_kg, 'receive')` and show “Estimated cost: X HC”. Before submit, compare with current balance (from context/state); if balance < cost, show inline error and disable submit (backend will also return 422).

3. Submit: `submitRequest({ type: 'receive', node_id, crop_id, quantity_kg })` (no `hub_id`). On success, close sheet and refetch `listRequests` (and optionally balance). On 422 (e.g. insufficient balance), show API error message.

### 4.2 — My Donations sheet

4. Same structure: crop + quantity. Call `getDeliveryCost(crop_id, quantity_kg, 'give')` and show “Estimated earnings: X HC”. Submit: `submitRequest({ type: 'give', node_id, crop_id, quantity_kg })`. Close sheet and refetch on success.

### 4.3 — Polling

5. On the MyFood screen, start a polling interval (e.g. 30s): call `listRequests({ node_id })` and update state. Optionally poll `getBalance(node_id)` so the hero balance updates without refresh. Clear the interval on unmount.

**Phase 4 done when:** User can open My Groceries and My Donations sheets, see cost/earn, submit requests, and see new tickets appear; polling keeps status and balance up to date.

---

## Phase 5 — Frontend: Polish and Edge Cases

**Goal:** Robust UX with errors and empty/loading states.

### 5.1 — Error handling

1. **Insufficient balance (receive):** When backend returns 422 with a message, show it in the sheet (e.g. “Insufficient balance. Cost: X, balance: Y”).

2. **Network/API errors:** In the service layer or in components, catch failed fetch; show an inline error or toast with retry option. Do not leave the user with a blank screen.

### 5.2 — Empty and loading states

3. **Loading:** While fetching balance or requests, show skeleton placeholders or spinners in the Hero and ticket list (no flash of “0 HC” or empty list then pop-in if avoidable).

4. **Empty ticket list:** When `listRequests` returns `[]`, show an empty state message (e.g. “No requests yet. Request groceries or make a donation above.”).

### 5.3 — Optional (v1 or later)

5. **Ledger:** Add a section or route that calls `getLedger(node_id)` and displays transaction history (date, type, amount, balance_after, note).

6. **Desktop layout:** If required, add breakpoints so the same components render in a desktop layout (e.g. side-by-side or wider hero/ticket list).

**Phase 5 done when:** MyFood is usable end-to-end with clear error messages and loading/empty states; optional items are either implemented or explicitly deferred.

---

## Summary Checklist

- [ ] **Phase 0:** Backend has requests, ledger, rates, balance; all endpoints and storage and “options_ready” flow implemented and testable.
- [ ] **Phase 1:** API plan doc + identity + typed service layer; smoke test passes.
- [ ] **Phase 2:** MyFood route and full layout with mock data; CSS and components match wireframe.
- [ ] **Phase 3:** Tickets from API; hub picker and confirm working; balance and list update.
- [ ] **Phase 4:** Groceries and Donations sheets with cost/earn and submit; polling in place.
- [ ] **Phase 5:** Error handling, loading, empty states; optional ledger/desktop if in scope.
