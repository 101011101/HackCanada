# UI Kit — Reference

---

## Files

| File | Purpose |
|---|---|
| `mobile-ui-kit.html` | Mobile-only component showcase. All kit elements in stacked, full-bleed mobile layout. Reference for individual components. |
| `desktop-ui-kit.html` | Desktop-only layout pattern showcase. 7 full-page layout patterns (hero, icon cards, three-split, big+panels, wide banner, sidebar, mosaic). Reference for page-level structure. |
| `ui-kit-responsive.html` | **Primary build reference.** Single file that switches between mobile and desktop at 768px. Contains both layouts with `.m-only`/`.d-only` visibility classes. Use this as the template when building actual screens. |
| `styles.css` | Token definitions and base component styles for the original mobile kit. Import or copy from here when starting a new file. |
| `app.js` | JavaScript for interactive kit demos (toggle state, tab switching, toast dismiss). Not required for static screens. |

---

## Color Palette

All colors are defined as CSS custom properties on `:root`.

### Backgrounds
| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#E8E5E0` | Page / shell background |
| `--color-bg-warm` | `#DDD9D3` | Section title strips, subtle tint areas |
| `--color-bg-card` | `#F2F0EC` | Card surfaces, input backgrounds |
| `--color-bg-elevated` | `#FFFFFF` | Elevated cards, modals |

### Text
| Token | Value | Use |
|---|---|---|
| `--color-text-primary` | `#1A1A1A` | Body copy, headings |
| `--color-text-secondary` | `#6B6762` | Supporting text, labels |
| `--color-text-tertiary` | `#9E9A94` | Timestamps, metadata, placeholders |
| `--color-text-inverse` | `#F2F0EC` | Text on dark surfaces |

### Accent
| Token | Value | Use |
|---|---|---|
| `--color-accent` | `#E8913A` | Primary CTAs, active states, fills |
| `--color-accent-light` | `#F5C991` | Hover tints, accent highlights |
| `--color-accent-bg` | `rgba(232,145,58,0.12)` | Soft accent backgrounds |

### Borders & Utility
| Token | Value | Use |
|---|---|---|
| `--color-border` | `#D1CDC7` | Strong dividers, card outlines |
| `--color-border-light` | `#E2DFD9` | Subtle row separators |
| `--color-black` | `#1A1A1A` | Toast backgrounds, absolute darks |
| `--color-white` | `#FFFFFF` | Pure white surfaces |

### Semantic
| Token | Value | Use |
|---|---|---|
| `--color-success` | `#4CAF50` | Success toasts, positive states |
| `--color-error` | `#D94F4F` | Error toasts, destructive actions |
| `--color-info` | `#5B8DEF` | Info badges, links |

---

## Typography

### Fonts
| Token | Family | Use |
|---|---|---|
| `--font-body` | Inter | All body copy, labels, UI text |
| `--font-display` | Space Grotesk | Headings (`.type-xl` and above) |

### Type Scale
| Token | Size | Use |
|---|---|---|
| `--text-xs` | 11px | Labels, metadata, uppercase caps |
| `--text-sm` | 13px | Supporting text, captions |
| `--text-base` | 15px | Body copy, inputs |
| `--text-lg` | 17px | Emphasis, slightly larger body |
| `--text-xl` | 20px | Section headings (Space Grotesk) |
| `--text-2xl` | 24px | Card titles, page sub-headings |
| `--text-3xl` | 30px | Large headings |
| `--text-4xl` | 40px | Hero headings |
| `--text-5xl` | 56px | Display headings |
| `--text-hero` | 72px | Full-page hero text |

### Type Classes
Apply these directly to elements:
```html
<span class="type-xs">Metadata</span>
<span class="type-base">Body copy</span>
<span class="type-xl">Section heading</span>
<span class="type-hero">Hero display</span>
```
Display font (Space Grotesk) kicks in automatically for `.type-xl` and above.

---

## Spacing

Based on a 4px grid. Use tokens — never raw pixel values.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

`--side-pad: 20px` — the standard horizontal inset for Layer 2 content.

---

## Padding & Margin Conventions (Layering System)

Elements follow a strict 4-layer nesting model. Each layer inward gets more padding.

### Layer 0 — Canvas
The raw page background. No padding, no margin. Full bleed.
```
body, .kit-shell
```

### Layer 1 — Sections / Full-bleed Zones
Full-width structural elements. Zero horizontal padding — they touch the shell edges. Only vertical padding allowed.
```
.kit-section        — section wrapper, border-bottom divider
.kit-section-title  — the label strip (e.g. "08 — Cards"), has side-pad for its own text
.topbar             — app top navigation bar
.tab-bar            — bottom navigation
```
> Dividers at this layer are always full-bleed.

