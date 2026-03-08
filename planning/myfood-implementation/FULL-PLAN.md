# MyFood — Full Implementation Plan

Single plan to implement the MyFood consumer frontend. Backend is **done**; all work below is frontend in `app/frontend/`.

---

## Prerequisites

- **Node.js** and npm (or pnpm) for the frontend.
- **Python 3.x** for the backend (already implemented).
- **Backend:** Run from repo root:  
  `uvicorn app.backend.api.main:app --reload --host 0.0.0.0 --port 8000`  
  (or use the project’s existing run script if any). API base URL for frontend: `http://localhost:8000` (or set `VITE_API_BASE_URL`).

---

## Backend (Already Implemented)

**Location:** `app/backend/api/`. All MyFood endpoints exist and are registered in `app/backend/api/main.py`.

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/nodes/{node_id}/balance` | HC balance, crops_on_hand, crops_lifetime |
| POST | `/requests` | Create give/receive request |
| GET | `/requests` | List requests (`?node_id=`, etc.) |
| GET | `/requests/{request_id}` | Single request |
| POST | `/requests/{request_id}/select-hub` | Set hub when options_ready |
| POST | `/requests/{request_id}/confirm` | Confirm with actual_quantity_kg |
| GET | `/rates` | Per-crop rates |
| GET | `/rates/cost` | Cost (receive) or earn (give) for crop + quantity + action |
| GET | `/ledger` | Transaction history (`?node_id=`) |
| GET | `/hubs` | All hubs |
| GET | `/crops` | All crops |

**Types:** See `app/backend/api/models.py` — `RequestBody`, `RequestResponse`, `BalanceResponse`, `ConfirmBody`, `ConfirmResponse`, `LedgerEntryResponse`, etc. Frontend types must match these.

**Request lifecycle:** submit (pending) → engine sets `options_ready` (background tick in main.py) → user selects hub (`select-hub`) → user confirms (`confirm`).

---

## Phase 1 — API Doc, Identity, Service Layer

**Goal:** One source of truth for the API; frontend has a typed MyFood client and a way to get `node_id`.

### 1.1 — API plan document

1. Create or update `planning/myfood-implementation/API-PLAN.md` (or keep the API section in `IMPLEMENTATION.md`). Include:
   - Scope: MyFood consumer app, identity = one `node_id`.
   - How `node_id` is obtained (Phase 1.2).
   - Every endpoint: method, path, request/response (reference `app/backend/api/models.py`).
   - Lifecycle: submit → options_ready → select-hub → confirm.
   - Polling: e.g. poll `GET /requests?node_id=X` every 30s on the MyFood screen.

### 1.2 — Identity

2. **Decide how MyFood gets `node_id`:**
   - **Option A (recommended):** Reuse farmer identity. After registration via `POST /nodes`, store returned `farm_id` in localStorage (e.g. `myfood:node_id` or `mycelium:farm_id`). MyFood screen reads it; if missing, redirect to onboarding or a simple “Register” flow that calls `POST /nodes` and stores the id.
   - **Option B:** Separate consumer registration (new backend endpoint). Only if product requires consumer-only users.

3. **Implement in the app:**
   - Add a context or hook, e.g. `NodeIdContext` / `useNodeId()`, that:
     - Reads `node_id` from localStorage.
     - Optionally validates with `GET /nodes/{id}/balance` (or `GET /nodes/{id}`); on 404 or missing id, clear storage and redirect to landing/onboarding.
   - Document the chosen approach in the API plan.

### 1.3 — MyFood API service layer

4. **Create `app/frontend/src/services/myfood-api.ts`.**
   - Base URL: `const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'`.
   - Define `ApiError` (e.g. `status`, `message`) and `async function request<T>(path: string, init?: RequestInit): Promise<T>` that:
     - Uses `fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...init })`.
     - If `!res.ok`, reads `res.json().catch(() => ({}))` for `detail`, throws `new ApiError(res.status, detail?.detail ?? res.statusText)`.
     - Returns `res.json()`.

