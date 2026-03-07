# Screen Layouts — Kit Reference & Agent Instructions

---

## HOW TO USE THIS DOCUMENT (READ FIRST)

This file is the single source of truth for all wireframe layouts.
Multiple agents work on this in parallel — each agent owns one section.

**Before doing anything:**
1. Run `do dis` via MCP to confirm no wireframes already exist at `app/frontend/wireframes/`
2. Read `final-kits/ui-kit-responsive.html` — understand every component available
3. Read `final-kits/styles.css` — the token and class reference
4. Read your assigned section below (only your section)
5. Run `do ide` via MCP — generate 2 layout concepts, present them, wait for user to pick one
6. Build your wireframe HTML at the path specified in your section

**Output rules (all agents):**
- One standalone HTML file per wireframe
- Link stylesheet: `<link rel="stylesheet" href="../../../final-kits/styles.css">`
- Also copy the inline `<style>` block from `final-kits/ui-kit-responsive.html` for responsive layout classes not in styles.css
- Use ONLY class names that exist in the kit — no custom CSS
- Placeholder text is fine (lorem ipsum, "Crop Name", "0.0 kg", etc.)
- Must render correctly at 375px (mobile) AND 768px+ (desktop) — the kit handles this automatically via its media query

---

## KIT TOKEN REFERENCE

```
Colors:   --bg #E8E5E0 · --bg-warm #DDD9D3 · --bg-card #F2F0EC · --bg-elev #FFFFFF
          --ink #1A1A1A · --ink-2 #6B6762 · --ink-3 #9E9A94
          --accent #E8913A · --success #4CAF50 · --error #D94F4F · --info #5B8DEF
Fonts:    --fb Inter (body) · --fd Space Grotesk (display/headings)
Radii:    --r-xs 2px · --r-sm 4px · --r-md 6px · --r-pill 999px
```

## KIT COMPONENT INVENTORY

| Component | Classes |
|---|---|
| Page shell | `.shell` |
| Sticky topbar (mobile) | `.m-topbar` · `.m-topbar-logo` · `.m-topbar-name` · `.m-topbar-dot` · `.m-topbar-actions` |
| Sticky topbar (desktop) | `.d-topbar` · `.d-topbar-logo` · `.d-topbar-name` · `.d-topbar-dot` · `.d-topbar-actions` |
| Bottom tab bar | `.m-tabbar` · `.m-tab` · `.m-tab--on` · `.m-tab-lbl` · `.m-tab-dot` |
| Dark hero banner | `.m-hero` · `.m-hero-eyebrow` · `.m-hero-title` · `.m-hero-sub` · `.m-hero-stats` · `.m-hero-stat` · `.m-hero-val` · `.m-hero-lbl` |
| Stat row | `.m-stat-row` · `.m-stat-card` · `.m-stat-val` · `.m-stat-lbl` · `.m-stat-delta` · `.delta--up` · `.delta--dn` |
| Section | `.m-section` · `.m-section-title` |
| Content area | `.m-content` · `.m-row` |
| Cards | `.crd` · `.crd--elev` · `.crd--acc` · `.crd-head` · `.crd-title` · `.crd-body` · `.crd-foot` |
| Buttons | `.btn` · `--primary` · `--accent` · `--secondary` · `--ghost` · `--full` · `--lg` · `--sm` · `--icon` |
| Inputs | `.input` · `.search` · `.search-icon` |
| Progress bar | `.pbar` · `.pbar-fill` · `.phead` |
| List items | `.li` · `.li-title` · `.li-sub` · `.li-right` · `.li-icon` · `.li-icon--acc` |
| Badges | `.badge` · `--accent` · `--success` · `--error` · `--info` |
| Chips | `.chip` · `.chip--active` |
| Segmented control | `.seg` · `.seg-opt` · `.seg-opt--on` |
| Toggle | `.toggle` · `.toggle--on` · `.toggle__k` |
| Toast | `.toast` · `.toast--s` · `.toast--e` |
| Overline label | `.overline` |
| Desktop grid layouts | `.two-col` · `.three-col` · `.feature-r` · `.feature-r-side` · `.sidebar-layout` |
| Desktop panels | `.big-panel` · `.small-panel` · `.wide-panel` · `.icon-card` · `.icon-card-grid` |
| Desktop sidebar | `.sidebar` · `.nav-row` · `.nav-row--on` |
| Visibility helpers | `.m-only` (hidden on desktop) · `.d-only` (hidden on mobile) |

