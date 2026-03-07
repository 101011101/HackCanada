# Screen Layouts — Kit Reference

## Source of Truth

The **only** design system in use is `final-kits/styles.css` + `final-kits/ui-kit-responsive.html`.
All class names, tokens, and components below come directly from that kit.
Do not invent new components. Do not apply a dark or "MyCelium organic" aesthetic — use the kit as-is.

### Kit Token Reference
```
Colors:   --bg #E8E5E0 · --bg-warm #DDD9D3 · --bg-card #F2F0EC · --bg-elev #FFFFFF
          --ink #1A1A1A · --ink-2 #6B6762 · --ink-3 #9E9A94
          --accent #E8913A · --success #4CAF50 · --error #D94F4F · --info #5B8DEF
Fonts:    --fb Inter (body) · --fd Space Grotesk (display/headings)
Radii:    --r-xs 2px · --r-sm 4px · --r-md 6px · --r-pill 999px
```

### Kit Component Inventory (mobile-first)
| Component | Class(es) |
|---|---|
| Page shell | `.shell` |
| Sticky topbar | `.m-topbar` · `.m-topbar-logo` · `.m-topbar-name` · `.m-topbar-dot` · `.m-topbar-actions` |
| Bottom tab bar | `.m-tabbar` · `.m-tab` · `.m-tab--on` · `.m-tab-lbl` · `.m-tab-dot` |
| Dark hero banner | `.m-hero` · `.m-hero-eyebrow` · `.m-hero-title` · `.m-hero-sub` · `.m-hero-stats` · `.m-hero-stat` · `.m-hero-val` · `.m-hero-lbl` |
| Stat row (2-col) | `.m-stat-row` · `.m-stat-card` · `.m-stat-val` · `.m-stat-lbl` · `.m-stat-delta` · `.delta--up` · `.delta--dn` |
| Section wrapper | `.m-section` · `.m-section-title` |
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

---

## Screen 1 — Suggestions

### 1a. Entry — Method Select

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .m-topbar-logo                      │
│     [logo svg] .m-topbar-name         │
│     .m-topbar-dot                     │
│   .m-topbar-actions                   │
│     .btn.btn--secondary.btn--sm       │  ← "Sign in"
│                                       │
│ .m-hero                               │
│   .m-hero-eyebrow  "Get started"      │
│   .m-hero-title    "What should       │
│                     you grow?"        │
│   .m-hero-sub      [subtitle copy]    │
│                                       │
│ .m-section                            │
│   .m-content                          │
│     .crd.crd--elev  ← AR Scan card   │
│       .li-icon.li-icon--acc [cam svg] │
│       .crd-title  "Scan with AR"      │
│       .crd-body   [description]       │
│     .crd.crd--elev  ← Photo card     │
│       .li-icon [photo svg]            │
│       .crd-title  "Upload a photo"    │
│     .crd.crd--elev  ← Manual card    │
│       .li-icon [pencil svg]           │
│       .crd-title  "Enter size manually"│
└───────────────────────────────────────┘
```

**Notes:**
- AR card hidden (not broken) if WebXR unavailable — use `display:none` conditional
- Tapping any card navigates into 1b

---

### 1b. Suggestions Form

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .btn.btn--ghost.btn--sm  ← back     │
│   .m-topbar-name  "Your plot: 48 sq ft"│
│                                       │
│ .m-section                            │
│   .m-content                          │
│                                       │
│     .overline  "Plot type"            │
│     .input (select/dropdown)          │
│                                       │
│     .overline  "Sunlight"             │
│     .input  placeholder "hrs/day"     │
│                                       │
│     .overline  "Water access"         │
│     .input (select)                   │
│                                       │
│     .overline  "Tools"                │
│     [row of .chip / .chip--active]    │
│                                       │
│     .overline  "Budget"               │
│     .input (select)                   │
│                                       │
│     .overline  "Soil type (optional)" │
│     .input (select)                   │
│                                       │
│     .btn.btn--accent.btn--full.btn--lg│
│       "Find my crops"                 │
└───────────────────────────────────────┘
```