5. **Add TypeScript types** matching `app/backend/api/models.py`:  
   `RequestBody`, `RequestResponse`, `BalanceResponse`, `ConfirmBody`, `ConfirmResponse`, `LedgerEntryResponse`, and rate response shapes (list of `{ crop_id, crop_name, rate }`, cost response with `earn?` / `cost?`). Export from this file or from `app/frontend/src/types/myfood.ts`.

6. **Implement and export:**
   - `getBalance(nodeId: number)` → `request<BalanceResponse>(\`/nodes/${nodeId}/balance\`)`
   - `listRequests(params?: { node_id?: number; hub_id?: number; status?: string; type?: string })` → build query string, `request<RequestResponse[]>(\`/requests?${qs}\`)`
   - `submitRequest(body: RequestBody)` → `request<RequestResponse>('/requests', { method: 'POST', body: JSON.stringify(body) })`
   - `getRequest(requestId: number)` → `request<RequestResponse>(\`/requests/${requestId}\`)`
   - `selectHub(requestId: number, hub_id: number)` → `request<SelectHubResponse>(\`/requests/${requestId}/select-hub\`, { method: 'POST', body: JSON.stringify({ hub_id }) })`
   - `confirmRequest(requestId: number, actual_quantity_kg: number)` → `request<ConfirmResponse>(\`/requests/${requestId}/confirm\`, { method: 'POST', body: JSON.stringify({ actual_quantity_kg }) })`
   - `getRates()` → `request<RateItem[]>('/rates')`
   - `getDeliveryCost(crop_id: number, quantity_kg: number, action: 'give' | 'receive')` → `request<RateCostResponse>(\`/rates/cost?crop_id=${crop_id}&quantity_kg=${quantity_kg}&action=${action}\`)`
   - `getLedger(node_id: number)` → `request<LedgerEntryResponse[]>(\`/ledger?node_id=${node_id}\`)`
   - `getCrops()` → `request<Crop[]>('/crops')`
   - `getHubs()` → `request<Hub[]>('/hubs')`

7. **Rule:** No raw `fetch` in MyFood UI components; all API access via this module.

**Done when:** API plan doc exists; identity is decided and implemented (context/hook + localStorage); `myfood-api.ts` compiles and a smoke test (e.g. `getBalance(1)` in browser or a small test) succeeds against the running backend.

---

## Phase 2 — MyFood Shell and Layout

**Goal:** A MyFood route renders the full wireframe layout with static/mock data.

### 2.1 — Routing

1. Install React Router if not present:  
   `cd app/frontend && npm install react-router-dom`

2. In `app/frontend/src/App.tsx`, add a router (e.g. `BrowserRouter`), and routes:
   - `/` → existing Homepage (or landing).
   - `/myfood` → MyFood page (new component).
   Decide and document the final path (e.g. `/myfood`).

### 2.2 — Layout components (wireframe-faithful)

Reference: `final-kits/myfood-mobile-wireframe.html` and `frontend-PRD/final/user-dashboard.html`.

3. **Topbar** — Create `app/frontend/src/components/myfood/MobileTopbar.tsx` (or under `layout/`):
   - Logo (MyCelium or MyFood), accent dot, avatar button, hamburger button.
   - Class names: `m-topbar`, `m-topbar-logo`, `m-topbar-name`, `m-topbar-dot`, `m-topbar-actions`.

4. **Hero** — Create `app/frontend/src/components/myfood/MyFoodHero.tsx`:
   - “Hub Currency” label, balance value (e.g. “42 HC”), subtitle (“Earned through donations · This cycle”), three stat chips (Consumed kg, Donated kg, Requests).
   - Props: `balance: number`, `consumedKg?: number`, `donatedKg?: number`, `requestCount?: number` so you can pass mock data.

5. **Tasks row** — Create `app/frontend/src/components/myfood/TasksRow.tsx`:
   - “Tasks” label and two buttons: “My Groceries” and “My Donations”.
   - Accept `onGroceriesClick` and `onDonationsClick` (for Phase 4; Phase 2 can no-op or log).

