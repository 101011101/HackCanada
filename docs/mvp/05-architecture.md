# System Architecture

How all the pieces connect, where they live, and what each one does.

---

## Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S DEVICE                            │
│                                                                 │
│   React App (TypeScript)                                        │
│   ├── Farmer UI — onboarding, instructions, wallet             │
│   ├── Community UI — find food, hub map, spend currency        │
│   └── Admin UI — network map, coverage report, hub mgmt        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS / JSON
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API SERVER                               │
│                                                                 │
│   FastAPI (Python)                                              │
│   ├── POST /nodes          — register new farm                 │
│   ├── POST /nodes/:id/data — submit soil readings              │
│   ├── POST /optimize       — trigger epoch ILP                 │
│   ├── GET  /assignments    — get all current assignments       │
│   ├── GET  /nodes/:id      — get one farm's bundle             │
│   ├── GET  /coverage       — network coverage report           │
│   ├── GET  /hubs           — hub locations + inventory         │
│   └── POST /deliveries     — confirm food delivered to hub     │
└───────┬───────────────────────────┬────────────────────────────┘
        │                           │
        ▼                           ▼
┌───────────────────┐   ┌───────────────────────────────────────┐
│    OPTIMIZER      │   │              DATABASE                  │
│                   │   │                                        │
│  Python Engine    │   │  PostgreSQL                           │
│  ├── scorer.py    │   │  ├── farms        (nodes + soil data) │
│  ├── router.py    │   │  ├── crops        (definitions)       │
│  ├── scheduler.py │   │  ├── hubs         (locations, demand) │
│  ├── optimizer.py │   │  ├── assignments  (current + history) │
│  ├── packager.py  │   │  ├── yield_history(actual harvests)   │
│  └── reporter.py  │   │  ├── deliveries   (hub transactions)  │
│                   │   │  └── currency     (ledger)            │
└───────────────────┘   └───────────────────────────────────────┘
        ▲
        │  fires every epoch (e.g. every 4 weeks)
┌───────────────────┐
│     SCHEDULER     │
│                   │
│  Cron job / Celery│
│  └── triggers ILP │
└───────────────────┘
```

---

## Where Each Piece Lives

| Component | Technology | Runs On |
|---|---|---|
| React frontend | React + TypeScript | Browser (CDN / Vercel) |
| API server | FastAPI (Python) | Cloud server (Railway / Render / EC2) |
| Optimizer engine | Pure Python | Same server as API |
| Database | PostgreSQL | Managed DB (Supabase / RDS) |
| Epoch scheduler | Cron / Celery | Same server as API |

---

## How a Request Flows

### New farmer joins

```
1. Farmer fills out form in React app
2. React → POST /nodes  { soil conditions, location, plot size, tools }
3. API saves farm to PostgreSQL
4. API pulls current network state from DB
5. API calls greedy_insert() from optimizer engine
6. API saves assignment to DB
7. API returns instruction bundle (what to grow, how much, why)
8. React displays the farmer's instructions
```

### Epoch fires (every 4 weeks)

```
1. Cron job triggers → POST /optimize
2. API pulls full network state from DB (all farms, locked status, targets)
3. API calls run_ilp() from optimizer engine
4. Optimizer returns new assignments for all available farms
5. API writes assignments back to DB
6. Next time farmers open the app, they see updated instructions
```

### Farmer submits soil readings

```
1. Farmer enters readings (or photo → OCR) in app
2. React → POST /nodes/:id/data  { pH, moisture, temp, humidity }
3. API updates farm record in DB
4. Digital twin is now current
5. Next epoch will use the updated readings
```

### Community member finds food

```
1. Member opens app → "Find Food"
2. React → GET /hubs  (with user location)
3. API returns nearby hubs with current inventory
4. Member selects food → POST /orders
5. API reserves inventory, issues pickup code
6. Member collects at hub, hub confirms
7. Currency transferred, inventory updated in DB
```

---

## What Each Component Is Responsible For

**React App**
- All user interaction
- Displays instructions, hub maps, coverage visualization
- Makes API calls, renders responses
- Knows nothing about optimization logic

**FastAPI Server**
- Validates all incoming data
- Orchestrates: reads from DB, calls optimizer, writes to DB
- Authentication and rate limiting
- Never stores state itself — DB is the source of truth

**Optimizer Engine**
- Pure computation — no DB calls, no HTTP
- Takes data in, returns assignments out
- Completely stateless — same inputs always produce same output
- Can be tested and run independently of everything else

**PostgreSQL**
- Single source of truth for all persistent state
- Farms, crops, hubs, assignments, yield history, currency ledger
- The API reads from here before every optimizer call
- The API writes back after every optimizer call

**Cron / Celery**
- Fires the epoch trigger on a schedule
- No logic — just pokes the API at the right time

---

## MVP vs Full System

For the hackathon demo, the scope is:

| Component | MVP | Full |
|---|---|---|
| Optimizer engine | Full (this is the core) | Same |
| FastAPI server | Minimal — just enough to serve the demo | Full endpoint suite |
| React app | Simple dashboard showing assignments + coverage | Full farmer + community + admin UX |
| PostgreSQL | Optional — can use in-memory data for demo | Required |
| Cron scheduler | Simulated — trigger manually in demo | Automated |
| Currency / hub settlement | Illustrated only | Built |

The optimizer engine is built fully. Everything else is the minimum needed to show it working.