### Layer 2 — Content Areas
Content rows and inset areas. Side padding = `--side-pad` (20px).
```
.section-content    — padding: 20px (top/bottom) + 20px (left/right)
.kit-row            — padding: 16px (top/bottom) + 20px (left/right)
.list-item          — padding: 14px (top/bottom) + 20px (left/right)
.type-scale__item   — padding: 12px (top/bottom) + 20px (left/right)
.spacing-item       — padding: 10px (top/bottom) + 20px (left/right)
.kit-subsection-label — padding: 16px top + 20px sides + 8px bottom
```

### Layer 3 — Cards & Panels
Self-contained boxes with their own background. Internal padding `--space-5` (20px) on all sides. Rounded corners.
```
.card               — padding: 20px, border-radius: --radius-md
.bottom-sheet       — slide-up panel
.modal              — blocking overlay dialog
```

### Layer 4 — Interactive Elements
Buttons, inputs, badges — intrinsic sizing, own internal padding.
```
.btn                — padding: 10px 18px (default)
.input              — padding: 10px 14px, height: 44px
.badge              — padding: 3px 8px
.toast              — padding: 10px 16px
```

---

## Border Radius

Sharp by default. Pills are reserved only for specific functional elements.

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 2px | Badges, chips, small tags |
| `--radius-sm` | 4px | Inputs, toasts, buttons |
| `--radius-md` | 6px | Cards, panels, modals |
| `--radius-full` | 999px | **Pills only** — see rule below |

### Pill rule
`--radius-full` is only allowed on:
- `.toggle` — on/off switches
- `.progress-bar` and `.progress-bar__fill` — progress tracks
- `.slider` — range slider track
- `.dot-indicator__dot--active` — active carousel dot

Everything else uses `--radius-xs` through `--radius-md`.

---

