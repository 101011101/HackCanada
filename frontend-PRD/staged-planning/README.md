# Staged Planning — Layer 2

## Agent Instructions

These files are Layer 2. They depend on Layer 1 being complete or well-defined.

Before working on any file here:
1. Read ALL of Layer 1 first: `../01-user-flows.md`, `../02-product-requirements.md`, `../03-key-features.md`, `../04-layouts.md`
2. Read the full PRD: `@PRD/` — especially `03-architecture.md` and `05-datakit.md`
3. Run `do dis` via MCP to discover existing API routes, database schema, Supabase tables, and any existing frontend code before writing contracts or specs.
4. Then open the specific file you are assigned.

## Files

| File | Contents | Depends On |
|------|----------|------------|
| `01-api-contracts.md` | Exact API calls per screen: endpoint, payload, response | Layer 1 + `do dis` |
| `02-error-states.md` | Every error, loading, and empty state per screen | Layer 1 |
| `03-auth-navigation.md` | Auth gates, route guards, redirect logic | Layer 1 + `do dis` |
| `04-mobile-constraints.md` | Mobile-specific constraints and touch interaction rules | Layer 1 + `04-layouts.md` |
