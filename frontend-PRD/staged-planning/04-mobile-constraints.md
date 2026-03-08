# Mobile Constraints

## Agent Instructions

You are implementing or auditing mobile-specific behavior for the farmer frontend.

1. Read `../04-layouts.md` — all layout decisions are mobile-first. This file adds interaction and constraint rules.
2. Read `../03-key-features.md` — features like AR and OCR have specific mobile behaviors.
3. Run `do dis` via MCP to check if any responsive utilities or viewport config already exists.
4. Test every screen at 375px width (iPhone SE baseline). Nothing should overflow or be unreachable at that size.

---

## Baseline Constraints

| Constraint | Rule |
|-----------|------|
| Minimum supported width | 375px |
| Touch target size | Minimum 44×44px for all interactive elements |
| Font size | Minimum 16px for body text (prevents iOS auto-zoom on inputs) |
| Tap highlight | Custom or removed — no default blue flash |
| Scroll | Vertical only on all main screens. No horizontal scroll. |
| Viewport | `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">` — prevent zoom on form focus |

---

## Input Handling (Mobile Keyboards)

| Field type | Correct input mode |
|-----------|-------------------|
| Numbers (pH, depth, temp) | `inputMode="decimal"` — shows numeric pad with decimal |
| Integers (days, cm) | `inputMode="numeric"` — shows numeric pad no decimal |
| Email | `type="email"` — shows email keyboard |
| Address / name | `type="text"` `autoCapitalize="words"` |
| Notes / free text | `type="text"` `autoCapitalize="sentences"` |

Never use `type="number"` for soil/climate fields — it allows `e`, `+`, `-` which are invalid.

---

## Form Scrolling (Multi-Step Onboarding)

- When a validation error occurs, scroll the page to bring the first error field into view
- When the keyboard opens on mobile, the focused input must not be hidden behind it
  - Use `scrollIntoView({ behavior: "smooth", block: "center" })` on focus for inputs near the bottom of the screen
- Each onboarding step fits in one viewport where possible. If it doesn't, it scrolls naturally — do not paginate within a step.

---

## Camera & AR

### AR (WebXR)
- Only render the AR option if `navigator.xr?.isSessionSupported("immersive-ar")` returns true
- Request camera permission explicitly with a pre-prompt: "We need your camera to measure your plot"
- If permission denied: show message + offer Photo fallback
- AR session must be dismissible with a visible close/cancel button

### OCR Camera
- Use `<input type="file" accept="image/*" capture="environment">` to trigger rear camera directly on mobile
- Also allow gallery selection (no `capture` attribute version as fallback)
- Show a preview of the captured image before sending to OCR

---

## Bottom Navigation

- Fixed to the bottom of the viewport (`position: fixed; bottom: 0`)
- Safe area inset on iOS: `padding-bottom: env(safe-area-inset-bottom)` — avoids home bar overlap
- Height: 56px + safe area
- Main content: `padding-bottom` equal to nav height + safe area so content isn't obscured

---

## Maps (Hub Selection)

- Map view in the delivery flow must be touch-scrollable without accidentally triggering page scroll
- Use `touch-action: none` on the map container to give it full touch control
- Always provide a list fallback below the map — some users prefer scrolling a list to pinching a map
- Hub list sorted by distance ascending

---

## Offline Behavior

- Detect connectivity via `navigator.onLine` + `online`/`offline` events
- Show a non-intrusive banner at the top of the screen when offline: "You're offline — changes will sync when you reconnect"
- Forms: allow full completion offline; store draft in `localStorage`
- Sync queue: on reconnect, attempt pending POSTs in order
- Do not disable form submit buttons when offline — let users complete input; just queue the submit

---

## Performance on Low-End Devices

- No heavy animations during form transitions — simple opacity fade is sufficient
- Lazy-load the AR/WebXR module (it's large) — only import when user taps AR option
- Lazy-load the map component — only import when user opens the delivery hub selection
- Image uploads: compress client-side before sending (target < 500KB for OCR photos)
- Skeleton loaders are CSS-only (no JS animation libraries needed)

---

## Outdoor Readability

Farmers use this app outdoors in variable lighting.

- Minimum contrast ratio: 4.5:1 for all text (WCAG AA)
- Avoid light grey on white — use high-contrast combinations
- Critical info (task due dates, risk flags, balance) should be legible in direct sunlight — consider slightly larger text or bold weight for these
- Dark background scheme (matches the nodalnetwork.html aesthetic) is better for OLED screens in bright conditions than a white background