---

### 1c. Results

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .btn.btn--ghost.btn--sm  ← back     │
│   .m-topbar-name  "Your top crops"    │
│                                       │
│ [sticky strip]                        │
│   .btn.btn--accent.btn--full          │
│     "Join the network"                │
│                                       │
│ .m-section  ← crop card #1           │
│   .m-content                          │
│     .crd.crd--acc                     │
│       .crd-head                       │
│         .crd-title  "#1  Spinach"     │
│         .badge.badge--success  "87%"  │
│       .crd-body                       │
│         "Matches pH · Low water"      │
│         "~1.2 kg / cycle"             │
│       .crd-foot                       │
│         .btn.btn--secondary.btn--sm   │
│           "Learn more"                │
│                                       │
│ .m-section  ← crop card #2           │
│   .m-content                          │
│     .crd  (same structure)            │
│                                       │
│ [repeated for 3–5+ cards]             │
│                                       │
│   .btn.btn--accent.btn--full          │
│     "Join the network"   ← bottom CTA│
└───────────────────────────────────────┘
```

---

## Screen 2 — Onboarding

### 2a. Step Layout (consistent across all 5 steps)

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .btn.btn--ghost.btn--icon  ← close  │
│   .m-topbar-name  "Step 2 of 5"       │
│                                       │
│ .m-section                            │
│   .m-content                          │
│     .phead                            │
│       span  "Soil — Physical"         │
│       span  "2 / 5"                   │
│     .pbar                             │
│       .pbar-fill  [width: 40%]        │
│                                       │
│     .overline  "Soil texture"         │
│     .input (select)                   │
│                                       │
│     .overline  "Soil depth (cm)"      │
│     .input  type=number               │
│                                       │
│     .overline  "Drainage"             │
│     .input (select)                   │
│                                       │
│ [sticky bottom bar]                   │
│   .m-row                              │
│     .btn.btn--secondary  "Back"       │
│     .btn.btn--primary    "Continue"   │
└───────────────────────────────────────┘
```

---

### 2b. OCR Capture (inline — appears when camera icon tapped)

```
┌─ .crd.crd--elev ──────────────────────┐
│ .crd-head                             │
│   .crd-title  "Soil pH"               │
│   .btn.btn--ghost.btn--icon  [cam svg]│
│ .input  value="6.8"  ← pre-filled     │
│                                       │
│ [photo thumbnail  100% width]         │
│ .overline  "We read: 6.8 — looks right?"│
│                                       │
│ .crd-foot                             │
│   .btn.btn--secondary.btn--sm  "Edit" │
│   .btn.btn--primary.btn--sm  "Confirm"│
└───────────────────────────────────────┘
```

---