## Shadows

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(26,26,26,0.06)` | Subtle card lift |
| `--shadow-md` | `0 4px 12px rgba(26,26,26,0.08)` | Hover states, elevated cards |
| `--shadow-lg` | `0 8px 24px rgba(26,26,26,0.10)` | Modals, toasts, bottom sheets |

---

## Animation

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Standard transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy / playful interactions |
| `--dur-fast` | 150ms | Hover states, small toggles |
| `--dur-normal` | 250ms | Most transitions |
| `--dur-slow` | 400ms | Page-level transitions |

---

## Elements Reference

### Layout
| Class | Description |
|---|---|
| `.kit-shell` | Full-width app wrapper, min-height 100vh |
| `.kit-section` | Thematic section block with border-bottom divider |
| `.kit-section-title` | Full-bleed label strip (warm tint background) |
| `.section-content` | Padded content area inside a section |
| `.kit-row` | Horizontal flex row of items |
| `.kit-row--center` | Vertically centered row |
| `.kit-row--col` | Vertical stack row |
| `.kit-subsection-label` | Secondary label inside a section |

### Navigation
| Class | Description |
|---|---|
| `.topbar` | Sticky top navigation bar |
| `.tab-bar` | Bottom tab navigation (mobile) |
| `.nav-item` | Single tab bar button |
| `.nav-item.active` | Active tab state |
| `.segmented` | Segmented control (multi-option switcher) |
| `.segmented__option.active` | Selected option |

### Buttons
| Class | Description |
|---|---|
| `.btn` | Base button (requires a variant) |
| `.btn--primary` | Filled accent button |
| `.btn--secondary` | Outlined button |
| `.btn--ghost` | Text-only button |
| `.btn--danger` | Destructive red button |
| `.btn--sm` | Small size modifier |
| `.btn--lg` | Large size modifier |

### Form Elements
| Class | Description |
|---|---|
| `.input` | Text input, full width |
| `.input-group` | Label + input wrapper |
| `.input-label` | Field label (uppercase, small) |
| `.search` | Input with leading search icon |
| `.toggle` | On/off switch (pill shaped) |
| `.toggle--active` | Active/on state |
| `.slider` | Range slider input |

### Cards
| Class | Description |
|---|---|
| `.card` | Base card surface |
| `.card--elevated` | White card with drop shadow |
| `.card--accent-border` | Card with left accent stripe |
| `.card__header` | Title row inside card |
| `.card__body` | Body text area inside card |
| `.card__footer` | Action row at bottom of card |
| `.stat-card` | Large centered metric display |

### Feedback
| Class | Description |
|---|---|
| `.toast` | Dark notification bar |
| `.toast--success` | Green variant |
| `.toast--error` | Red variant |
| `.progress-bar` | Pill-track progress container |
| `.progress-bar__fill` | Filled portion (set width via inline style) |
| `.dot-indicator` | Carousel position dots |
| `.dot-indicator__dot--active` | Active pill dot |
| `.badge` | Small label tag |
| `.badge--accent` | Orange accent badge |
| `.badge--success` | Green badge |
| `.badge--error` | Red badge |

### Lists
| Class | Description |
|---|---|
| `.list-item` | Row with icon, label, optional right content |
| `.list-item__icon` | Left icon area |
| `.list-item__label` | Primary row text |
| `.list-item__sub` | Secondary row text |
| `.list-item__right` | Right-aligned content (chevron, value) |

### Overlays
| Class | Description |
|---|---|
| `.bottom-sheet` | Slide-up panel from bottom of screen |
| `.bottom-sheet__handle` | Grey drag handle bar at top |

---

## Icons

No icon font or external library. All icons are inline SVGs embedded directly in the HTML. Standard size: `16x16` or `24x24`. Stroke width: `1.5–2px`. Color: `currentColor` so they inherit from the parent text color.

---

## No-emoji rule

Zero emoji characters anywhere in the kit. All visual indicators use inline SVGs.

---

## Desktop Layout Guide

### Breakpoint
Single breakpoint at `768px`. Everything below is mobile; `768px` and above is desktop.

```css
@media (min-width: 768px) { /* desktop styles */ }
@media (max-width: 767px) { /* mobile styles */ }
```

### Visibility Classes
| Class | Visible on | Hidden on |
|---|---|---|
| `.d-only` | Desktop (768px+) | Mobile (hidden via `display: none !important` in `max-width: 767px` query) |
| `.m-only` | Mobile | Desktop (hidden via `display: none !important` in `min-width: 768px` query) |

**Critical rule:** Never set `display: flex !important` or any specific display value on `.d-only` in the desktop query. Let each element's own CSS define its `display` type. Only use the visibility classes to hide on the wrong viewport.

### Layout Patterns (from `desktop-ui-kit.html`)

#### Hero Banner
Full-width panel with large headline, supporting text, and CTA. Use for page entry points, onboarding, and marketing sections.
```
[ Large headline text                    ]
[ Supporting copy                [CTA]   ]
```

#### Icon Cards (4-col grid)
Equal-width cards in a row, each with an icon, title, and short description. Use for feature lists, stat highlights, or category navigation.
```
[ Icon ] [ Icon ] [ Icon ] [ Icon ]
[ Card ] [ Card ] [ Card ] [ Card ]
```

#### Three-Split
Three equal columns side by side. Use for dashboards, comparison views, or grouped data panels.
```
[ Col 1 ] [ Col 2 ] [ Col 3 ]
```

#### Big + Two Panels (horizontal)
One large panel on the left (2/3 width) with two stacked smaller panels on the right (1/3 width each). Use for primary content with supporting context.
```
[                ] [ Small ]
[ Large          ] [-------]
[                ] [ Small ]
```

#### Wide Top / Halves / Wide Bottom
Stacked layout: one full-width panel on top, two equal halves in the middle, one full-width panel on the bottom. Use for dashboard summaries.
```
[ Full width top  ]
[ Half ] [ Half  ]
[ Full width bottom ]
```

#### Sidebar + Content
Fixed-width sidebar on the left (~260px) with a scrollable content area on the right. Use for navigation-heavy apps, settings pages, or doc browsers.
```
[ Sidebar ] [ Main content area        ]
```

#### Mosaic (mixed grid)
Asymmetric grid: one tall panel on the left spanning two rows, two shorter panels stacked on the right. Use for media galleries, featured + related content.
```
[        ] [ Small ]
[ Tall   ] [-------]
[        ] [ Small ]
```

### Composing Screens
1. Pick a layout pattern as the page skeleton.
2. Fill each panel/column with card or list-item components.
3. Use `.card--elevated` for primary panels, `.card` for secondary panels.
4. Keep the topbar in Layer 1 (full-bleed, sticky). Sidebar counts as Layer 1.
5. Content inside panels follows Layer 2–4 padding rules normally.

---

## Glossary

### Structure
| Term | Definition |
|---|---|
| **Shell** | The outermost wrapper of the app (`.kit-shell`). Full-width, min-height 100vh. Never has horizontal padding — it IS the canvas. |
| **Section** | A thematic block of content (`.kit-section`). Full-bleed, separated from adjacent sections by a border-bottom divider. |
| **Section title** | The label strip at the top of a section (`.kit-section-title`). Warm tint background, full-bleed. E.g. "01 — Colors". |
| **Panel** | A rectangular content region within a layout. Can be a card, a sidebar, or a grid cell. Not a specific class — it describes intent. |
| **Divider** | A horizontal or vertical line separating content. At Layer 1 it is always full-bleed (border-bottom on `.kit-section`). |
| **Layer** | The nesting depth of an element in the padding system. Layer 0 = canvas, Layer 1 = sections, Layer 2 = content rows, Layer 3 = cards, Layer 4 = interactive elements. |

### Navigation
| Term | Definition |
|---|---|
| **Topbar** | Sticky horizontal bar at the top of the app (`.topbar`). Contains the app title and primary actions. Layer 1 element. |
| **Tab bar** | Fixed horizontal bar at the bottom of the screen (`.tab-bar`). Contains primary navigation icons for mobile. Layer 1 element. |
| **Segmented control** | A row of mutually exclusive options displayed as a pill group (`.segmented`). Like radio buttons but rendered as a button bar. |
| **Sidebar** | Vertical navigation or filter panel on the left side of a desktop layout. Fixed width (~260px), full app height. |

### Content Elements
| Term | Definition |
|---|---|
| **Card** | A self-contained box with its own background, padding, and rounded corners (`.card`). Layer 3 element. Contains header, body, footer sub-elements. |
| **Elevated card** | A card on a white (`#FFFFFF`) surface with a drop shadow (`.card--elevated`). Used to make content appear above the page background. |
| **Stat card** | A card variant showing a large centered metric — number, label, and optional delta (`.stat-card`). |
| **List item** | A full-width row with a left icon, primary label, optional sub-label, and optional right content (`.list-item`). Standard for settings rows, search results, and data lists. |
| **Overline** | Small uppercase label placed above a heading or section. Typically uses `.type-xs` with letter-spacing. Provides context category. |
| **Hero** | A large-format section with a display-size headline and prominent CTA. Uses `.type-4xl` or `.type-hero`. |

