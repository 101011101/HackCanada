Now I have everything needed. Here is the detailed wireframe spec:

---

# Suggestions Page — Wireframe Specification

**File:** `/Users/ray/Coding/Hackathons/HackCanada/app/frontend/src/user/pages/Suggestions.tsx`
**Route:** `/suggestions`
**Entry points:** MenuSheet "Crop suggestions" item, CropPickerSheet "Add new plot" button

---

## 1. Overall Architecture

The page is a full-screen scrollable view that mirrors the structure of Dashboard.tsx: a `MobileTopbar` + scrollable body + `BottomTabBar` for mobile; a `DesktopTopbar` + constrained content column for desktop. It is not a modal or sheet — it is a real route.

On mount, the page runs two parallel async fetches:
1. `getNode(farmId)` — to pre-fill `plot_size_sqft`, `plot_type`, `tools`, `budget`, `preferred_crop_ids`.
2. `getSoilData(farmId)` — to pre-fill `pH`, `moisture`, `temperature`.

Once both resolve, it immediately fires `POST /suggestions` with the pre-filled body. The user sees results without having to press anything on first load. The filter controls (see section 6) let them tweak the inputs and re-fetch.

State managed in the component:
- `nodeState` (useAsync)
- `soilState` (useAsync)
- `suggestionsState` (useAsync, triggered after the first two resolve)
- `filters` — local state object mirroring the editable subset of `SuggestionRequest`
- `expandedCropId: number | null` — which crop card is expanded
- `sortMode: 'suitability' | 'yield' | 'weeks'`
- `filterPanelOpen: boolean`

---

## 2. Page Layout

### 2a. Mobile Layout (< 768px)

```
┌─────────────────────────────────────┐
│  TOPBAR (dark ink, sticky top:0)    │
│  ← Back     Crop Suggestions        │
├─────────────────────────────────────┤
│  CONTEXT STRIP (warm beige)         │
│  Your plot · soil data summary      │
├─────────────────────────────────────┤
│  FILTER BAR (sticky top:52px)       │
│  [Sort ▾]  [Filters ●]  [Refresh]  │
├─────────────────────────────────────┤
│                                     │
│  RESULTS LIST (scrollable)          │
│  crop card                          │
│  crop card (expanded)               │
│  crop card                          │
│  …                                  │
│                                     │
├─────────────────────────────────────┤
│  BOTTOM TABBAR                      │
└─────────────────────────────────────┘
```

### 2b. Desktop Layout (>= 768px)

```
┌──────────────────────────────────────────────────────────┐
│  DESKTOP TOPBAR (dark ink)                               │
├──────────────────────────────────────────────────────────┤
│  PAGE HEADER PANEL (dark ink, non-sticky)               │
│  "Crop Suggestions"  subtitle + context summary          │
├──────────────────────────┬───────────────────────────────┤
│  FILTER SIDEBAR (320px)  │  RESULTS LIST                │
│  Plot context fields     │  crop cards (scrollable)     │
│  Soil fields             │                              │
│  [Run suggestions]       │                              │
└──────────────────────────┴───────────────────────────────┘
```

On desktop the filter panel is a persistent left column rather than a bottom sheet.

---

## 3. Topbar

### Mobile Topbar

Uses the existing `MobileTopbar` component but with a **back button** replacing the menu burger. The left side shows a left-arrow SVG icon button (same style as `btn--ghost btn--icon btn--sm` with `rgba(255,255,255,0.1)` background). Tapping it calls `navigate(-1)`.

Center: page title `"Crop Suggestions"` using `.m-topbar-name` style (Space Grotesk, 15px bold, white).

Right: a single Refresh icon button (`btn--ghost btn--icon btn--sm`) that re-fires `POST /suggestions` with current filters. The button shows a spinner (CSS rotation animation on an SVG circle arc) while `suggestionsState.loading` is true.

### Desktop Topbar

Uses the existing `DesktopTopbar` component unchanged.

---

## 4. Context Strip (Mobile) / Page Header Panel (Desktop)

This strip appears below the topbar. It is NOT a hero section — it is shorter: `padding: 12px 20px`, `background: var(--ink)`, no dot-grid pattern.

**Content:**

