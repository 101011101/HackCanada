# Build Sequence — MyCelium @ Hack Canada 2026

**Prizes targeted:** Tailscale (Pi 4s) · Auth0 (headphones) · ElevenLabs (earbuds + subscription) · Stan ($250 cash) · Overall placement

---

## What's Already Built

| Component | Status | Notes |
|---|---|---|
| Optimization engine | ✅ Done | scorer, router, scheduler, optimizer, packager, reporter |
| FastAPI API | ✅ Done | all routes wired, storage layer clean |
| Seed data | ✅ Done | farms, crops, hubs, config JSON |
| Frontend | ❌ Empty | just a .gitkeep |
| Nodal visualization | ❌ Empty | referenced in docs, not in repo |
| Tailscale integration | ❌ Not started | |
| Auth0 | ❌ Not started | |
| ElevenLabs | ❌ Not started | |
| Supabase (DB swap) | ❌ Not started | optional, end of build |

---

## Build Order

```
PHASE 1 — Core product working end to end      [~3 hrs]
PHASE 2 — Nodal visualization                  [~2 hrs]
PHASE 3 — Tailscale integration                [~1.5 hrs]
PHASE 4 — Auth0 (farmer auth)                  [~1 hr]
PHASE 5 — ElevenLabs (voice instructions)      [~1 hr]
PHASE 6 — Supabase (DB swap)                   [~1 hr]  ← optional if time allows
PHASE 7 — Polish + demo prep                   [~1 hr]
```

**Do not start the next phase until the current one works end to end.**

---

## Phase 1 — Core Product Working End to End

**Goal:** a farmer can open the app, submit their farm, and see their crop assignment. API is already built — this is purely frontend.

### 1.1 — Farmer Onboarding Form
- [ ] Single page form: name, location (lat/lng or city), plot size, plot type, tools, budget
- [ ] Soil readings: pH, moisture, temperature, humidity (manual entry for now)
- [ ] Submit button → `POST /nodes`
- [ ] Show returned instruction bundle: crop name, quantity, grow weeks, reason

### 1.2 — Farmer Returns to Their Farm
- [ ] Store `farm_id` in localStorage after registration
- [ ] On load: if `farm_id` exists → `GET /nodes/{farm_id}` → show instructions
- [ ] If no `farm_id` → show onboarding form

### 1.3 — Smoke Test
- [ ] Register 3 farms manually
- [ ] Hit `POST /optimize` (curl or Postman)
- [ ] Confirm assignments update
- [ ] Confirm `GET /nodes/{id}` returns correct bundle

**Exit criteria:** a real person can open the app, register, and see what to grow.

---

## Phase 2 — Nodal Visualization

**Goal:** the pitch artifact. Judges see the network live. This is the "wow" moment.

### 2.1 — Static Network Map
- [ ] Canvas or SVG — render nodes as dots on a map (use real lat/lng from seed data)
- [ ] Node color = assigned crop color (already in crop data)
- [ ] Node size = plot size
- [ ] Hub nodes rendered larger, distinct
- [ ] Edges from nodes to their nearest hub

### 2.2 — Live Data
- [ ] On load: `GET /nodes` + `GET /hubs` → render the real network
- [ ] Poll every 5 seconds OR use Supabase realtime (if added in Phase 6)
- [ ] Sidebar: click a node → show farm name, crop, quantity, status

### 2.3 — Network Stats Panel
- [ ] Total nodes online
- [ ] Crops covered (how many unique crops assigned)
- [ ] Network health % (already returned by `POST /optimize`)
- [ ] Last optimization run timestamp

### 2.4 — Demo Mode: New Node Joins
- [ ] When a new farm registers → node animates into the map
- [ ] Pulsing animation on new node
- [ ] Stats panel updates

**Exit criteria:** judges can watch the network and understand what it's doing at a glance.

---

## Phase 3 — Tailscale Integration

**Goal:** meet all challenge requirements. ~1.5 hrs.

