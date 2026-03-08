# MyFood — Gap Analysis

This document lists everything that is **missing** or **unclear** relative to the MyFood implementation plan. Gaps are grouped by area and labeled by severity.

---

## 1. Backend Gaps (Critical)

The current API in this repo (`app/api/`) does **not** implement the MyFood transaction flow. The implementation plan and `frontend-PRD/implementation/01-api-service-layer.md` refer to endpoints that do not exist here.

| Gap | Severity | Description |
|-----|----------|-------------|
| **No `/requests`** | Critical | No `POST /requests`, `GET /requests`, `POST /requests/{id}/select-hub`, or `POST /requests/{id}/confirm`. MyFood cannot submit or list give/receive requests. |
| **No `/ledger`** | High | No `GET /ledger?node_id=`. Transaction history cannot be shown. |
| **No `/rates`** | Critical | No `GET /rates` or `GET /rates/cost`. Cost (receive) and earn (give) cannot be computed in the frontend. |
| **No balance endpoint** | Critical | No `GET /nodes/{node_id}/balance`. Hero cannot show HC balance or crops_on_hand/crops_lifetime. |
| **No request/ledger models** | Critical | `app/api/models.py` has no `RequestBody`, `RequestResponse`, `BalanceResponse`, `ConfirmBody`, `LedgerEntryResponse`, or rate response types. |
| **No request/ledger storage** | Critical | `app/api/storage.py` has no `load_requests`/`save_requests` or `load_ledger`/`save_ledger`. No `data/requests.json` or `data/ledger.json`. |
| **No currency on farms** | Critical | Farms in storage/engine do not have `currency_balance` (or equivalent). No way to debit/credit for receive/give. |
| **No rates storage** | Critical | No `load_current_rates()` or equivalent; no seed data for per-crop rates. |
| **No “engine” for options_ready** | High | Nothing transitions a request from `pending` to `options_ready` or fills `hub_options`. Backend must either do this synchronously on submit or via a separate process/cron. |

**Conclusion:** Phase 0 in `FULL-PLAN.md` is required before any MyFood frontend can work. The backend must be extended with requests, ledger, rates, and balance as specified there.

---

## 2. Frontend Gaps (Critical)

| Gap | Severity | Description |
|-----|----------|-------------|
| **No MyFood route or page** | Critical | `App.tsx` currently only renders `Homepage`. No route for `/myfood` (or equivalent) and no MyFood page component. |
| **No API service layer** | Critical | No `services/myfood-api.ts` (or equivalent). No typed `getBalance`, `listRequests`, `submitRequest`, etc. |
| **No identity/context** | Critical | No persistence of `node_id` (e.g. localStorage) and no context or hook (e.g. `useNodeId`) for the MyFood screen to know which node to use. |
| **No wireframe components** | Critical | No Topbar, Hero, Tasks row, Ticket list, or Bottom tabbar components that match `final-kits/myfood-mobile-wireframe.html` and `frontend-PRD/final/user-dashboard.html`. |
| **No wireframe CSS** | High | Wireframe CSS (variables, `.m-topbar`, `.m-hero`, `.ticket`, `.m-tabbar`, sheets) is not copied into the app. Layout and tickets will not match design without it. |
| **No bottom sheets** | High | No reusable bottom sheet component for “My Groceries” and “My Donations” flows. |
| **No React Router** | High | No routing; cannot have a dedicated MyFood URL without adding React Router (or similar) and wiring routes. |
| **No loading/empty/error states** | Medium | No defined patterns for loading skeletons, empty ticket list, or API error display in the MyFood flow. |

---

## 3. Data and Config Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| **Rates source** | High | Where do per-crop rates come from? Not in current `app/api/data/` or `config.json`. Need either a new `rates.json` or a section in config and logic to load it. |
| **Hub options shape** | Medium | When a request becomes `options_ready`, what does `hub_options` contain? (e.g. `[{ hub_id, hub_name, distance_km? }]`). Backend and frontend must agree. |
| **Seed data for demo** | Low | For a smooth demo, seed at least one farm with a non-zero `currency_balance` and optionally a few requests in different statuses. Not strictly required for implementation but useful for testing. |

---

## 4. Documentation and Plan Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| **API path references** | Medium | Some docs (e.g. `IMPLEMENTATION.md`) refer to `app/backend/api/`; in this repo the API lives under `app/api/`. Update references to avoid confusion. |
| **Identity not decided** | High | How MyFood obtains `node_id` is not decided: reuse farmer `farm_id` from onboarding vs. separate consumer registration. This affects both backend (e.g. need for `POST /consumers`) and frontend (where to store id, when to redirect). |
| **Exact route path** | Low | Choice of `/myfood` vs. `/food` vs. another path is not fixed; should be documented once chosen. |
| **Base URL and env** | Low | `VITE_API_BASE_URL` (or equivalent) and the port the FastAPI app runs on (e.g. 8000) should be documented so frontend and backend align. |

---

## 5. Cross-Cutting / Product Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| **Consumer vs. farmer persona** | Medium | Is the MyFood user the same as the farmer (one node, can both grow and request/donate) or a different persona (consumer-only node)? Affects onboarding and whether “consumer registration” is needed. |
| **Engine timing** | Medium | When does a request move from `pending` to `options_ready`? Real-time after submit (synchronous), or delayed (cron/job)? Affects UX (e.g. “We’re finding hubs…” vs. immediate hub list). |
| **Quantity validation** | Low | Min/max and decimal rules for quantity_kg (e.g. 0.1–1000, 1 decimal place) are not specified; backend and frontend should align. |

---

## 6. Gap Summary by Phase

| Phase | Main gaps |
|-------|-----------|
| **Phase 0 (Backend)** | All of Section 1: requests, ledger, rates, balance, models, storage, currency on farms, options_ready logic. |
| **Phase 1 (Service + identity)** | No service module; no identity store/context; API plan doc references wrong path; identity strategy not decided. |
| **Phase 2 (Shell)** | No route, no layout components, no wireframe CSS. |
| **Phase 3 (Tickets)** | Depends on Phase 0 and 1; hub_options shape and hub list source (request vs. GET /hubs) to be clarified. |
| **Phase 4 (Sheets)** | Depends on Phase 0 and 1; quantity validation and error copy to be aligned with backend. |
| **Phase 5 (Polish)** | No shared loading/empty/error patterns for MyFood. |

---

## 7. Recommended Order to Close Gaps

1. **Backend (Phase 0):** Implement requests, ledger, rates, balance, and options_ready flow so the API contract exists and is testable (e.g. via curl or Postman).
2. **Decide identity:** Document whether MyFood reuses farmer `farm_id` or uses a separate consumer registration; update API plan and FULL-PLAN accordingly.
3. **Frontend service + identity (Phase 1):** Add MyFood API client and node_id context/hook; fix doc paths to `app/api/`.
4. **Frontend shell (Phase 2):** Add route, layout components, and wireframe CSS.
5. **Tickets and sheets (Phases 3–4):** Wire to API; clarify hub_options and quantity rules as needed.
6. **Polish (Phase 5):** Add loading, empty, and error handling; optional ledger and desktop.

Closing the **critical** backend and frontend gaps (Sections 1 and 2) is required before the MyFood screen can function end-to-end.