---

## NAVIGATION — 3 TABS (ALL AUTHENTICATED SCREENS)

The app has **3 main tabs** in the bottom nav (mobile) and top nav (desktop):

| Tab | Icon | Screens covered |
|---|---|---|
| **My Farm** | seedling/plant | Dashboard, Cycle Update |
| **My Food** | basket/bowl | Wallet, Food Manager, Delivery |
| **Suggestions** | sparkle/search | Suggestions entry, form, results |

Suggestions tab is public (no auth required). My Farm and My Food require auth.

```html
<!-- Bottom tabbar — mobile -->
<div class="m-tabbar m-only">
  <button class="m-tab m-tab--on">
    <svg><!-- plant icon --></svg>
    <span class="m-tab-lbl">My Farm</span>
    <span class="m-tab-dot"></span>
  </button>
  <button class="m-tab">
    <svg><!-- basket icon --></svg>
    <span class="m-tab-lbl">My Food</span>
    <span class="m-tab-dot"></span>
  </button>
  <button class="m-tab">
    <svg><!-- sparkle icon --></svg>
    <span class="m-tab-lbl">Suggestions</span>
    <span class="m-tab-dot"></span>
  </button>
</div>
```

---

---
## AGENT A — MY FARM TAB
### Assigned files:
- `app/frontend/wireframes/01-my-farm-dashboard.html`
- `app/frontend/wireframes/02-my-farm-cycle-update.html`

### Instructions for Agent A:
1. Read this section only (§My Farm)
2. Read `final-kits/ui-kit-responsive.html` fully
3. Run `do dis` via MCP
4. Run `do ide` via MCP — propose 2 layout concepts for the dashboard, wait for user selection
5. Then build both wireframe files

---

### Frame 01 — My Farm: Dashboard

**Route:** `/dashboard` — default screen after login

**Content blocks (in order):**
- Topbar: MyCelium logo + avatar button
- Hero banner: current cycle info (cycle number, date range, crop assigned)
- Risk banner: warning toast — only rendered if risk flags exist
- Task list: each task shows toggle + title + subtitle (tool + time)
- Yield stat: expected yield at bottom
- 3-tab bottom nav (My Farm active)

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar                           .d-topbar
  logo · name · dot · avatar          logo · name · dot · [nav links] · avatar

.m-hero (dark panel)                .feature-r
  eyebrow: "Cycle 3"                  .big-panel (left — hero/cycle info)
  title: "Mar 7 – Mar 21"               eyebrow, title, sub, stats
  sub: "Spinach · Zone A"             .feature-r-side (right — tasks + yield)
  stats: crop / target / zone           .crd task list
                                        .m-stat-card yield

[.toast.toast--e if risk flag]      [.wide-panel--dark risk banner if flags]

.m-section "Your tasks"
  .m-content
    .li (toggle + title + sub)      .table-panel or .crd for task list
    .li ...
    .li ...

.m-stat-row (1 stat)
  .m-stat-card "Expected yield"

