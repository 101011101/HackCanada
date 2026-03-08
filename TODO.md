# MyCelium — TODO

## Engine

- [ ] **Farm Advisory Layer** — given a farm + assigned crop, generate soil amendment advice, growing instructions, kit recommendations (Kit A/C), and a note explaining data completeness to the farmer
- [ ] **Network Alert Layer** — scan report and emit structured alerts: critical hub undersupply, overproduction warnings, cycle unlock notifications
- [ ] **Yield Feedback Loop** — write actual yield back to `yield_history` on FarmNode; compare actual vs predicted; calibrate `base_yield_per_sqft` per farm over time
- [ ] **Explainability** — expand `reason` field into full score breakdown (pH, moisture, temp, etc.) + what crops were considered and why the winner won
- [ ] **Confidence signal in assignments** — surface `data_completeness` score in API response so UI can show "low confidence" badges

## API

- [ ] **Extend `/nodes/{id}/data`** — current endpoint only updates pH/moisture/temp/humidity; needs to accept all 14 datakit fields
- [ ] **Wire new fields into storage** — `dict_to_farmnode` in storage.py doesn't map new datakit fields from JSON yet; end-to-end flow incomplete
- [ ] **Onboarding endpoint** — new farm with no data gets a default profile by plot type and a guided list of what to measure first
- [ ] **Alerts endpoint** — `GET /alerts` returns network-level alerts from the advisory layer

## Farmer UX

- [ ] **Preferred crops UI** — let farmer select 2–3 preferred crops during registration and update them later
- [ ] **Score breakdown UI** — show suitability score per dimension, not just one number
- [ ] **Kit order flow** — if data is missing, recommend and link to Kit A or Kit C
- [ ] **Mid-cycle check-in** — prompt farmer to update readings partway through a cycle

## Data

- [ ] **Agronomic ranges for crops** — fill in `optimal_nitrogen_ppm`, `optimal_phosphorus_ppm`, `optimal_salinity_ds_m`, `optimal_sunlight_hours`, `preferred_drainage`, etc. in `data.py` for all 10 crops
- [ ] **Seed JSON files** — `farms.json` and `crops.json` in `app/data/` don't include new fields yet; re-seed after agronomic data is confirmed

## User Data (TBD — needs full design)

> Everything below needs to be figured out. What data do we collect, where does it live, what's required vs optional, and what are the privacy implications.

- [ ] **User identity** — who is the user? Auth (email, phone, wallet address?), unique ID, display name, avatar
- [ ] **User ↔ Farm relationship** — one user owns one farm? Can a user have multiple farms? Can a farm have multiple owners (community lot)?
- [ ] **User profile fields** — location, contact info, notification preferences, language, onboarding status
- [ ] **Farmer vs Hub Manager vs Admin** — are there different user roles? What can each role see and do?
- [ ] **Currency & wallet** — `currency_balance` exists on FarmNode but should it live on a User instead? How is currency earned, spent, transferred?
- [ ] **Crops on hand** — `crops_on_hand` tracks self-reported inventory. Who enters this, when, how is it verified?
- [ ] **Lifetime stats** — `crops_lifetime` for cumulative production history. Is this per-user or per-farm?
- [ ] **Request & ledger ownership** — `Request` and `LedgerEntry` schemas exist but no user_id on them yet
- [ ] **Privacy** — what location data do we store (exact GPS vs approximate)? Who can see a farmer's yield history?
- [ ] **Notifications** — push, SMS, email? What triggers a notification and where does that config live?
- [ ] **Account deletion / data export** — what happens to farm data if a user leaves?

## Infrastructure

- [ ] **Automated re-optimize trigger** — run `/optimize` automatically when a farm cycle ends, not just on manual call
- [ ] **AR plot scan** — capture `plot_size_sqft` via AR component (separate scope; see AR PRD)
- [ ] **Location-based climate autofill** — auto-populate temperature, growing season length, rainfall distribution from GPS + weather API so farmers don't need Kit C for those fields
