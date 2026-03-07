# Error, Loading, and Empty States

## Agent Instructions

You are implementing or auditing all non-happy-path states for the farmer frontend.

1. Read Layer 1 completely: `../01-user-flows.md`, `../02-product-requirements.md`, `../04-layouts.md`
2. Read `../staged-planning/01-api-contracts.md` — every API call listed there needs error handling.
3. Run `do dis` via MCP to check if a shared error/toast component already exists before building one.
4. Rule: No screen may show a blank white area when loading, empty, or errored. Every async state must be handled.

---

## Global Patterns

### Loading
- Skeleton loaders for content areas (not spinners blocking the full screen)
- Button loading state: disable + show spinner inside the button during submission
- Full-screen loading only on initial app load (auth session check)

### Error
- Toast notification for transient errors (network blip, retry succeeded)
- Inline error for form validation (under the specific field)
- Error banner for page-level failures (API down, data failed to load) with a retry button
- Never show raw error messages or stack traces to the user

### Empty
- Every list has an empty state with an illustration or icon + a clear message + a CTA where applicable
- Never show a list header with nothing beneath it

---

## Screen 1 — Suggestions

| State | Trigger | UI |
|-------|---------|-----|
| AR not supported | Device doesn't support WebXR | Hide AR option entirely; show Photo and Manual only |
| AR fails mid-session | WebXR session error | Toast: "AR unavailable, try a photo instead" → auto-advance to Photo mode |
| Photo area calculation fails | Unable to compute polygon area | Show: "Couldn't calculate area from that photo — enter manually" + manual input |
| OCR extraction fails | No numeric value found in image | Show raw photo thumbnail + "We couldn't read this — enter the value yourself" + field input |
| Suggestions API error | Network failure or 5xx | Error banner: "Couldn't fetch suggestions right now" + [Retry] button |
| Suggestions empty | API returns 0 results | Message: "We couldn't find crops that match your plot right now. Try adjusting your inputs." + [Edit inputs] link |
| Suggestions loading | POST /suggestions in flight | Skeleton cards (3 placeholder cards with shimmer) + "Finding your best crops..." |

---

## Screen 2 — Onboarding

| State | Trigger | UI |
|-------|---------|-----|
| GPS denied | User denies location permission | Show manual address input fallback, no error shown |
| GPS timeout | Location takes >5s | Auto-fall to manual input with message: "Location taking too long — enter your address instead" |
| OCR low confidence | Confidence < 0.7 | Show photo preview + "We read [value] — does that look right?" with edit and confirm actions |
| OCR complete failure | No value extracted | Show field empty + message: "Couldn't read that — enter the value manually" |
| Step validation error | Required field missing on "Continue" | Inline error under each invalid field; scroll to first error |
| Submit fails | POST /farms returns error | Error banner at review step: "Something went wrong saving your farm. [Retry]" |
| Submit loading | POST /farms in flight | Button shows spinner + "Joining the network..." — disable all inputs |
| First bundle not ready | POST /farms succeeds but bundle is null | Show success screen: "You're in! Your first instructions are being prepared — we'll notify you when they're ready." |
| Draft restore | User returns to incomplete onboarding | Show: "Welcome back — you left off at step [N]. Continue?" with [Continue] and [Start over] |

---

## Screen 3 — Dashboard

| State | Trigger | UI |
|-------|---------|-----|
| Bundle loading | GET /bundle/current in flight | Skeleton: header bar + 3 task item skeletons |
| Bundle fetch error | API failure | Error banner: "Couldn't load your instructions. [Retry]" |
| No bundle yet | Farmer just joined, bundle not generated | Empty state: illustration of seedling + "Your first instructions are being prepared. Check back soon." |
| New bundle arrived | Realtime subscription fires | Toast: "Your instructions have been updated" + tasks list refreshes in place |
| All tasks complete | Every task status = completed | Success state at top of task list: "All tasks done for this cycle." + progress indicator complete |
| Overdue tasks | Task due_date passed + status != completed | Task shows red overdue label; brief banner: "[N] tasks are overdue" |
| Risk flags | risk_flags array non-empty | Yellow/orange warning banner above task list; high severity = red |

---

## Screen 4 — Cycle Update

| State | Trigger | UI |
|-------|---------|-----|
| Conditions sync loading | POST /updates in flight | Button: spinner + "Syncing..." |
| Conditions sync success | 200 response | Toast: "Conditions logged" |
| Conditions sync error | Network or 5xx | Toast with retry: "Sync failed — [Retry]" |
| New bundle after yield log | Response includes new_bundle | Toast: "New instructions ready" + dashboard badge updates |
| Offline | No network connection | Banner at top of screen: "You're offline — your update will sync when you reconnect." Store locally. |
| Offline sync on reconnect | Network restored with pending local update | Auto-attempt sync; toast: "Back online — syncing your update..." |

---

## Screen 5 — Wallet & Delivery

| State | Trigger | UI |
|-------|---------|-----|
| Wallet loading | GET /wallet in flight | Skeleton: balance placeholder + 3 transaction skeletons |
| Wallet fetch error | API failure | Error banner + [Retry] |
| Empty transaction history | No transactions yet | Empty state: "No transactions yet. Deliver your first harvest to earn Hub Currency." |
| No nearby hubs | GET /hubs/nearby returns empty | Message: "No hubs near you yet. The network is growing — check back soon." |
| Delivery submit loading | POST /deliveries in flight | Button: spinner + "Submitting..." |
| Delivery submit success | 201 response | Success screen: "Delivery logged — your Hub Currency will be credited when the hub confirms." |
| Delivery submit error | Network or 5xx | Toast: "Couldn't submit delivery. [Retry]" |
| Balance update (realtime) | Supabase Realtime fires on transaction confirm | Balance number animates to new value; transaction moves from "Pending" to "Confirmed" |

---

## Form Validation Rules (shared across onboarding and cycle update)

| Field | Validation |
|-------|-----------|
| pH | 3.0 – 10.0, max 1 decimal |
| Soil depth | 1 – 500 cm, integer |
| N / P / K | 0 – 10000 ppm, integer |
| Salinity | 0 – 50 dS/m, max 1 decimal |
| Sunlight | 0 – 24 hours/day, max 1 decimal |
| Growing season | 1 – 365 days, integer |
| Temperature | -50 – 60 °C, max 1 decimal |
| Plot size | 1 – 100000 sqft, integer |
| Quantity (delivery) | > 0, max 2 decimals |

All numeric fields: reject non-numeric input immediately (don't wait for submit).
