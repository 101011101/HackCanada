# Tailscale Integration Plan

**The thesis:** MyCelium is a network of nodes. Tailscale is a network of nodes. The physical infrastructure mirrors the conceptual one — every operator device is simultaneously a node in the Tailscale tailnet and a node in the MyCelium network. Tailscale is not infrastructure bolted on — it IS the operator identity and access layer of the product.

---

## Architecture Overview

```
                        TAILSCALE TAILNET
                        (private overlay network)
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   [Admin laptop]     [Teammate laptop]   [Hub operator tablet]
   tag:coordinator    tag:developer        tag:hub
          │                   │                   │
          └───────────────────┴───────────────────┘
                    all encrypted, peer-to-peer
                              │
                    Central API Server
                    (runs on admin laptop)
                              │
                    Tailscale Funnel (public)
                              │
                    ┌─────────┴──────────┐
              [Farmer phone]       [Judge laptop]
              Supabase OAuth       public demo
```

---

## Three Tiers, Three Access Paths

| Role | Who | Access Path | Auth |
|---|---|---|---|
| Farmer | Urban farmer, phone | Public Funnel URL | Supabase Google OAuth |
| Hub Operator | School, community leader | Tailscale tailnet (ACL restricted) | Tailscale identity |
| Master Admin | Us | Tailscale tailnet (full access) | Tailscale identity |

Farmers never install Tailscale — they use the app like any normal website. Operators install Tailscale once; joining the tailnet IS their credential. No separate login system for operators.

---

## Challenge Requirements

### ✅ Minimum

| Requirement | Implementation |
|---|---|
| 2+ devices in tailnet | Every team member runs `tailscale up`, same org |
| Restrict one service with ACL | Only `tag:coordinator` can `POST /optimize` |
| Public endpoint | `tailscale funnel 8000` → farmer app + judge demo URL |

### ⭐ Advanced

| Feature | Implementation |
|---|---|
| Tailscale identity in the app | Read `Tailscale-User-Login` / `Tailscale-User-Name` headers — operators are auto-identified, zero login screen |

---

## User Flows

### Farmer (Public, Phone, Supabase Auth)

```
First visit:
1. Opens https://ray-laptop.tail-xyz.ts.net (Funnel URL)
2. Clicks "Sign in with Google" → Supabase OAuth flow
3. Returns to app, now authenticated (user.id from Supabase)
4. Fills out farm form: name, plot size, soil readings, location
5. POST /nodes  { ...farm_data, supabase_user_id: user.id }
6. Server saves farm tied to their Google account
7. Returns instruction bundle: "Grow spinach, 4kg, deliver to Hub 3"

Return visit (any device):
1. Opens the URL
2. Supabase auto-restores session (or one-click Google sign-in)
3. GET /nodes?user_id=... → their farm and instructions load
4. No farm_id to remember, no bookmark needed
```

### Hub Operator (Tailscale, Tablet)

```
Onboarding (one time):
1. Admin sends them a Tailscale invite link
2. They install Tailscale, accept invite → on the tailnet
3. That's it. No account creation, no password.

Every visit:
1. Opens https://ray-laptop.tail-xyz.ts.net/hub-dashboard
2. No login screen — Tailscale identity detected automatically
3. Server reads: Tailscale-User-Login: principal@school.edu
4. ACL restricts them to /hubs/{their_hub}/* only
5. See current hub inventory, expected deliveries, confirm arrivals
6. Confirm delivery → POST /deliveries → triggers currency credit to farmer

Leaving the network:
1. Admin removes them from tailnet
2. Access instantly revoked — no account to delete, no tokens to expire
```

### Master Admin (Tailscale, Full Access)

```
1. Already on the tailnet (it's our laptop)
2. Opens https://ray-laptop.tail-xyz.ts.net/admin
3. No login — recognized automatically as coordinator
4. Sees full nodal network visualization — every farm, every hub
5. Can trigger POST /optimize (only coordinator tag can do this)
6. Manages hub operator access via Tailscale admin console
```

---

## What "Joining the Network" Means Per Role

- **Farmer** → signs up with Google via Supabase, submits farm data
- **Hub Operator** → accepts a Tailscale invite link. That IS the onboarding.
- **Admin** → already on the tailnet. No action needed.

