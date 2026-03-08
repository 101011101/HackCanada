# MyFood API Plan

- **Scope:** MyFood consumer app. Identity = one `node_id` (same as farm id; reuse after `POST /nodes` registration).
- **Base URL:** `VITE_API_BASE_URL` or `http://localhost:8000`. Backend: `app/backend/api/main.py`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/nodes/{node_id}/balance` | HC balance, crops_on_hand, crops_lifetime |
| POST | `/requests` | Create give/receive request |
| GET | `/requests` | List (`?node_id=`, `?status=`, etc.) |
| GET | `/requests/{id}` | Single request |
| POST | `/requests/{id}/select-hub` | Set hub when options_ready |
| POST | `/requests/{id}/confirm` | Confirm with actual_quantity_kg |
| GET | `/rates` | Per-crop rates |
| GET | `/rates/cost` | Cost (receive) or earn (give) |
| GET | `/ledger` | History (`?node_id=`) |
| GET | `/hubs` | All hubs |
| GET | `/crops` | All crops |

## Request lifecycle

1. Submit → `status: pending`
2. Engine sets `options_ready` and fills `hub_options` (background tick)
3. User selects hub → `POST /requests/{id}/select-hub` → `status: matched`
4. User confirms → `POST /requests/{id}/confirm` → `status: confirmed`; balance and ledger updated

## Identity

- MyFood uses the same node as the farmer. After `POST /nodes` (onboarding), store returned `farm_id` in localStorage as `myfood:node_id`. Frontend reads it via `NodeIdContext` / `useNodeId()`.

## Polling

- On the MyFood screen, poll `GET /requests?node_id=X` every 30s. Optionally poll `GET /nodes/{node_id}/balance` to refresh the hero.