Left column (text):
- Overline label: `YOUR PLOT` (`.overline` class, color: `var(--ink-3)` adjusted to lighter since on dark bg — use `rgba(255,255,255,0.4)`)
- Farm name: e.g. `"Ray's Balcony"` — Space Grotesk 20px bold, white
- Subtitle row: three pill-shaped badges inline:
  - Plot type badge: e.g. `"Balcony"` — `.badge .badge--info`
  - Plot size: e.g. `"48 sqft"` — `.badge` with custom style: `background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7)`
  - Tools: e.g. `"Basic tools"` — same as above

Right column (soil readings), 3-column micro-grid:
- pH: value like `6.2`, label `"pH"`
- Moisture: `62%`, label `"Moisture"`  
- Temp: `18°C`, label `"Temp"`

Each reading: `.hero-stat` class (existing), displayed as a compact 3-cell grid identical to the hero stats row in Dashboard.

**Loading state:** Replace the farm name and badges with a skeleton shimmer div (40px wide, 12px tall, `background: rgba(255,255,255,0.08)`, `border-radius: var(--r-sm)`, subtle opacity pulse animation). Soil readings show `—` placeholders.

**Error state:** Single line of white text at 80% opacity: "Could not load farm data — some fields may be missing." No blocking error; the page still proceeds with whatever data is available (the backend makes pH/moisture/temperature optional with defaults).

---

## 5. Filter Bar (Mobile, sticky) / Filter Sidebar (Desktop)

### 5a. Mobile Filter Bar

Sticky row at `top: 52px` (below topbar), `z-index: 55`, `background: var(--bg-elev)`, `border-bottom: 1px solid var(--border-lt)`, `padding: 10px 20px`.

Three controls left-to-right:

**Sort dropdown button** — label: `"Sort: Suitability"` (or whichever is active). Style: `.btn .btn--secondary .btn--sm`. Tapping opens a native `<select>` or a small inline popover with three options:
- Suitability % (default, descending)
- Est. yield (descending)
- Grow time (ascending — fastest first)

When sort changes, re-sort the current results array in-place without re-fetching.

**Filters button** — label: `"Filters"` with a filled orange dot indicator (6px circle, `background: var(--accent)`) shown only when any filter has been changed from its pre-filled default. Style: `.btn .btn--secondary .btn--sm`. Tapping opens the Filter Sheet (see 5b).

**Results count** — right-aligned, style `.overline`, text like `"12 CROPS"` or `"0 CROPS"`. Not a button.

### 5b. Filter Sheet (Mobile)

A `BottomSheet` component (same pattern as `CropPickerSheet`, `MenuSheet`) with title `"Adjust parameters"`.

Sheet body contains a vertical stack of labeled controls, each in a row layout: label on left (`.task-lbl` style), control on right.

**Fields:**

1. **Plot size (sqft)** — number input, `type="number"`, `min=10`, `step=1`. Pre-filled from `bundle.sqft_allocated ?? bundle.plot_size_sqft`. Label: `"PLOT SIZE"`.

2. **Plot type** — segmented control (4 pill buttons inline, wrapping): `Balcony`, `Rooftop`, `Backyard`, `Community`. Active option gets `background: var(--ink); color: var(--inv)`. Others get `background: transparent; border: 1.5px solid var(--border); color: var(--ink-2)`. Pre-filled from `bundle.plot_type`.

3. **Tools available** — same segmented control pattern with 3 options: `Basic`, `Intermediate`, `Advanced`. Pre-filled from `bundle.tools`.

4. **Budget** — same pattern with 3 options: `Low`, `Medium`, `High`. Pre-filled from `bundle.budget`.

5. **Soil pH** — horizontal slider, range 4.0–9.0, step 0.1. Display current value as `"pH 6.2"` inline to the right. Pre-filled from `soilState.data.pH` or 6.5 fallback. Slider thumb: accent orange.

6. **Moisture** — horizontal slider, range 0–100, step 1. Display `"62%"`. Pre-filled from `soilState.data.moisture`.

7. **Temperature** — horizontal slider, range 5–40, step 0.5. Display `"18°C"`. Pre-filled from `soilState.data.temperature`.