---

## Setup (Implementation Order)

### Step 1: Everyone Joins the Tailnet (~5 min)
```bash
tailscale up
# log in with same org/account
tailscale status
# ray-laptop       100.64.0.1   tag:coordinator
# alice-laptop     100.64.0.2   tag:developer
```

### Step 2: Run and Expose the API (~2 min)
```bash
uvicorn app.api.main:app --host 0.0.0.0 --port 8000
tailscale serve 8000    # private tailnet HTTPS access
tailscale funnel 8000   # public internet access for farmers + judges
```

### Step 3: ACL in Tailscale Admin Console (~15 min)
```json
{
  "tagOwners": {
    "tag:coordinator": ["ray@email.com"],
    "tag:developer":   ["alice@email.com"],
    "tag:hub":         ["ray@email.com"]
  },
  "acls": [
    {
      "action": "accept",
      "src":    ["tag:coordinator"],
      "dst":    ["*:8000"]
    },
    {
      "action": "accept",
      "src":    ["tag:developer"],
      "dst":    ["*:8000"],
      "not-path": ["/optimize"]
    },
    {
      "action": "accept",
      "src":    ["tag:hub"],
      "dst":    ["*:8000"],
      "not-path": ["/optimize", "/admin", "/nodes"]
    }
  ]
}
```

```bash
# Tag your machine
tailscale up --advertise-tags=tag:coordinator
```

### Step 4: Tailscale Identity in FastAPI (~20 min)

In `app/api/routes/nodes.py`, add `Request` parameter to read identity:

```python
from fastapi import APIRouter, HTTPException, Request

@router.post('/nodes', response_model=models.BundleResponse)
def add_node(req: models.NewFarmRequest, request: Request):
    # Tailscale identity (present when accessed via tailnet)
    ts_login = request.headers.get('Tailscale-User-Login')
    ts_name  = request.headers.get('Tailscale-User-Name')
    farmer_name = ts_name or req.name or 'Anonymous Farmer'
    # rest of existing logic unchanged...
```

Add `/me` endpoint to make identity visible:

```python
@router.get('/me')
def whoami(request: Request):
    ts_login = request.headers.get('Tailscale-User-Login')
    ts_name  = request.headers.get('Tailscale-User-Name')
    return {
        'tailscale_login': ts_login,
        'tailscale_name':  ts_name,
        'authenticated':   ts_login is not None,
        'message': (
            f'Welcome to MyCelium, {ts_name}. '
            f'Your Tailscale identity is your operator credential.'
            if ts_login else
            'Public access. Sign in with Google to register your farm.'
        )
    }
```

### Step 5: Supabase Google OAuth for Farmers (~20 min)

In Supabase dashboard: Authentication → Providers → Google → enable, add client ID/secret.

In the frontend:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Login
await supabase.auth.signInWithOAuth({ provider: 'google' })

// Get user on return
const { data: { user } } = await supabase.auth.getUser()
// user.id tied to their farm record server-side
```

### Step 6: Update CORS (~5 min)

In `app/api/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3000', 'http://127.0.0.1:3000',
        'http://localhost:8080', 'http://127.0.0.1:8080',
        'https://*.tail-xyz.ts.net',  # your tailnet domain
        'null',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
```

---

## Demo Script (for Judges)

```
1. tailscale status  →  show two laptops on the same tailnet
2. GET /me           →  judge sees their Tailscale identity, zero login
3. Teammate tries POST /optimize  →  ACL blocks it
4. Admin (Ray) hits POST /optimize  →  runs successfully
5. Open Funnel URL on a phone  →  farmer signs in with Google, registers a farm
6. Nodal visualization updates live  →  new node appears
7. Pitch close: "Joining the tailnet IS the credential. No auth system built."
```

---

## Time Estimate

| Task | Time |
|---|---|
| Tailnet setup (everyone) | 5 min |
| `tailscale serve` + `tailscale funnel` | 2 min |
| ACL config | 15 min |
| Tailscale identity headers in API | 20 min |
| `/me` endpoint | 10 min |
| Supabase Google OAuth (farmer auth) | 20 min |
| CORS update | 5 min |
| End-to-end test | 15 min |
| **Total** | **~90 min** |
