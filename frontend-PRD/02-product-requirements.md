# Product Requirements

## Agent Instructions

You are defining or validating product requirements for the farmer-facing frontend.

1. Read `@PRD/01-problem.md` and `@PRD/02-solution.md` — understand what problem this solves and for whom.
2. Read `01-user-flows.md` in this directory — requirements map directly to those flows.
3. Run `do dis` via MCP to check existing backend capabilities before writing requirements that assume unbuilt APIs.
4. Your job: ensure every requirement below is satisfied by the implementation. Flag any gaps.

---

## Screen 1 — Suggestions

### Must Have
- User can get crop suggestions without creating an account
- Plot size can be captured via AR scan, photo upload, or manual entry
- Suggestions are ranked by suitability score (highest first)
- Each suggestion shows: crop name, suitability %, brief reason, expected yield estimate
- Fallback available at every measurement step (AR fails → photo; photo fails → manual)
- "Join the network" CTA on results page leads to onboarding with plot data pre-filled

### Should Have
- Suggestions load within 3 seconds
- Results page shows at least 5 crop options

### Won't Have (MVP)
- Saved suggestion history without an account
- Social sharing of results

---

## Screen 2 — Onboarding

### Must Have
- Account creation (email + password) via Supabase auth
- Multi-step form with progress indicator (user knows which step they're on)
- All data variables from `@PRD/05-datakit.md` are capturable in the form
- Optional fields are clearly marked; user can skip chemistry fields
- OCR flow: user photos a soil meter → app extracts numeric reading → pre-fills the field
- Location capture (GPS prompt or manual address)
- Review step before final submission
- On submit: data POSTed to backend, node created, first instruction bundle returned
- Incomplete onboarding is saveable — user can resume later

### Should Have
- Plot size from suggestions flow pre-populated if user came from there
- Auto-fill temperature and growing season from location via weather API
- Inline validation with helpful error messages (not just "invalid input")

### Won't Have (MVP)
- AR plot layout/zone mapping (plot size only, not zone breakdown)
- Multiple plots per account

---

## Screen 3 — Dashboard

### Must Have
- Displays current instruction bundle for the farmer's node
- Bundle shows: assigned crop(s), full task list with due dates, tools needed, time estimates
- Risk flags shown prominently if present (frost, disease, overwatering)
- Cycle number and date range visible
- Expected yield at end of cycle shown
- First-time state: specific welcome message for newly onboarded farmers

### Should Have
- Tasks can be marked complete from the dashboard (shallow action — full logging in Cycle Update)
- Bundle updates in real-time if re-optimization runs (Supabase Realtime subscription)

### Won't Have (MVP)
- Push notifications for new instructions
- AR overlay for task execution

---

## Screen 4 — Cycle Update

### Must Have
- User can log current soil/climate conditions (moisture, temperature)
- Photo → OCR supported for soil readings
- Task checklist: mark each task done / in progress / skipped
- Data syncs to backend on submit
- End-of-cycle yield logging: actual yield in kg/units
- Confirmation feedback after successful sync

### Should Have
- Auto-fill temperature from device location
- Optional plot photo upload per update

### Won't Have (MVP)
- Bluetooth sensor kit integration
- Automated sensor reading ingestion

---

## Screen 5 — Wallet & Delivery

### Must Have
- Hub Currency balance displayed clearly
- Transaction history: list of earn/spend events with date and amount
- Delivery logging flow: select hub, enter crop + quantity, confirm
- Delivery record submitted to backend (awaiting hub confirmation)
- Balance updates once hub confirms delivery (real-time or on refresh)

### Should Have
- Nearby hubs shown on a map or sorted list by distance
- Pending delivery status visible (submitted but not yet confirmed)

### Won't Have (MVP)
- Peer-to-peer currency transfer
- Currency expiry handling
- QR code scanning for hub confirmation (hub side is admin scope)

---

## Cross-Cutting Requirements

| Requirement | Detail |
|-------------|--------|
| Mobile-first | All screens designed for 375px+ screens. Touch targets min 44px. |
| Auth | Supabase auth. JWT in secure storage. Protected routes redirect to `/auth`. |
| Offline tolerance | Forms should not lose data if connectivity drops mid-fill. Use local draft state. |
| Loading states | Every async operation shows a loading indicator. No silent waits. |
| Error states | Every API failure shows a user-readable message + retry option. |
| Empty states | Every list/feed has a defined empty state (not a blank screen). |
| Accessibility | Semantic HTML, ARIA labels on interactive elements, sufficient color contrast. |
