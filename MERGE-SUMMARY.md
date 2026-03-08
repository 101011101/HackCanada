# Merge summary — MyHub Admin, Grocery Hub Selection, and Request Visibility

## Overview

- **MyHub Admin**: Hub staff can view transactions and ledger for their hub, and approve or reject matched requests.
- **Grocery (My Food)**: Users can choose nearest hub; engine ensures at least one viable hub when possible; API errors are shown.
- **Request visibility**: MyHub sees both requests at their hub and requests awaiting hub selection (options_ready with this hub in hub_options).

---

## Backend

| File | Change |
|------|--------|
| `app/backend/api/routes/hubs.py` | Added `GET /farms` for admin node lookups (id, name). |
| `app/backend/api/routes/requests.py` | `GET /requests?hub_id=X` now returns requests **at** hub X **or** options_ready with X in hub_options. Added `_request_at_or_potential_for_hub()`. |
| `app/backend/engine/transaction_engine.py` | Fallback when no candidates: add nearest hub that passes constraints (so select-hub can succeed). Only add options_ready when constraints pass. |

---

## Frontend

| File | Change |
|------|--------|
| `app/frontend/src/AdminDashboard.tsx` | Added Hub section and MyHub nav; when activePage is `myhub`, render `MyHubAdminView` (no main topbar). |
| `app/frontend/src/admin/MyHubAdminView.tsx` | **New.** Hub selector, Transactions and Currency Ledger tabs; transaction table with Approve/Reject for matched; approve modal (actual qty); reject confirm; node balances and recent ledger from `getLedger()`. |
| `app/frontend/src/services/myfood-api.ts` | `getLedger(node_id?)` optional for admin all-entries; `cancelRequest(id)`; `getFarms()` and `FarmBasic` type. |
| `app/frontend/src/pages/MyFoodPage.tsx` | `onSelectHub` now surfaces API error message (e.g. insufficient stock) instead of generic "Failed to select hub". |
| `app/frontend/src/components/myfood/TicketList.tsx` | Hub options sorted by distance; "Choose nearest hub" label; first option "Nearest: Name (x km)"; `getHubOptions` takes `hubNames`, returns items with `distance_km`. |

---

## Data files (optional for merge)

- `app/data/farms.json`, `hub_inventory.json`, `ledger.json`, `requests.json` — modified by local runs. Prefer not merging these unless they are seed/demo data; keep repo-agnostic or reset to a clean seed state.

---

## Routes / entry points

- **Admin**: `/admin` → Admin Dashboard; sidebar **MyHub** → MyHub admin (hub selector, Transactions, Currency Ledger).
- **My Food**: `/myfood` → Groceries sheet submits receive request; TicketList shows "Choose nearest hub" when options_ready; user selects hub → select-hub; hub sees request in MyHub when matched or when options_ready with that hub in hub_options.

---

## Checks before merge

- [x] Frontend build: `npm run build` (app/frontend)
- [x] No lint errors in modified TS/TSX
- [x] No console.log / TODO in frontend src
- [x] `.env` remains gitignored