### Feedback & Status
| Term | Definition |
|---|---|
| **Toast** | A transient notification bar that appears briefly then disappears (`.toast`). Dark background by default; success/error variants available. |
| **Badge** | A small inline label indicating status, count, or category (`.badge`). Uses `--radius-xs`. Accent, success, and error variants. |
| **Chip** | A compact interactive tag, similar to a badge but tappable. Typically used for filters or multi-select. Rendered like a small `.btn--secondary`. |
| **Progress bar** | A pill-shaped track showing completion percentage (`.progress-bar`). Uses `--radius-full` (pill rule exception). |
| **Dot indicator** | A row of small dots showing position in a carousel or multi-step flow (`.dot-indicator`). Active dot uses `--radius-full`. |

### Overlays
| Term | Definition |
|---|---|
| **Modal** | A blocking overlay dialog that prevents interaction with the page behind it (`.modal`). Requires a backdrop. Layer 3 element. |
| **Bottom sheet** | A panel that slides up from the bottom of the screen (`.bottom-sheet`). Non-blocking alternative to modals on mobile. Has a grey drag handle at the top. |
| **Backdrop** | A semi-transparent dark overlay behind a modal or bottom sheet. Signals the page is blocked. |
| **Drawer** | A panel that slides in from the left or right edge of the screen. Similar to a sidebar but overlays content on mobile. |

### Interactive Elements
| Term | Definition |
|---|---|
| **Toggle** | An on/off switch rendered as a pill (`.toggle`). Uses `--radius-full` (pill rule exception). |
| **Slider** | A range input for selecting a value along a track (`.slider`). Uses `--radius-full` on the track (pill rule exception). |
| **CTA** | Call to action. A primary button (`.btn--primary`) that initiates the main desired action on a screen. |
| **Ghost button** | A text-only button with no background or border (`.btn--ghost`). Used for low-emphasis secondary actions. |
| **Input group** | A label + input field combination (`.input-group`). The label uses `.input-label` (uppercase, small). |

### Visual
| Term | Definition |
|---|---|
| **Token** | A named CSS custom property (CSS variable) for a design value — color, spacing, radius, etc. E.g. `--color-accent`, `--space-4`. Always use tokens; never hardcode raw values. |
| **Accent** | The primary brand color (`--color-accent`, orange `#E8913A`). Used for CTAs, active states, and highlights. |
| **Tint** | A semi-transparent or lightened version of a color. E.g. `--color-accent-bg` is the accent at 12% opacity — used for soft backgrounds. |
| **Full-bleed** | An element that spans the full width of its container with no horizontal margin or padding, touching both edges. |
| **Inline SVG** | An SVG icon written directly in the HTML rather than loaded from a file or icon font. All icons in this kit are inline SVGs using `currentColor`. |