### 3.1 — Setup (~10 min)
- [ ] All team members: `tailscale up`, join same org
- [ ] Verify: `tailscale status` shows all devices
- [ ] Tag coordinator machine: `tailscale up --advertise-tags=tag:coordinator`

### 3.2 — Expose the API (~5 min)
- [ ] `tailscale serve 8000` — private tailnet HTTPS
- [ ] `tailscale funnel 8000` — public internet (farmer app + judge demo)
- [ ] Note the public URL — this is the demo URL

### 3.3 — ACL (~15 min)
- [ ] Log into Tailscale admin console
- [ ] Add tags: coordinator, developer, hub
- [ ] ACL rule: only `tag:coordinator` can `POST /optimize`
- [ ] ACL rule: `tag:hub` restricted to `/hubs/*` only
- [ ] Test: teammate tries `POST /optimize` → blocked

### 3.4 — Identity Headers in API (~20 min)
- [ ] Add `Request` param to `POST /nodes` — read `Tailscale-User-Login` / `Tailscale-User-Name`
- [ ] Use Tailscale name as farmer name if present
- [ ] Add `GET /me` endpoint — returns Tailscale identity or "public access"
- [ ] Update CORS in `main.py` to include `*.ts.net` domain

### 3.5 — Test (~15 min)
- [ ] Hit `GET /me` from tailnet — see identity
- [ ] Hit `GET /me` from public Funnel URL — see "public access"
- [ ] Coordinator hits `POST /optimize` — works
- [ ] Teammate hits `POST /optimize` — blocked by ACL

**Exit criteria:** all three Tailscale requirements met + advanced identity working.

---

## Phase 4 — Auth0 (Farmer Google Sign-In)

**Goal:** persistent farmer identity across devices. Wins headphone prize.

### 4.1 — Auth0 Setup (~15 min)
- [ ] Create Auth0 account (free, no credit card)
- [ ] Create application → Single Page Application
- [ ] Enable Google social connection
- [ ] Set allowed callback URLs to Funnel URL + localhost

### 4.2 — Frontend Auth Flow (~20 min)
- [ ] Install Auth0 SDK
- [ ] Wrap app in Auth0Provider
- [ ] Show "Sign in with Google" button before onboarding form
- [ ] After sign-in: user.sub (Auth0 user ID) available in app

### 4.3 — Tie to Farm (~15 min)
- [ ] Pass `auth0_user_id` with `POST /nodes` request
- [ ] API saves it alongside farm record
- [ ] On return: call `GET /nodes?auth0_user_id=...` → load their farm
- [ ] No farm_id localStorage needed — identity is the key

### 4.4 — Test
- [ ] Register as farmer with Google
- [ ] Close browser, reopen
- [ ] Sign in with Google → farm loads automatically
- [ ] Try different browser → same result

**Exit criteria:** farmer can return on any device and access their farm via Google sign-in.

---

## Phase 5 — ElevenLabs (Voice Instructions)

**Goal:** instruction bundles read aloud. Wins earbuds + subscription. Improves UX score.

### 5.1 — ElevenLabs Setup (~10 min)
- [ ] Create ElevenLabs account (1 month free via hackathon link)
- [ ] Get API key
- [ ] Pick a voice (something warm, clear)

### 5.2 — Backend: Generate Audio (~20 min)
Add to the instruction bundle response — after crop assignment, generate audio:

```python
# In nodes.py, after building the BundleResponse
instruction_text = (
    f"Welcome to MyCelium, {farmer_name}. "
    f"Your assignment this cycle: grow {qty_kg} kilograms of {assigned_crop.name}. "
    f"Expected grow time: {assigned_crop.grow_weeks} weeks. "
    f"Deliver your harvest to your nearest hub. Good luck."
)
# Call ElevenLabs API → return audio URL or base64
```

