# Auth & Navigation

## Agent Instructions

You are implementing or auditing the auth system and routing for the farmer frontend.

1. Read `../01-user-flows.md` — the navigation map at the bottom defines all routes.
2. Read `../staged-planning/01-api-contracts.md` — the Auth section defines the Supabase calls.
3. Run `do dis` via MCP to check if a Supabase client or auth provider already exists before creating one.
4. Use React Router v6. Implement route guards as wrapper components, not inline checks.

---

## Route Map

| Path | Screen | Auth required | Onboarding required |
|------|--------|--------------|-------------------|
| `/` | Landing / Suggestions entry | No | No |
| `/suggestions` | Suggestions flow | No | No |
| `/auth` | Sign in / Sign up | No (redirect away if already authed) | No |
| `/onboarding` | Onboarding multi-step form | Yes | No (this IS onboarding) |
| `/dashboard` | Home — instruction bundle | Yes | Yes |
| `/update` | Cycle update | Yes | Yes |
| `/wallet` | Wallet + delivery | Yes | Yes |
| `/profile` | Account settings | Yes | Yes |

---

## Auth State

Three meaningful states:

1. **Unauthenticated** — no Supabase session
2. **Authenticated, no farm** — session exists, but no farm node created (onboarding incomplete)
3. **Authenticated, farm exists** — full access

---

## Route Guard Logic

### PublicRoute
Wraps `/`, `/suggestions`, `/auth`.
- If user is state 3 (authenticated + farm): redirect to `/dashboard`
- If user is state 2 (authenticated, no farm): redirect to `/onboarding`
- Otherwise: render the page

### AuthRoute
Wraps `/onboarding`.
- If user is state 1 (unauthenticated): redirect to `/auth?next=/onboarding`
- Otherwise: render the page

### ProtectedRoute
Wraps `/dashboard`, `/update`, `/wallet`, `/profile`.
- If unauthenticated: redirect to `/auth?next=[current path]`
- If authenticated but no farm: redirect to `/onboarding`
- Otherwise: render the page

---

## Auth Provider

Wrap the entire app in an `AuthProvider` component that:
- On mount: calls `supabase.auth.getSession()` and stores result
- Subscribes to `supabase.auth.onAuthStateChange()` for the app lifetime
- Exposes: `user`, `session`, `farm`, `isLoading`, `signOut`
- `farm` is fetched once auth state resolves — a GET to `/farms?user_id=` or from Supabase directly
- While `isLoading` is true: show full-screen loading indicator (not routes)

```ts
// Shape of context value
type AuthContext = {
  user: User | null,
  session: Session | null,
  farm: Farm | null,
  isLoading: boolean,
  signOut: () => Promise<void>
}
```

---

## Post-Auth Redirects

- After sign in: check `?next=` param → redirect there, or `/dashboard` if no farm, or `/onboarding` if no farm
- After sign up: always go to `/onboarding`
- After onboarding complete: go to `/dashboard`
- After sign out: go to `/`

---

## Session Persistence

- Supabase handles token refresh automatically
- Store session in Supabase's default storage (localStorage)
- On app load, session is restored from storage — no login required between visits
- If refresh token is expired: redirect to `/auth` with toast: "Your session expired — please sign in again"

---

## Navigation — Bottom Nav

Shown on all ProtectedRoute screens except `/onboarding`.

```ts
const NAV_ITEMS = [
  { label: "Home", path: "/dashboard", icon: HomeIcon },
  { label: "Update", path: "/update", icon: RefreshIcon, badge: hasNewBundle },
  { label: "Wallet", path: "/wallet", icon: WalletIcon },
  { label: "Me", path: "/profile", icon: PersonIcon }
]
```

`hasNewBundle`: true if a new instruction bundle arrived via Realtime since the user last visited `/dashboard`. Clear badge on `/dashboard` mount.

---

## Deep Link Behavior

- `/suggestions` is fully shareable — no auth required, no redirect
- `/auth?next=/wallet` — after login, lands on wallet
- All other deep links to protected routes redirect through auth and back