.m-tabbar (My Farm active)          [no tabbar — desktop uses topbar nav]
```

**States to show in wireframe:**
- Active cycle (primary state — what to build)
- Empty state: `.m-content` with `.overline` "Your first instructions are being prepared"

---

### Frame 02 — My Farm: Cycle Update

**Route:** `/update` — accessed via Update tab

**Content blocks:**
- Topbar: back button + "Log update"
- Cycle header: cycle number + day progress
- Section: Conditions today (soil moisture, temperature, notes)
- Section: Task progress (checklist with skip option)
- Section: End of cycle (log yield — shown only near cycle end)
- 3-tab bottom nav (My Farm active — Update is within My Farm tab)

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar                           .d-topbar
  back btn · "Log update"

.m-section                          .two-col
  title: "Cycle 3 · Day 6 of 14"     left: conditions form
                                      right: task checklist
.m-section "Conditions today"
  .m-content
    .overline "Soil moisture"       .crd--elev for each section
    .m-row [.input] [cam .btn]
    .overline "Temperature"
    .m-row [.input] [location .btn]
    .overline "Notes (optional)"
    .input
    .btn--primary--full "Sync conditions"

.m-section "Task progress"
  .m-content
    .li [.toggle] title [skip .btn]
    .li [.toggle] title [skip .btn]
    .li [.toggle] title [skip .btn]
    .btn--secondary--full "Save progress"

.m-section "End of cycle?" (conditional)
  .m-content
    .btn--accent--full "Log final yield"

.m-tabbar (My Farm active)
```

---

---
## AGENT B — SUGGESTIONS + ONBOARDING
### Assigned files:
- `app/frontend/wireframes/03-suggestions-entry.html`
- `app/frontend/wireframes/04-suggestions-form.html`
- `app/frontend/wireframes/05-suggestions-results.html`
- `app/frontend/wireframes/06-onboarding-step.html`
- `app/frontend/wireframes/07-onboarding-review.html`

### Instructions for Agent B:
1. Read this section only (§Suggestions and §Onboarding)
2. Read `final-kits/ui-kit-responsive.html` fully
3. Run `do dis` via MCP
4. Run `do ide` via MCP — propose 2 layout concepts for the suggestions entry, wait for user selection
5. Then build all 5 wireframe files

---

### Frame 03 — Suggestions: Entry / Method Select

**Route:** `/suggestions` — public, no auth

**Content blocks:**
- Topbar: logo + "Sign in" button
- Hero: headline "What should you grow?" + subtitle
- 3 method cards: AR Scan / Upload Photo / Enter Manually
- Suggestions tab active in bottom nav (or standalone — no auth nav)

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar                           .d-topbar
  logo · name · "Sign in" .btn        logo + sign in

.m-hero                             .big-panel (hero left)
  eyebrow "Get started"
  title "What should you grow?"
  sub [copy]

.m-section                          .three-col (method cards)
  .m-content
    .crd--elev  AR Scan              .icon-card each method
      .li-icon--acc [cam icon]
      .crd-title
      .crd-body
    .crd--elev  Upload Photo
    .crd--elev  Enter Manually
```

---

### Frame 04 — Suggestions: Form

**Route:** `/suggestions/form`

**Content blocks:**
- Topbar: back + "Your plot: 48 sq ft"
- Form fields: plot type, sunlight, water access, tools (chips), budget, soil type
- Submit button

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar back · plot size          .d-topbar

.m-section                          .two-col
  .m-content                          left: form fields
    .overline + .input (×5)           right: .crd--elev summary/preview
    chip row for tools
    .btn--accent--full "Find my crops"
```

---

### Frame 05 — Suggestions: Results

**Route:** `/suggestions/results`

**Content blocks:**
- Topbar: back + "Your top crops"
- Sticky CTA: "Join the network"
- Ranked crop cards (min 5)
- Repeated CTA at bottom

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar back · "Your top crops"   .d-topbar

[sticky strip] .btn--accent--full   [sticky sidebar or top bar CTA]

.m-section (×5 cards)               .two-col or .three-col crop cards
  .crd--acc
    .crd-head
      .crd-title "#1 Spinach"
      .badge--success "87%"
    .crd-body reason tags · yield
    .crd-foot .btn--secondary "Learn more"

.btn--accent--full "Join the network"
```

---

### Frame 06 — Onboarding: Step Template

**Route:** `/onboarding/step-N` (reused for all 5 steps)

**Content blocks:**
- Topbar: close (×) + "Step N of 5"
- Progress bar
- Step title + fields (vary per step)
- Sticky footer: Back + Continue buttons

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar × · "Step 2 of 5"         .d-topbar step indicator

.m-section                          .two-col
  .m-content                          left: .crd--elev form
    .phead + .pbar                    right: .crd progress + step summary
      .pbar-fill [40%]
    .overline + .input (fields vary)
    [OCR cam button where applicable]

[sticky footer]                     [inline footer in card]
  .m-row
    .btn--secondary "Back"
    .btn--primary "Continue"
```