### 5.3 — Frontend: Play Audio (~15 min)
- [ ] After farm registration → auto-play instruction audio
- [ ] Small "replay" button on instruction card
- [ ] Fallback: text shown if audio fails

### 5.4 — Test
- [ ] Register farm → hear instructions spoken
- [ ] Confirm audio matches the text bundle

**Exit criteria:** farmer hears their instructions spoken after registering.

---

## Phase 6 — Supabase (Database Swap) ← Optional

**Goal:** real database for "scalability beyond a demo laptop" judging criterion.
**Only do this if Phase 1–5 are done and working.**

### 6.1 — Supabase Setup (~15 min)
- [ ] Create Supabase project (free tier)
- [ ] Create tables: `farms`, `assignments` (crops/hubs/config stay as seed data)
- [ ] Get connection string / API key

### 6.2 — Swap `storage.py` (~20 min)
- [ ] Replace `load_farms()` / `save_farms()` with Supabase calls
- [ ] Replace `load_assignments()` / `save_assignments()` with Supabase calls
- [ ] Keep crops/hubs/config as JSON (static, no need to persist)
- [ ] All routes stay completely unchanged

### 6.3 — Realtime Visualization (bonus, ~15 min)
- [ ] Subscribe to `farms` table inserts in frontend
- [ ] New farm registers → node appears on map immediately
- [ ] No polling needed

**Exit criteria:** `storage.py` uses Supabase, all existing tests still pass.

---

## Phase 7 — Polish + Demo Prep

**Goal:** make the demo tight and impressive.

### 7.1 — Demo Flow
- [ ] Seed 15–20 realistic farm nodes so the visualization looks populated
- [ ] Pre-run `POST /optimize` so assignments are ready
- [ ] Test the full demo script end to end (see Tailscale doc)

### 7.2 — Visual Polish
- [ ] Nodal map looks good (colors, sizes, edges)
- [ ] Instruction card is clean and readable
- [ ] Stats panel is clear

### 7.3 — Reliability
- [ ] Make sure laptop won't sleep during demo
- [ ] Test on the Funnel public URL (not just localhost)
- [ ] Test on a phone (farmer flow)
- [ ] Have a backup: screenshots/video if live demo fails

### 7.4 — Stan (LinkedIn Posts) — $250 cash
- [ ] Post 1: Friday night — "what we're building and why" (use Stanley)
- [ ] Post 2: Mid-hackathon — a breakthrough or bug you hit
- [ ] Post 3: Final — demo video or screenshot, what you built
- [ ] Tag Stanley on LinkedIn in each post

---

## Time Budget Summary

| Phase | Est. Time | Priority |
|---|---|---|
| Phase 1 — Core frontend | 3 hrs | Must |
| Phase 2 — Visualization | 2 hrs | Must |
| Phase 3 — Tailscale | 1.5 hrs | Must (prize) |
| Phase 4 — Auth0 | 1 hr | High (prize) |
| Phase 5 — ElevenLabs | 1 hr | High (prize) |
| Phase 6 — Supabase | 1 hr | Optional |
| Phase 7 — Polish + demo | 1 hr | Must |
| **Total** | **~10.5 hrs** | |

---

## If You're Running Out of Time

Cut in this order:
1. Skip Supabase (JSON files demo fine, just note it in pitch)
2. Skip ElevenLabs (nice-to-have, not core)
3. Simplify visualization (static map is fine, skip realtime)
4. Never cut Tailscale — that's the prize target
5. Never cut core farmer flow — that's the product

---

## Prizes At Stake

| Prize | What You Do | When |
|---|---|---|
| Tailscale — Raspberry Pi 4s | Phase 3 complete | After Phase 3 |
| Auth0 — Wireless headphones | Phase 4 complete | After Phase 4 |
| ElevenLabs — Earbuds + subscription | Phase 5 complete | After Phase 5 |
| Stan — $250 cash | 3 LinkedIn posts | Throughout hackathon |
| Overall placement | All phases, strong demo | End |