Sheet footer (above the safe area): two buttons side by side:
- `"Reset"` — `.btn .btn--ghost .btn--sm` — resets all fields back to pre-filled defaults and clears the dot indicator
- `"Apply & refresh"` — `.btn .btn--accent btn--full` — closes sheet and fires `POST /suggestions` with updated parameters

### 5c. Desktop Filter Sidebar

A fixed 320px left column (flex child, not position:fixed). `background: var(--bg-elev)`, `border-right: 1px solid var(--border-lt)`.

Section title: `.m-section-title` style: `"PARAMETERS"`.

Contains the same controls as the sheet but rendered inline (no sheet). At the bottom, a full-width `"Run suggestions"` button: `.btn .btn--accent .btn--full .btn--lg`. It is always visible (not just on change); it is the primary way to re-fetch on desktop.

An additional sub-section: `"PREFERRED CROPS"` — a note: `"Based on your setup preferences"` with up to 3 small crop name tags (if `preferred_crop_ids` resolves to known names). These are display-only, not editable on this page.

---

## 6. Results List

The main scrollable content area. `padding: 0`, no outer wrapper padding — the cards are edge-to-edge within the scroll region.

### 6a. Loading State

While `suggestionsState.loading === true`, render 4 skeleton cards. Each skeleton card:
- Height: 80px
- `background: var(--bg-card)`, `border-bottom: 1px solid var(--border-lt)`
- `padding: 16px 20px`
- Three shimmer bars (title placeholder 140px wide, subtitle 80px wide, progress bar 100% wide at 4px height), separated by 6px, with the same opacity pulse animation

### 6b. Error State

If `suggestionsState.error` is non-null, render a full-width error toast-style band:
```
  [!]  Could not load suggestions. [Retry]
```
Style: `background: rgba(217,79,79,0.08)`, `border: 1px solid rgba(217,79,79,0.2)`, `border-radius: var(--r-md)`, `margin: 16px 20px`, `padding: 14px 16px`. Error text in `var(--error)`. Retry button: `.btn .btn--secondary .btn--sm`.

### 6c. Empty State

If the API returns an empty array (e.g. plot is too small or all suitability scores are 0), render a centered empty state in the scrollable area:
- Plant SVG icon (stroke, 32x32, `color: var(--ink-3)`)
- Heading: `"No matches found"` — Space Grotesk 16px bold, `var(--ink)`
- Body: `"Try adjusting your plot size, tools, or budget in the filters."` — Inter 13px, `var(--ink-3)`, centered
- Button: `"Adjust filters"` — `.btn .btn--secondary` — taps to open the filter sheet

### 6d. Crop Card (Collapsed)

Each `SuggestionItem` renders as a card row. Cards are separated by `border-bottom: 1px solid var(--border-lt)`. Background: `var(--bg-card)` on the inner content area.

**Card anatomy (collapsed), left-to-right, vertically centered:**

```
┌──────────────────────────────────────────────┐
│  [SUITABILITY RING]  [TEXT BLOCK]   [CHEVRON] │
│                                               │
│  ████████████░░░░  suitability progress bar   │
└──────────────────────────────────────────────┘
```

**Suitability ring:** A circular progress ring (SVG, 44x44). Outer ring: `stroke: var(--border)`, `strokeWidth: 3`. Inner arc (filled portion): `stroke: var(--accent)` for >= 70%, `stroke: #4CAF50` for 80%+, `stroke: var(--ink-3)` for < 50%. The percentage number sits in the center: Inter 11px bold. The ring uses `stroke-dasharray` + `stroke-dashoffset` computed from `suitability_pct / 100`.

Note: a plain progress bar within the card (see below) is the second suitability indicator. The ring is the primary one.

**Text block** (flex: 1, min-width: 0, padding-left: 12px):
- Crop name: Inter 14px, `font-weight: 600`, `var(--ink)`. Single line, ellipsis overflow.
- Subtitle row: three pieces of micro-text separated by `·` in `var(--ink-3)`:
  - `"~1.8 kg yield"` (from `estimated_yield_kg`)
  - `"12 wks"` (from `grow_weeks`)
  - A suitability badge: if >= 80%: `.badge .badge--success` with text `"Great fit"`, if 60–79%: `.badge .badge--info` with `"Good fit"`, if < 60%: `.badge` plain with `"Fair fit"` in `var(--ink-3)`