### 2c. Review Step

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .m-topbar-name  "Review your farm"  │
│                                       │
│ .m-section  ← Plot Basics            │
│   .m-content                          │
│     .li                               │
│       .li-title   "Plot Basics"       │
│       .li-sub     "Backyard · 120 sq ft · GPS set"│
│       .li-right                       │
│         .btn.btn--ghost.btn--sm "Edit"│
│                                       │
│ .m-section  ← Soil Physical          │
│   .m-content  (same .li structure)    │
│     .li-sub  "Loam · 30cm · Well-drained"│
│                                       │
│ .m-section  ← Soil Chemistry         │
│   .m-content                          │
│     .li-sub  "pH 6.8 · N/P/K not entered"│
│     .badge.badge--info  "Optional"    │
│                                       │
│ .m-section  ← Climate & Water        │
│   .m-content                          │
│     .li-sub  "6hrs sun · Irrigation available"│
│                                       │
│ .m-section  ← Resources              │
│   .m-content                          │
│     .li-sub  "Spade, Watering can · $20–50/mo"│
│                                       │
│   .btn.btn--accent.btn--full.btn--lg  │
│     "Join the network"                │
└───────────────────────────────────────┘
```

---

## Screen 3 — Dashboard

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .m-topbar-logo                      │
│     [logo] .m-topbar-name  .m-topbar-dot│
│   .m-topbar-actions                   │
│     .btn.btn--ghost.btn--icon [avatar]│
│                                       │
│ .m-hero  ← cycle header               │
│   .m-hero-eyebrow  "Cycle 3"          │
│   .m-hero-title    "Mar 7 – Mar 21"   │
│   .m-hero-stats                       │
│     .m-hero-stat  val="Spinach"  lbl="crop"│
│     .m-hero-stat  val="1.2 kg"   lbl="target"│
│     .m-hero-stat  val="Zone A"   lbl="zone"│
│                                       │
│ [risk banner — only if flags present] │
│   .toast.toast--e                     │
│     ⚠ "RISK: Frost likely Mar 9"      │
│                                       │
│ .m-section                            │
│   .m-section-title  "Your tasks"      │
│   .m-content                          │
│     .li  ← task 1 (pending)          │
│       .toggle  (unchecked)            │
│       .li-title   "Thin seedlings by Mar 9"│
│       .li-sub     "Scissors · ~20 min"│
│                                       │
│     .li  ← task 2 (done)             │
│       .toggle.toggle--on              │
│       .li-title   "Water every 2 days"│
│       .li-icon    [can svg]           │
│                                       │
│     .li  ← task 3                    │
│       .toggle                         │
│       .li-title   "Harvest when leaves >5cm"│
│       .li-sub     "Mar 18–21 · Basket"│
│                                       │
│ .m-stat-row  (1 col, full width)      │
│   .m-stat-card                        │
│     .m-stat-val  "~1.1 kg"            │
│     .m-stat-lbl  "Expected yield"     │
│                                       │
│ .m-tabbar                             │
│   .m-tab.m-tab--on  lbl="Home"        │
│   .m-tab             lbl="Update"     │
│   .m-tab             lbl="Wallet"     │
│   .m-tab             lbl="Me"         │
└───────────────────────────────────────┘
```

**Notes:**
- Risk banner uses `.toast.toast--e` rendered as a full-width block above the task section, not a floating toast
- Task toggles are shallow — full logging is in Screen 4
- Badge on Update `.m-tab` when new bundle arrives: add `.badge.badge--accent` with count

---

