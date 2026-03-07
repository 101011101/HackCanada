# Key Features

## Agent Instructions

You are building or reviewing key features for the farmer-facing frontend.

1. Read `@PRD/00-product-overview.md` for the big picture.
2. Read `@PRD/05-datakit.md` for the full list of data variables you need to collect.
3. Read `01-user-flows.md` and `02-product-requirements.md` in this directory first.
4. Run `do dis` via MCP to discover what backend endpoints and data structures already exist before building anything.
5. Each feature below has an acceptance criterion — use it to verify your implementation is complete.

---

## Feature 1 — Plot Size Capture (AR / Photo / Manual)

**What it is:** The mechanism to measure plot area before getting suggestions or during onboarding.

**Three modes (in priority order — try AR first, fall back down):**

### AR Mode (WebXR)
- Open rear camera via WebXR
- User taps 4 corners of their plot on the ground plane
- App calculates area from the 4 points + device altitude/scale
- Returns `plot_size_sqft` (and sqm)

### Photo Mode
- User uploads or takes a photo of their plot from above
- User draws a polygon over the plot boundary on the photo
- User marks one edge and enters its known length (e.g. "this wall is 3m")
- App calculates full area from polygon + scale reference
- Returns `plot_size_sqft`

### Manual Mode
- Simple numeric inputs: length × width, or direct sqft/sqm entry
- Dropdown for unit selection

**Acceptance criteria:**
- All 3 modes return `plot_size_sqft` in the same format
- If AR is not supported by the device, it is hidden (not shown as broken)
- If photo mode fails to calculate, user can fall through to manual
- Value carries forward to the suggestions form or onboarding form automatically

---

## Feature 2 — OCR Soil Reading Capture

**What it is:** User photographs a soil meter, handwritten reading, or test strip result. App extracts the number and pre-fills the relevant form field.

**Flow:**
- Camera icon next to any numeric soil field (pH, N, P, K, salinity, moisture)
- User taps icon → camera opens or photo picker opens
- Photo sent to OCR endpoint (Tesseract.js client-side or server Vision API)
- Extracted number returned → field pre-filled
- User can edit the pre-filled value before submitting

**Acceptance criteria:**
- OCR result always editable — never auto-submitted without user seeing it
- If OCR fails or confidence is low → show raw photo + manual entry fallback
- Supported fields: pH, N, P, K, salinity, soil moisture, temperature

---

## Feature 3 — Suggestion Engine Results Display

**What it is:** Ranked list of crops returned from the suggestions API, displayed as cards.

**Each crop card shows:**
- Crop name + icon/illustration
- Suitability score (e.g. 87%)
- 2–3 reason tags (e.g. "Matches your pH", "Good for balconies", "Low water needs")
- Estimated yield per cycle (kg or units)
- "Learn more" expansion (basic growing notes)

**Acceptance criteria:**
- At least 5 results shown (or all results if fewer)
- Sorted by suitability descending
- "Join the network" CTA visible at top and bottom of results list
- Results are not cached between sessions (stateless)

---

## Feature 4 — Multi-Step Onboarding Form

**What it is:** 5-step guided form to capture all farm node variables.

**Steps:** Plot Basics → Soil Physical → Soil Chemistry → Climate & Water → Resources

**Key behaviors:**
- Progress bar or step indicator always visible
- Each step validates before advancing (inline errors, not after submit)
- Optional fields have a "Skip / I don't have this" affordance
- User can go back to any previous step
- Draft auto-saved to local storage so progress isn't lost on refresh or navigation away
- Final review step shows all entered data with section edit links

**Acceptance criteria:**
- All variables from `@PRD/05-datakit.md` §1 are present as form fields
- Required fields: plot type, plot size, location, soil texture, drainage, sunlight, water availability, tools, budget
- Optional fields: pH, N/P/K, organic matter, salinity, water quality, rainfall pattern
- Submit sends one POST to create the farm node; response includes first instruction bundle

---

## Feature 5 — Instruction Bundle Display

**What it is:** The core deliverable of the app — the farmer's current growing instructions.

**Bundle sections:**
- Header: Cycle N, date range (e.g. "Mar 7 – Mar 21")
- Assigned crop(s): name, quantity (kg or units), zone label if applicable
- Task list: ordered, each task has title, description, due date, tool requirements, time estimate
- Risk flags: shown as a warning banner if present (frost, disease risk, overwatering)
- Expected yield: shown at bottom

**Task item states:**
- Pending
- In progress
- Completed (checked off)
- Overdue (past due date, not done)

**Acceptance criteria:**
- Bundle renders correctly with 1 or multiple crops assigned
- Risk flags render as distinct warning elements (not buried in task list)
- Task completion state persists locally and syncs on cycle update submit
- Empty state defined: "Your first instructions are being prepared" if bundle not yet ready

---

## Feature 6 — Cycle Update Submit

**What it is:** The recurring sync — farmer logs conditions and task progress, server updates the digital twin.

**Key behaviors:**
- Submitting condition data (moisture, temp) updates the digital twin server-side
- Submitting final yield at cycle end triggers re-optimization
- Response may include updated instruction bundle for next cycle
- Offline: store update locally, sync when connectivity returns

**Acceptance criteria:**
- Condition update and yield logging are separate submittable sections (not one giant form)
- Success toast shown after each sync
- If re-optimization produces new instructions, dashboard updates without requiring manual refresh

---

## Feature 7 — Wallet & Delivery Logging

**What it is:** Currency balance display + the flow to log a food delivery to a hub.

**Delivery log form:**
- Hub selection (map pin or list sorted by distance)
- Crop type (dropdown, limited to their current assignment)
- Quantity (numeric with unit)
- Optional: delivery photo

**Acceptance criteria:**
- Balance shown as the first thing on the wallet screen
- Delivery submission creates a pending record (status: awaiting hub confirmation)
- Pending deliveries shown in transaction history as "Pending"
- Once confirmed by hub (backend event), status updates to "Confirmed" and balance increments
- Supabase Realtime subscription used to update balance without manual refresh