**Progress bar** — full-width, at the bottom of the card, flush with edges (no horizontal margin). Height: 3px. This uses the `.pbar` / `.pbar-fill` classes. `pbar` background: `rgba(0,0,0,0.06)`. `pbar-fill` background: same color logic as the ring arc.

**Chevron** — right side, `var(--ink-3)`, 16x16, rotates 180deg when `expandedCropId === crop.crop_id`.

Full card padding: `14px 20px 0` (the progress bar is flush at bottom with no bottom padding, it sits below the content).

Card is fully tappable as a `button` or `div[role=button]`. Tap toggles `expandedCropId` between the card's `crop_id` and `null` (only one card open at a time).

### 6e. Crop Card (Expanded)

When `expandedCropId === crop.crop_id`, a detail panel slides in below the main row (CSS `max-height` transition from 0 to auto via a known max-height value, ~240px, `overflow: hidden`, `transition: max-height 0.22s ease`).

The expanded panel uses `padding: 0 20px 16px 20px`, `background: var(--bg-elev)` (slightly elevated from card bg), `border-top: 1px solid var(--border-lt)`.

**Expanded panel content:**

Row layout using the `.task-row` / `.task-lbl` / `.task-val` pattern:

| Label | Value |
|---|---|
| `WHY` | The `reason` string from the API response verbatim (e.g. `"87% suitability — pH 6.2 vs optimal 5.5–7.0, grows in 10 weeks"`) |
| `YIELD` | `"~1.8 kg estimated over 12 weeks"` |
| `GROW TIME` | `"12 weeks"` |

Then a divider (`border-top: 1px solid var(--border-lt)`, `margin: 12px 0`).

Then a button row (`.task-btns`):

- **"Start growing this"** — `.btn .btn--accent` — This is the primary CTA. Behavior: navigates to `/setup` with this `crop_id` passed as a URL query param or in router state (e.g. `navigate('/setup', { state: { cropId: crop.crop_id } })`). The Setup page would need to pre-select this crop. Since Setup.tsx changes are out of scope for this spec, this button's behavior is: for now, navigate to `/setup` and let the user pick manually, OR if the Setup flow already supports pre-selection via state, pass it.
- **"Dismiss"** — `.btn .btn--ghost .btn--sm` — collapses the card (sets `expandedCropId` to null).

### 6f. Sort Ordering (visual)

The results list renders in the currently selected sort order. The first card in the list (highest suitability by default) gets a subtle `"TOP PICK"` overline label in the top-right corner of the card, styled as `.overline` with `color: var(--accent)`. Only the first card gets this label.

---

## 7. Section Title Between Context Strip and Results

A `.m-section-title` band (the existing class: white bg, uppercase tiny label, border-bottom):

- Left text: `"MATCHING CROPS"` (or `"RESULTS — 12 CROPS"` once count is known)
- Right text: the current sort mode in the same `.overline` style: e.g. `"Sorted by suitability"`

This band is NOT sticky (unlike the filter bar above it). It sits as a normal flow element.

---

## 8. Navigation Back to Dashboard

**Back button in topbar** (described in section 3): calls `navigate(-1)`, which returns to wherever the user came from (Dashboard or wherever MenuSheet was opened from).

**Bottom Tab Bar:** The page renders a `BottomTabBar` with `activeTab="farm"` (neither tab is really "active" since this is a sub-page, but "farm" is closest). Tapping "My Farm" calls `navigate('/dashboard')`. Tapping the center `+` button opens the CropPickerSheet (same as Dashboard). Tapping "My Food" calls `navigate('/wallet')`.

On desktop there is no BottomTabBar. Navigation back is via the back button in the topbar or browser back.

---

## 9. Full Data Flow Summary

