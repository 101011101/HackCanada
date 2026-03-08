# Frontend Test Report

**Generated:** From latest test run  
**Runner:** Vitest v4  
**Scope:** MyFood API client and MyFoodHero component

---

## Summary

| Metric | Value |
|--------|--------|
| **Total tests** | 12 |
| **Passed** | 12 |
| **Failed** | 0 |
| **Test files** | 2 |
| **Status** | All passed |

---

## Test Suites and Cases

### 1. `src/services/myfood-api.test.ts` (MyFood API client)

| # | Suite / Case | Status |
|---|----------------|--------|
| 1 | **ApiError** / creates error with status and message | Passed |
| 2 | **getBalance** / calls GET /nodes/{id}/balance and returns BalanceResponse | Passed |
| 3 | **getBalance** / throws ApiError on non-ok response | Passed |
| 4 | **listRequests** / calls GET /requests with optional node_id | Passed |
| 5 | **listRequests** / calls GET /requests without query when no params | Passed |
| 6 | **submitRequest** / calls POST /requests with body | Passed |
| 7 | **getRates** / calls GET /rates | Passed |
| 8 | **getDeliveryCost** / calls GET /rates/cost with query params | Passed |
| 9 | **getCrops** / calls GET /crops | Passed |
| 10 | **getHubs** / calls GET /hubs | Passed |

**What’s tested:** API module uses `fetch` with the correct URL and options; error responses throw `ApiError` with status and detail. All calls are unit-tested with a mocked `fetch` (no real backend).

---

### 2. `src/components/myfood/MyFoodHero.test.tsx` (MyFoodHero component)

| # | Case | Status |
|---|------|--------|
| 1 | renders balance and stat labels (42 HC, Consumed kg, Donated kg, Requests) | Passed |
| 2 | uses default stats when not provided (0 HC, section labels present) | Passed |

**What’s tested:** Hero renders balance and the three stat chips with correct labels; defaults apply when optional props are omitted.

---

## How to Run Tests

```bash
cd app/frontend
npm run test          # single run
npm run test:watch    # watch mode
```

**JSON output (for CI or tooling):**
```bash
npm run test -- --reporter=json --outputFile=test-results.json
```

---

## How to Alter or Add Test Cases

- **API client:** Edit `src/services/myfood-api.test.ts`. Use `vi.stubGlobal("fetch", vi.fn())` and `(fetch as ...).mockResolvedValueOnce({ ok, json })` to shape responses. Add new `describe`/`it` blocks for new endpoints or error cases.
- **Components:** Edit or add `src/components/myfood/*.test.tsx`. Use `render()` from `@testing-library/react` and `screen.getByText`, `getByRole`, etc. Mock router or context if the component uses `useNodeId()` or `Link`.
- **Setup:** Global fetch mock and `@testing-library/jest-dom` are in `src/test/setup.ts`; Vitest config is in `vitest.config.ts` (include pattern: `src/**/*.{test,spec}.{ts,tsx}`).

---

## Suggested Next Tests (not yet implemented)

- `TicketList`: empty state, mapping of request status to ticket variant.
- `GroceriesSheet` / `DonationsSheet`: submit with mocked API, error display.
- `NodeIdContext`: setNodeId / useNodeId and localStorage.
- Integration-style: MyFoodPage with mocked API and nodeId in context (full flow).
