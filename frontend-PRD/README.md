# MyCelium — Farmer Frontend PRD

## Agent Instructions

Before working on any file in this directory:
1. Read the full PRD: `@PRD/` — understand the product, the network model, and the data variables.
2. Run `do dis` via the MCP tool to discover existing APIs, database schema, and codebase structures.
3. Read the specific file you are assigned. The prompt at the top of each file tells you exactly what to produce.

## Scope

This PRD covers the **farmer-facing** frontend only.
The admin/visualization dashboard is a separate workstream — do not build it here.

The farmer app has 5 screens:
- Suggestions (public, pre-join)
- Onboarding (join the network)
- Dashboard (home — instruction bundle)
- Cycle Update (recurring data input)
- Wallet & Delivery (currency + hub delivery)

## Directory Structure

| File | Contents | Layer |
|------|----------|-------|
| `01-user-flows.md` | Full user journeys for all 5 screens | 1 |
| `02-product-requirements.md` | Functional requirements per screen | 1 |
| `03-key-features.md` | Feature breakdown with acceptance criteria | 1 |
| `04-layouts.md` | Screen-by-screen layout descriptions | 1 |
| `staged-planning/` | Deeper specs that depend on layer 1 | 2 |

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- React Router v6
- React Hook Form + Zod
- Supabase JS client (auth + realtime)
- Tanstack Query (server state)
- WebXR (AR plot measurement, suggestions flow only)

## Hard Rules

- No optimization logic in the client. UI only: collect inputs, call APIs, display results.
- Mobile-first. Farmers use this on a phone in a garden.
- Every screen must handle loading, error, and empty states.