```
Component mounts
  └─ useAsync: getNode(farmId)            ─┐
  └─ useAsync: getSoilData(farmId)         ├─ parallel
                                           │
  Both resolve → build SuggestionRequest  ─┘
  └─ useAsync: POST /suggestions (body)
       └─ on success: store list[SuggestionItem] in state
       └─ on error: show error band with Retry

User changes a filter field
  └─ updates local `filters` state (no fetch yet on mobile)
  └─ "Apply & refresh" in sheet → triggers new POST /suggestions

User taps sort button
  └─ re-sorts existing results array in-place, no network call

User taps refresh icon (topbar)
  └─ triggers new POST /suggestions with current filters

User taps "Start growing this" on expanded card
  └─ navigate('/setup', { state: { cropId: X } })

User taps back arrow
  └─ navigate(-1)
```

---

## 10. Edge Cases and Guards

- **farmId is null:** Render a placeholder: `"No farm found. Please complete setup first."` with a `.btn .btn--accent` button that navigates to `/setup`. Identical to Dashboard's null-farmId guard.
- **API returns `preferred_crop_ids` crops that score 0:** They are already excluded server-side (the backend has `if suitability <= 0: continue`), so the frontend does not need to filter.
- **Single result:** Render normally; the "TOP PICK" label still applies to that one card.
- **Very long crop names:** The text block uses `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` to prevent layout breakage.
- **Sliders on mobile:** Use native `<input type="range">` with CSS-only thumb styling (`::-webkit-slider-thumb` — accent orange, 18px circle, no shadow). Track: full width, `border-radius: var(--r-pill)`, filled portion via a CSS custom property + linear-gradient trick.
- **Offline / network error on initial load of getNode or getSoilData:** The suggestion POST is still fired with partial data (the backend makes pH/moisture/temperature optional). An inline notice shows: `"Using estimated soil values — update via your dashboard."` as a `.toast .toast--w` (warning) variant, `background: rgba(232,145,58,0.1); border: 1px solid rgba(232,145,58,0.25); color: var(--accent)`.

---

## 11. Component Decomposition for Developer

The developer should split this into:

| Component | File location |
|---|---|
| `Suggestions` (page) | `pages/Suggestions.tsx` |
| `SuggestionCard` | `components/suggestions/SuggestionCard.tsx` |
| `SuggestionFilterSheet` | `components/sheets/SuggestionFilterSheet.tsx` |
| `SuggestionFilterSidebar` | `components/suggestions/SuggestionFilterSidebar.tsx` |
| `SuitabilityRing` | `components/shared/SuitabilityRing.tsx` |

A new type should be added to `types.ts`:
```
SuggestionItem { crop_id, crop_name, suitability_pct, estimated_yield_kg, grow_weeks, reason }
SuggestionRequest { plot_size_sqft, plot_type, tools, budget, pH?, moisture?, temperature?, preferred_crop_ids }
```

A new function should be added to `services/api.ts`:
```
getSuggestions(body: SuggestionRequest): Promise<SuggestionItem[]>
  → POST /suggestions
```

---

## 12. CSS Classes Reference for Implementor

All CSS classes used are already present in the design system:

- Layout shells: `.shell`, `.m-only`, `.d-only`
- Topbar: `.m-topbar`, `.m-topbar-logo`, `.m-topbar-name`, `.m-topbar-dot`, `.m-topbar-actions`
- Sections: `.m-section`, `.m-section-title`, `.m-content`
- Cards/elevation: `.bg-card` (`var(--bg-card)`), `.data-widget`, `.data-widget-header`
- Buttons: `.btn`, `.btn--primary`, `.btn--accent`, `.btn--secondary`, `.btn--ghost`, `.btn--sm`, `.btn--lg`, `.btn--full`, `.btn--icon`
- Badges: `.badge`, `.badge--success`, `.badge--info`, `.badge--error`
- Progress bar: `.pbar`, `.pbar-fill`
- Typography: `.overline`, `.task-lbl`, `.task-val`, `.task-row`
- Sheets: `.sheet-backdrop`, `.bottom-sheet`, `.sheet-handle`, `.sheet-title`, `.sheet-body`
- Toast/alert: `.toast`, `.toast--e` (error)
- Expand detail rows: `.task-expand`, `.task-btns`

One new CSS element needed (not in existing design system): the circular suitability ring. This is a pure SVG component — no new CSS class required. The `SuitabilityRing` component takes a `pct: number` prop and renders a 44x44 SVG inline.