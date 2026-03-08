# Implementation Overview — MyCelium User Frontend

[MODE: DISCOVER]

## What We Are Building

The farmer-facing frontend for MyCelium. The existing `app/frontend/` is a React + TypeScript + Vite
project currently used only for the admin dashboard. We are adding a parallel user-facing app within
the same project, or scoped under a dedicated route tree.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 + TypeScript | Already in project |
| Build | Vite | Already in project |
| Routing | React Router v6 | Standard, matches `/dashboard`, `/wallet`, etc. |
| Styling | CSS Modules + CSS custom properties | Skeleton uses CSS vars — map them directly, no new system needed |
| Charts | Recharts | Already in package.json |
| State | React context + localStorage | No auth, no complex global state — context for farm identity, localStorage for persistence |
| HTTP | `fetch` in typed service layer | No axios needed at this scale |
| Maps | @vis.gl/react-google-maps | Already in package.json — for hub picker |

**NOT adding:** Redux, Zustand, Supabase (no auth in PRD v1), React Query (overkill for this scope).

---

## Folder Structure

```
app/frontend/src/
├── main.tsx                  # entry, wrap with providers
├── App.tsx                   # router: admin routes + user routes
│
├── user/                     # ALL user-facing code lives here
│   ├── pages/
│   │   ├── Landing.tsx       # /
│   │   ├── Suggestions.tsx   # /suggestions
│   │   ├── Setup.tsx         # /setup (4-step onboarding)
│   │   ├── Dashboard.tsx     # /dashboard
│   │   ├── Update.tsx        # /update
│   │   ├── Wallet.tsx        # /wallet
│   │   └── Profile.tsx       # /profile
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx             # .shell wrapper
│   │   │   ├── MobileTopbar.tsx      # .m-topbar
│   │   │   ├── DesktopTopbar.tsx     # .d-topbar
│   │   │   ├── DesktopNav.tsx        # .d-nav strip
│   │   │   └── BottomTabBar.tsx      # .m-tabbar
│   │   │
│   │   ├── dashboard/
│   │   │   ├── HeroSection.tsx       # .m-hero / .d-hero
│   │   │   ├── TaskList.tsx          # .m-section tasks wrapper
│   │   │   ├── TaskItem.tsx          # details.task-item
│   │   │   ├── DataWidget.tsx        # .data-widget
│   │   │   ├── DataTrendsChart.tsx   # details.viz-collapse / .viz-panel
│   │   │   └── StatsRow.tsx          # .m-stat-row
│   │   │
│   │   ├── sheets/
│   │   │   ├── BottomSheet.tsx       # reusable .bottom-sheet wrapper
│   │   │   ├── CropPickerSheet.tsx   # crop selector
│   │   │   └── MenuSheet.tsx         # hamburger menu
│   │   │
│   │   ├── wallet/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   └── DeliveryForm.tsx
│   │   │
│   │   ├── setup/
│   │   │   ├── StepPlotBasics.tsx
│   │   │   ├── StepSoil.tsx
│   │   │   ├── StepClimate.tsx
│   │   │   ├── StepResources.tsx
│   │   │   └── SetupReview.tsx
│   │   │
│   │   └── shared/
│   │       ├── Badge.tsx
│   │       ├── Toggle.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── Button.tsx
│   │       └── LoadingState.tsx
│   │
│   ├── services/
│   │   └── api.ts            # all typed fetch functions
│   │
│   ├── hooks/
│   │   ├── useFarm.ts        # read/write farm identity from localStorage
│   │   ├── useNode.ts        # GET /nodes/{id} — current bundle
│   │   ├── useBalance.ts     # GET /nodes/{id}/balance
│   │   ├── useLedger.ts      # GET /ledger?node_id=X
│   │   ├── useHubs.ts        # GET /hubs
│   │   └── useCrops.ts       # GET /crops
│   │
│   ├── store/
│   │   └── FarmContext.tsx   # FarmProvider: farm_id, bundle, task states
│   │
│   ├── tokens.ts             # CSS var values as TS constants (for Recharts)
│   └── types.ts              # all shared TypeScript types
│
└── (existing admin files unchanged)
```

---

## Design Token Mapping

From skeleton `:root` → `src/user/tokens.ts`:

```ts
export const tokens = {
  bg:        '#E8E5E0',
  bgWarm:    '#DDD9D3',
  bgCard:    '#F2F0EC',
  bgElev:    '#FFFFFF',
  ink:       '#1A1A1A',
  ink2:      '#6B6762',
  ink3:      '#9E9A94',
  inv:       '#F2F0EC',
  accent:    '#E8913A',
  accentBg:  'rgba(232,145,58,0.12)',
  border:    '#D1CDC7',
  borderLt:  '#E2DFD9',
  success:   '#4CAF50',
  error:     '#D94F4F',
  info:      '#5B8DEF',
} as const;
```

The skeleton's CSS is imported directly as a global stylesheet (copy the `:root` block + all classes
into `src/user/user.css`). Components use the class names from the skeleton unchanged.

---

## Key Architectural Decisions

1. **No auth.** Identity = `farm_id` in `localStorage`. On first load, check if `farm_id` exists.
   If not → Landing page. If yes → Dashboard. This is a simple boolean gate via `FarmContext`.

2. **No Supabase.** The PRD mentions it but the API is pure FastAPI with no Supabase integration
   visible. We poll for updates instead of using Realtime.

3. **API base URL.** `http://localhost:8000` in dev. Configurable via `VITE_API_BASE_URL` env var.

4. **Skeleton → React.** The HTML skeleton defines the exact class names and structure. Components
   are a 1:1 mapping — no redesign. CSS is copied verbatim from the skeleton into `user.css`.

5. **Task list is client-generated.** The API returns crop assignments, not structured task lists.
   Tasks are derived from a per-crop template (see `04-functional-gaps.md`).

6. **Local-first task state.** Task completion (done/skip) is stored in localStorage keyed by
   `{farm_id}:tasks:{cycle_key}`. Synced to backend on cycle update submit.