**Build step 2 (Soil Physical) as the example instance:**
fields: soil texture (select), soil depth (number), drainage (select)

---

### Frame 07 — Onboarding: Review

**Route:** `/onboarding/review`

**Content blocks:**
- Topbar: "Review your farm"
- One `.li` row per completed section, each with Edit button
- Submit button

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar "Review your farm"        .d-topbar

.m-section ×5 (one per step)        .crd--elev with all sections listed
  .m-content
    .li
      .li-title section name
      .li-sub   values summary
      .li-right .btn--ghost "Edit"

.btn--accent--full--lg "Join the network"
```

---

---
## AGENT C — MY FOOD TAB
### Assigned files:
- `app/frontend/wireframes/08-my-food-wallet.html`
- `app/frontend/wireframes/09-my-food-delivery.html`

### Instructions for Agent C:
1. Read this section only (§My Food)
2. Read `final-kits/ui-kit-responsive.html` fully
3. Run `do dis` via MCP
4. Run `do ide` via MCP — propose 2 layout concepts for the wallet home, wait for user selection
5. Then build both wireframe files

---

### Frame 08 — My Food: Wallet Home

**Route:** `/food` — default My Food tab

**Content blocks:**
- Topbar: "My Food"
- Hero: Hub Currency balance (prominent)
- CTA: "Log a delivery"
- Food manager section: what you're growing this cycle, expected harvest
- Transaction history: earn/spend list
- 3-tab bottom nav (My Food active)

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar "My Food"                 .d-topbar

.m-hero                             .feature-r
  eyebrow "Hub Currency"              .big-panel balance + CTA (left)
  title "142 HC"                      .feature-r-side food summary (right)
  sub "Your balance"

.m-section                          .two-col
  .m-content
    .btn--accent--full "Log a delivery"

.m-section "What you're growing"    .crd current cycle crop info
  .m-content
    .m-stat-row
      .m-stat-card crop name
      .m-stat-card target yield
      .m-stat-card days remaining

.m-section "History"                .table-panel transaction history
  .m-content
    .li (×3)
      .li-icon--acc "+"
      .li-title "+ 40 HC  Spinach"
      .li-sub date · hub
      .li-right .badge--success "Confirmed"
    .li (pending)
      .li-right .badge--accent "Pending"

.m-tabbar (My Food active)
```

---

### Frame 09 — My Food: Log Delivery

**Route:** `/food/delivery`

**Content blocks:**
- Topbar: back + "Log delivery"
- Hub select: map or sorted list
- Delivery form: crop, quantity, photo
- Submit button

**Layout spec:**
```
MOBILE                              DESKTOP (768px+)
─────────────────────────────       ────────────────────────────────────────
.m-topbar back · "Log delivery"     .d-topbar

.m-section "Which hub?"             .two-col
  .m-content                          left: map + hub list
    [map placeholder 100% × 180px]    right: delivery form
    .li Hub North  0.4km [select]
    .li Hub East   1.1km

.m-section "What are you delivering?"
  .m-content
    .overline "Crop"
    .input (select)
    .overline "Quantity (kg)"
    .input type=number
    .overline "Photo (optional)"
    .btn--secondary--full "Attach photo"
    .btn--accent--full--lg "Submit delivery"
```

---

## GLOBAL WIREFRAME PATTERNS

### Loading state
`.m-stat-card` with `.m-stat-val` containing "—" and muted `.m-stat-lbl`. No blank screens.

### Error state
`.toast.toast--e` full-width block + `.btn--ghost--sm "Retry"` inline.

### Empty state
`.m-content` → `.crd` with centered `.overline` label + muted body copy.

### Success feedback
`.toast.toast--s` positioned above tabbar.