6. **Ticket list** — Create `app/frontend/src/components/myfood/TicketList.tsx` and `TicketItem.tsx`:
   - Each ticket: left stub (icon box), body (title, subtitle, instructions), right stub (PENDING / APPROVED / COMPLETED).
   - Use wireframe classes: `.ticket`, `.ticket--pending`, `.ticket--approved`, `.ticket--completed`, `.ticket__stub-left`, `.ticket__body`, `.ticket__stub-right`, etc.
   - For Phase 2, pass mock tickets (array of objects with title, subtitle, instructions, status).

7. **Bottom tabbar** — Create `app/frontend/src/components/myfood/BottomTabBar.tsx`:
   - Same as user-dashboard footer: first tab (e.g. My Farm), Add button, second tab (e.g. My Food). Same class names and icons as wireframe/dashboard.

### 2.3 — CSS

8. Copy wireframe CSS into the app:
   - From `final-kits/myfood-mobile-wireframe.html`: `:root` variables and all classes used by the components above (`.m-topbar`, `.m-hero`, `.hero-stats`, `.ticket`, `.m-tabbar`, `.bottom-sheet`, `.sheet-handle`, `.sheet-title`, `.sheet-body`, `.input`, `.input-label`, etc.).
   - Add to `app/frontend/src/index.css` or create `app/frontend/src/styles/myfood.css` and import it.
   - Ensure fonts (Inter, Space Grotesk) are loaded (e.g. in `index.html` or CSS).

### 2.4 — MyFood page

9. Create `app/frontend/src/pages/MyFoodPage.tsx`:
   - Compose: MobileTopbar, MyFoodHero (mock balance + mock stats), TasksRow, TicketList (mock tickets), BottomTabBar.
   - No API calls yet. Render this component on the `/myfood` route.

**Done when:** Navigating to `/myfood` shows the full layout with static balance, static stats, and 2–3 mock tickets; all buttons and tabs are present and styled.

---

## Phase 3 — Tickets and Request State

**Goal:** Ticket list is driven by the API; status mapping and hub picker/confirm work.

### 3.1 — Data binding

1. In `MyFoodPage.tsx`, get `node_id` from the identity context/hook. If missing, show “Please register” or redirect to onboarding/landing.

2. On mount, call `listRequests({ node_id })` and `getBalance(node_id)`. Store in state (e.g. `requests`, `balance`). Show loading state while fetching.

3. Map each request to a ticket variant:
   - `status === 'pending'` → pending ticket (“Awaiting hub approval”).
   - `status === 'options_ready'` → approved-style ticket; show hub picker (use `request.hub_options` or fetch hubs via `getHubs()` and filter if needed).
   - `status === 'matched'` → approved-style with “Drop off by …” / instructions (hub name/address from `getHubs()` by id).
   - `status === 'confirmed'` → completed ticket.

4. Hero: show `balance.currency_balance` as HC. Derive stats from balance + requests: e.g. Consumed kg = sum of confirmed `receive` quantities; Donated kg = sum of confirmed `give` quantities; Requests = count of non-confirmed (or active) requests.

### 3.2 — Hub picker and confirm

5. For a request with `options_ready`, render a hub picker (dropdown or list of hubs from `request.hub_options` or `getHubs()`). On select, call `selectHub(requestId, hub_id)`. On success, refetch `listRequests({ node_id })` so the ticket updates to “matched”.

6. For `status === 'matched'`, show a “Confirm” or “I’ve dropped off / picked up” control. On submit, call `confirmRequest(requestId, actual_quantity_kg)` (pre-fill with `request.quantity_kg`, allow edit). On success, refetch `listRequests` and `getBalance`.

**Done when:** Tickets reflect live request status; user can select hub when options_ready and confirm when matched; balance and list update after confirm.

---

## Phase 4 — My Groceries and My Donations Sheets

**Goal:** User can submit receive (groceries) and give (donations) from bottom sheets; cost/earn shown.

### 4.1 — My Groceries sheet

1. Create a reusable bottom sheet component (e.g. `app/frontend/src/components/myfood/BottomSheet.tsx`) with: backdrop, panel, handle bar, title, body slot. Control open/close via props or state.

