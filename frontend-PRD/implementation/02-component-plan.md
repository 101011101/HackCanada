# Component Plan

[MODE: DISCOVER]

Source of truth for layout/class names: `frontend-PRD/final/user-dashboard.html`.
Every component maps to skeleton class names directly.

---

## Shared / Primitive Components

### `Button`
```ts
props: {
  variant: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}
```
Classes: `.btn`, `.btn--primary/secondary/accent/ghost`, `.btn--sm/lg`, `.btn--full`, `.btn--icon`

### `Badge`
```ts
props: { variant: 'success' | 'error' | 'info'; children: ReactNode }
```
Classes: `.badge`, `.badge--success/error/info`

### `Toggle`
```ts
props: { on: boolean; onChange: (on: boolean) => void }
```
Classes: `.toggle`, `.toggle--on`, `.toggle__k`

### `ProgressBar`
```ts
props: { value: number }  // 0–100
```
Classes: `.pbar`, `.pbar-fill`

### `BottomSheet`
```ts
props: { open: boolean; onClose: () => void; title: string; children: ReactNode }
```
Classes: `.sheet-backdrop`, `.bottom-sheet`, `.sheet-handle`, `.sheet-title`, `.sheet-body`
Handles open/close animation via `.open` class toggling.

### `LoadingState`
```ts
props: { message?: string }
```
Generic spinner/skeleton for async loading.

---

## Layout Components

### `Shell`
Wraps all user pages. Renders mobile shell (`.shell.m-only`) and desktop shell (`.shell.d-only`).
Controls which layout is active.

### `MobileTopbar`
```ts
props: { onOpenMenu: () => void }
```
Classes: `.m-topbar`, `.m-topbar-logo`, `.m-topbar-actions`
Logo: MyCelium + dot. Actions: avatar button + hamburger → calls `onOpenMenu`.

### `DesktopTopbar`
Classes: `.d-topbar`
Shows "My Farm · My Food" nav links + hamburger + avatar.

### `DesktopNav`
```ts
props: { activeView: 'tasks' | 'zone'; onSelect: (view) => void; onOpenCropPicker: () => void }
```
Classes: `.d-nav`, `.d-nav-item`, `.d-nav-item--on`, `.d-nav-crop-btn`

### `BottomTabBar`
```ts
props: { activeTab: 'farm' | 'food'; onAddPlot: () => void }
```
Classes: `.m-tabbar`, `.m-tab`, `.m-tab--on`, `.m-tab-add`, `.m-tab-dot`
Tabs: My Farm | + (add plot) | My Food

---

## Dashboard Page Components

### `HeroSection` (mobile)
```ts
props: {
  cycleNumber: number;
  cycleStart: string;    // "Mar 7"
  cycleEnd: string;      // "Mar 21"
  dayOfCycle: number;
  totalDays: number;
  targetKg: number;
  totalGrownKg: number;
  monthsFarming: number;
}
```
Classes: `.m-hero`, `.hero-cycle`, `.hero-dates`, `.hero-epoch`, `.hero-progress`, `.hero-stats`
Progress bar: `(dayOfCycle / totalDays) * 100`

### `DesktopHero`
Same data as above.
Classes: `.d-hero`, `.d-hero-content`, `.d-hero-stats`
Extra: "Log today's update" CTA button → navigates to `/update`

### `TaskList`
```ts
props: {
  tasks: Task[];
  onToggle: (taskId: string, done: boolean) => void;
  onSkip: (taskId: string) => void;
}
```
Classes: `.m-section`, `.m-section-title`
Renders list of `TaskItem` components.

### `TaskItem`
```ts
props: {
  task: Task;
  onToggle: (done: boolean) => void;
  onSkip: () => void;
}
```
Classes: `details.task-item`, `summary`, `.task-main`, `.task-expand`, `.task-lbl`, `.task-val`
State: done (strikethrough + Done badge), urgent (error badge), collapsed/expanded.

Task type:
```ts
interface Task {
  id: string;
  title: string;
  subtitle: string;          // "Watering can · 10 min"
  why: string;
  how?: string;
  amount?: string;
  target?: string;
  tools?: string;
  noClothFallback?: string;  // for frost tasks
  done: boolean;
  urgent: boolean;
  urgentLabel?: string;      // "Before 8 PM"
}
```

### `DesktopTaskPanel`
```ts
props: {
  tasks: Task[];
  selectedId: string;
  onSelect: (taskId: string) => void;
  onMarkDone: (taskId: string) => void;
  onSkip: (taskId: string) => void;
}
```
Classes: `.d-task-panel`, `.d-task-list`, `.d-task-row`, `.d-task-row.active`, `.d-task-detail`
Left panel: list. Right panel: detail of selected task.