## Screen 4 — Cycle Update

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .btn.btn--ghost.btn--sm  ← back     │
│   .m-topbar-name  "Log update"        │
│                                       │
│ .m-section                            │
│   .m-section-title  "Cycle 3 · Day 6 of 14"│
│                                       │
│ .m-section                            │
│   .m-section-title  "Conditions today"│
│   .m-content                          │
│     .overline  "Soil moisture"        │
│     .m-row                            │
│       .input  type=number             │
│       .btn.btn--ghost.btn--icon [cam] │  ← OCR
│                                       │
│     .overline  "Temperature (°C)"     │
│     .m-row                            │
│       .input  type=number             │
│       .btn.btn--ghost.btn--sm         │
│         "Use my location"             │
│                                       │
│     .overline  "Notes (optional)"     │
│     .input (textarea style)           │
│                                       │
│     .btn.btn--primary.btn--full       │
│       "Sync conditions"               │
│                                       │
│ .m-section                            │
│   .m-section-title  "Task progress"   │
│   .m-content                          │
│     .li  ← task with actions         │
│       .toggle.toggle--on              │
│       .li-title  "Thin seedlings"     │
│                                       │
│     .li                               │
│       .toggle                         │
│       .li-title  "Water every 2 days" │
│       .li-right                       │
│         .btn.btn--ghost.btn--sm "Skip"│
│                                       │
│     .li                               │
│       .toggle                         │
│       .li-title  "Harvest"            │
│       .li-right                       │
│         .btn.btn--ghost.btn--sm "Skip"│
│                                       │
│     .btn.btn--secondary.btn--full     │
│       "Save progress"                 │
│                                       │
│ .m-section  ← shown near cycle end   │
│   .m-section-title  "End of cycle?"  │
│   .m-content                          │
│     .btn.btn--accent.btn--full        │
│       "Log final yield"               │
│                                       │
│ .m-tabbar  (Update tab active)        │
└───────────────────────────────────────┘
```

---

## Screen 5 — Wallet & Delivery

### 5a. Wallet Home

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .btn.btn--ghost.btn--sm  ← back     │
│   .m-topbar-name  "Wallet"            │
│                                       │
│ .m-hero                               │
│   .m-hero-eyebrow  "Hub Currency"     │
│   .m-hero-title    "142 HC"           │
│   .m-hero-sub      "Your balance"     │
│                                       │
│ .m-section                            │
│   .m-content                          │
│     .btn.btn--accent.btn--full.btn--lg│
│       "Log a delivery"                │
│                                       │
│ .m-section                            │
│   .m-section-title  "History"         │
│   .m-content                          │
│     .li                               │
│       .li-icon.li-icon--acc  "+"      │
│       .li-title  "+ 40 HC  Spinach delivery"│
│       .li-sub    "Mar 6 · Hub North"  │
│       .li-right                       │
│         .badge.badge--success "Confirmed"│
│                                       │
│     .li                               │
│       .li-icon.li-icon--acc  "+"      │
│       .li-title  "+ 35 HC  Kale delivery"│
│       .li-sub    "Feb 21 · Hub North" │
│       .li-right                       │
│         .badge.badge--success "Confirmed"│
│                                       │
│     .li                               │
│       .li-icon  "…"                   │
│       .li-title  "Spinach delivery"   │
│       .li-sub    "Mar 7 · Awaiting hub"│
│       .li-right                       │
│         .badge.badge--accent "Pending"│
│                                       │
│ .m-tabbar  (Wallet tab active)        │
└───────────────────────────────────────┘
```

---

### 5b. Log Delivery Flow

```
┌─ .shell ──────────────────────────────┐
│ .m-topbar                             │
│   .btn.btn--ghost.btn--sm  ← back     │
│   .m-topbar-name  "Log delivery"      │
│                                       │
│ .m-section                            │
│   .m-section-title  "Which hub?"      │
│   .m-content                          │
│     [map embed — 100% width, 200px h] │
│     — or —                            │
│     .li  Hub North  0.4 km  [select]  │
│     .li  Hub East   1.1 km            │
│                                       │
│ .m-section                            │
│   .m-section-title  "What are you delivering?"│
│   .m-content                          │
│     .overline  "Crop"                 │
│     .input (select — Spinach, Kale…)  │
│                                       │
│     .overline  "Quantity (kg)"        │
│     .input  type=number               │
│                                       │
│     .overline  "Photo (optional)"     │
│     .btn.btn--secondary.btn--full     │
│       "Attach photo"                  │
│                                       │
│     .btn.btn--accent.btn--full.btn--lg│
│       "Submit delivery"               │
└───────────────────────────────────────┘
```

---

## Global Patterns

### Bottom Tab Bar (all authenticated screens)
```
.m-tabbar
  .m-tab             icon + lbl="Home"
  .m-tab  [badge?]   icon + lbl="Update"   ← badge if new bundle
  .m-tab.m-tab--on   icon + lbl="Wallet"   ← active example
  .m-tab             icon + lbl="Me"
```
Active tab: `.m-tab--on` — fills icon + label to `--ink`, shows `.m-tab-dot` in accent.

### Loading State
Every async screen shows a placeholder using `.m-stat-card` with empty `.m-stat-val` text replaced by a shimmer `background: linear-gradient(...)` animation. No silent waits.

### Toast Feedback
On successful sync: `.toast.toast--s` — "Saved" — displayed briefly at bottom above tabbar.
On error: `.toast.toast--e` — user-readable message + retry `.btn.btn--ghost.btn--sm`.

### Empty State
`.m-content` with centered `.overline` label + `.crd` containing muted copy. Never a blank screen.