2. Create “My Groceries” sheet content: crop dropdown (options from `getCrops()`), quantity input (number, min 0.1, step 0.1). When crop and quantity are set, call `getDeliveryCost(crop_id, quantity_kg, 'receive')` and show “Estimated cost: X HC”. Before submit, if current balance < cost, show inline error and disable submit. Submit: `submitRequest({ type: 'receive', node_id, crop_id, quantity_kg })` (no `hub_id`). On success, close sheet and refetch `listRequests` (and balance). On 422 (e.g. insufficient balance), show API error message in the sheet.

### 4.2 — My Donations sheet

3. Same structure: crop + quantity. Show `getDeliveryCost(crop_id, quantity_kg, 'give')` as “Estimated earnings: X HC”. Submit: `submitRequest({ type: 'give', node_id, crop_id, quantity_kg })`. Close sheet and refetch on success.

### 4.3 — Polling

4. On the MyFood screen, start an interval (e.g. 30s): call `listRequests({ node_id })` and update state. Optionally poll `getBalance(node_id)` for the hero. Clear interval on unmount.

**Done when:** User can open My Groceries and My Donations sheets, see cost/earn, submit requests, and see new tickets; polling keeps status and balance up to date.

---

## Phase 5 — Polish and Edge Cases

**Goal:** Robust UX with errors and empty/loading states.

### 5.1 — Error handling

1. **Insufficient balance (receive):** When the API returns 422, show the backend message in the sheet (e.g. “Insufficient balance. Cost: X, balance: Y”).

2. **Network/API errors:** Catch failed requests in the service or in components; show an inline error or toast with retry. Avoid a blank or stuck screen.

### 5.2 — Empty and loading states

3. **Loading:** While fetching balance or requests, show skeleton placeholders or spinners in the Hero and ticket list.

4. **Empty ticket list:** When `listRequests` returns `[]`, show an empty state message (e.g. “No requests yet. Request groceries or make a donation above.”).

### 5.3 — Optional (v1 or later)

5. **Ledger:** Add a section or route that calls `getLedger(node_id)` and displays transaction history.

6. **Desktop layout:** Add breakpoints so the same components work on desktop if required.

**Done when:** MyFood is usable end-to-end with clear errors and loading/empty states; optional items are implemented or explicitly deferred.

---

## Summary Checklist

- [ ] **Phase 1:** API plan doc; identity (context/hook + localStorage); `app/frontend/src/services/myfood-api.ts` with all calls and types; smoke test passes.
- [ ] **Phase 2:** React Router; `/myfood` route; Topbar, Hero, TasksRow, TicketList, BottomTabBar; wireframe CSS; MyFoodPage with mock data.
- [ ] **Phase 3:** Tickets from API; hub picker and confirm; balance and list update.
- [ ] **Phase 4:** My Groceries and My Donations sheets with cost/earn and submit; polling.
- [ ] **Phase 5:** Error handling, loading, empty states; optional ledger/desktop.

---

## File Summary

| Area | Files to create or touch |
|------|---------------------------|
| API doc | `planning/myfood-implementation/API-PLAN.md` or section in IMPLEMENTATION.md |
| Identity | Context/hook (e.g. `app/frontend/src/context/NodeIdContext.tsx` or `hooks/useNodeId.ts`) |
| Service | `app/frontend/src/services/myfood-api.ts`, optionally `src/types/myfood.ts` |
| Router | `app/frontend/src/App.tsx` |
| Layout | `app/frontend/src/components/myfood/MobileTopbar.tsx`, `MyFoodHero.tsx`, `TasksRow.tsx`, `TicketList.tsx`, `TicketItem.tsx`, `BottomTabBar.tsx` |
| Sheets | `app/frontend/src/components/myfood/BottomSheet.tsx`, Groceries/Donations sheet content components |
| Page | `app/frontend/src/pages/MyFoodPage.tsx` |
| Styles | `app/frontend/src/index.css` or `src/styles/myfood.css` |

Backend remains in `app/backend/api/`; no backend tasks in this plan.