### `DataWidget`
```ts
props: {
  zoneName: string;
  updatedMinutesAgo: number;
  moisture: { value: number; status: 'Optimal' | 'Low' | 'High' };
  temperature: { value: number; delta: string };  // delta: "−2° today"
  sunlight: { value: number; status: string };    // "6.2h"
}
```
Classes: `.data-widget`, `.data-readings`, `.data-reading`, `.data-reading-val`, etc.

### `DataTrendsChart` (mobile — collapsible)
```ts
props: {
  data: Array<{ date: string; value: number }>;
  metric: 'moisture' | 'temp' | 'light';
  onMetricChange: (m: string) => void;
}
```
Classes: `details.viz-collapse`, `.viz-body`, `.chart-tabs`, `.chart-legend`
Uses Recharts `AreaChart` (replaces inline SVG).

### `DesktopVizPanel`
Same data, but rendered in `.viz-panel` (not collapsible).
Classes: `.viz-panel`, `.viz-panel-header`, `.viz-panel-body`

### `StatsRow`
```ts
props: {
  totalGrownKg: number;
  cyclesComplete: number;
  thisTargetKg: number;
  dayOfCycle: number;
  totalDays: number;
  deltaKg: number;   // vs average
}
```
Classes: `.m-stat-row`, `.m-stat-card`, `.m-stat-val`, `.m-stat-delta`

### `CropPickerSheet`
```ts
props: {
  open: boolean;
  onClose: () => void;
  crops: Array<{ id: number; name: string; zone: string; cycle: number }>;
  selectedCropId: number | null;
  onSelect: (cropId: number | null) => void;
  onAddPlot: () => void;
}
```
"All zones" option at top. Crop icon + name + zone/cycle subtitle.

### `MenuSheet`
```ts
props: {
  open: boolean;
  onClose: () => void;
  onCropSuggestions: () => void;
  onRequestAssistance: () => void;
  onRestartCycle: () => void;
  onProfile: () => void;
  onReportProblem: () => void;
}
```
5 menu items matching skeleton. "Report a problem" is `.menu-item--danger`.

---

## Onboarding (`/setup`)

### `Setup` (page)
Manages step state (1–4 + review). Holds draft in localStorage.
On submit: calls `createNode()` → saves farm_id → navigate to `/dashboard`.

### `StepPlotBasics`
Fields: farm name (text), location (GPS button → lat/lng), plot size (number, sqft), plot type (radio: balcony/rooftop/backyard/community).

### `StepSoil`
Fields: pH (number, default 7.0), moisture (number, default 50), with "Use defaults" skip.
OCR camera icon → manual fallback for MVP.

### `StepClimate`
Fields: temperature (number), humidity (number), "Use my location" → weather API pull (or manual).

### `StepResources`
Fields: tools (radio: basic/intermediate/advanced), budget (radio: low/medium/high). Two taps, done.

### `SetupReview`
Renders all collected data with "Edit" links back to each step.
Shows "Connect to network" CTA.

---

## Wallet Page (`/wallet`)

### `Wallet` (page)
Fetches: `getBalance(farmId)` + `getLedger(farmId)` + `listRequests({ node_id: farmId })` on mount.
Polls every 30s.

### `BalanceCard`
```ts
props: { balance: number }
```
Large currency display + "HC" symbol.

### `TransactionList`
```ts
props: { ledgerEntries: LedgerEntry[]; pendingRequests: RequestResponse[] }
```
Combines ledger (confirmed) + pending requests in reverse-chronological order.
Shows: note, amount (+/-), date, status badge.

### `DeliveryForm`
```ts
props: {
  hubs: Hub[];
  crops: BundleResponse[];      // user's assigned crops
  farmId: number;
  farmLat: number;
  farmLng: number;
  onSubmit: (req: RequestBody) => Promise<void>;
}
```
Steps: 1) Select hub (sorted by distance), 2) Select crop, 3) Enter quantity → Submit.
On submit: `POST /requests` with `type: "give"`.

---

## Suggestions Page (`/suggestions`)

### `Suggestions` (page)
Inputs: plot_size_sqft, plot_type. Fetches all crops via `GET /crops`.
Client-side scoring (see `04-functional-gaps.md`).

### `SuggestionCard`
```ts
props: {
  crop: Crop;
  score: number;          // 0–100, client computed
  estimatedYieldKg: number;
  reasonTags: string[];
  onJoin: () => void;     // carries plot size into /setup
}
```

---

## Update Page (`/update`)

### `Update` (page)
Two sections: Conditions form + Task checklist.

### `ConditionsForm`
Fields: pH, moisture, temperature, humidity.
On submit: `PATCH /nodes/{farmId}/data`.

### `TaskChecklist`
Reads task state from localStorage (same state as dashboard tasks).
User can mark in_progress / completed / skipped per task.
On submit: saves to localStorage, shows success toast.
