# Fail-First Playwright Spec — All 8 Sentry Demo Scenarios

**Date:** 2026-06-25
**Status:** Approved

## Goal

Restructure the Playwright test suite so all 8 demo scenarios follow a fail-first pattern:

- **Before fix:** `npx playwright test` → all 8 tests FAIL (bugs present)
- **After fix:** `npx playwright test` → all 8 tests PASS (bugs resolved)

This mirrors a real QA workflow where Sentry captures the error, Seer proposes a fix, and the test suite verifies the fix is correct.

---

## Architecture

Each scenario gets a dedicated lib or API module containing a **planted real TypeScript bug** (not a thrown string). Demo pages import and call those modules. The spec asserts only the **happy path** — so bugs cause assertion failures, not test errors.

### Pattern per scenario

```
lib/api module (planted bug)
    ↓ imported by
demo page (calls module, renders result)
    ↓ tested by
spec (asserts happy path output visible)
```

---

## Bug Module Map

### New modules (scenarios 1–5)

| Scenario | Module | Exported function | Bug |
|---|---|---|---|
| 1 — Payment timeout | `src/lib/payment.ts` | `processPayment(amount: number): Promise<{transactionId: string}>` | Timeout threshold multiplied by 1000 twice — always exceeds limit, always throws |
| 2 — Slow checkout | `src/lib/checkout.ts` | `getCheckoutDuration(startTime: number): number` | Divides by `0` instead of `1000` → returns `Infinity` ms |
| 3 — CSRF replay | `src/lib/order.ts` | `submitOrder(form: OrderForm): {orderId: string}` | Reads `form.csrfToken` but field is named `form.token` → always undefined → throws |
| 4 — Inventory 500 | `src/app/api/broken-route/route.ts` | Existing GET handler | Already throws — keep as-is, ensure demo page surfaces success state |
| 5 — Feature flag | `src/lib/featureFlags.ts` | `getFeatureFlag(name: string): Promise<boolean>` | Awaits `new Promise(() => {})` — never resolves, no timeout guard → hangs |

### Existing modules (scenarios 6–8, already planted)

| Scenario | Module | Bug |
|---|---|---|
| 6 — Cart null-ref | `src/lib/cart.ts` | `items.reduce()` — no null guard when `items` is undefined |
| 7 — Checkout promise | `src/app/api/checkout/route.ts` | No try/catch around `await processPayment()` — unhandled rejection |
| 8 — Off-by-one | `src/lib/recommendations.ts` | `Math.floor(userId / 10)` overflows PRODUCTS array when `userId >= 100` |

---

## Demo Page Changes

Each page must:
1. Import the lib module
2. Call the function on button click
3. Render a **success state** that the spec can assert on (currently missing for scenarios 1–5)
4. Render an **error state** with Sentry capture (already present for most)

### Success state strings (spec asserts these)

| # | Success text |
|---|---|
| 1 | `Payment processed: $<amount>` |
| 2 | `Response received in <N>ms` (already exists) |
| 3 | `Order confirmed: #<orderId>` |
| 4 | `Inventory OK` |
| 5 | `Flag enabled: <flagName>` |
| 6 | `Cart total: $174` |
| 7 | `Order created: <orderId>` (already exists) |
| 8 | `Recommended: <productName>` (already exists) |

---

## Spec Design (`tests/trigger-all-scenarios.spec.ts`)

Single file, 8 tests. Each test:
1. Navigates to the demo page
2. Clicks the **happy path button** only
3. Asserts the success state is visible

No crash buttons clicked. No `waitForTimeout`. Tests are fast and deterministic.

```
test("Scenario 1 — Payment: processPayment returns transaction ID")
  → goto /demo/error
  → click "Process Payment"
  → expect "Payment processed:" visible

test("Scenario 2 — Performance: getCheckoutDuration returns ms")
  → goto /demo/performance
  → click "Simulate Slow Checkout API"
  → expect /Response received in \d+ms/ visible

test("Scenario 3 — Replay: submitOrder returns orderId")
  → goto /demo/replay
  → fill form, click Submit
  → expect "Order confirmed:" visible

test("Scenario 4 — Alerts: inventory route returns 200")
  → goto /demo/alerts
  → click "Check Inventory"
  → expect "Inventory OK" visible

test("Scenario 5 — Release: getFeatureFlag returns true")
  → goto /demo/release
  → click "Check Feature Flag"
  → expect "Flag enabled:" visible

test("Scenario 6 — Seer Cart: calculateCartTotal returns 174")
  → goto /demo/seer-cart
  → click "Calculate with items (works)"
  → expect "Cart total: $174" visible

test("Scenario 7 — Seer Checkout: POST /api/checkout returns orderId")
  → goto /demo/seer-checkout
  → click "Checkout $149 (works)"
  → expect "Order created" visible

test("Scenario 8 — Seer Recommendations: getRecommendedProduct returns product")
  → goto /demo/seer-recommendations
  → click "userId = 45 (safe)"
  → expect /Recommended:/ visible
```

---

## Fix Targets (what Seer/dev fixes per scenario)

| # | File | Fix |
|---|---|---|
| 1 | `src/lib/payment.ts` | Remove double-multiply on timeout threshold |
| 2 | `src/lib/checkout.ts` | Divide by `1000` not `0` |
| 3 | `src/lib/order.ts` | Read `form.token` not `form.csrfToken` |
| 4 | `src/app/api/broken-route/route.ts` | Return 200 with inventory data instead of throwing |
| 5 | `src/lib/featureFlags.ts` | Add `Promise.race` with a timeout |
| 6 | `src/lib/cart.ts` | `(items ?? []).reduce(...)` |
| 7 | `src/app/api/checkout/route.ts` | Wrap `processPayment` in try/catch, return 400/500 |
| 8 | `src/lib/recommendations.ts` | Clamp index: `Math.min(index, PRODUCTS.length - 1)` |

---

## Files Changed

| File | Action |
|---|---|
| `src/lib/payment.ts` | Create |
| `src/lib/checkout.ts` | Create |
| `src/lib/order.ts` | Create |
| `src/lib/featureFlags.ts` | Create |
| `src/app/demo/error/page.tsx` | Refactor — import payment.ts, add success state |
| `src/app/demo/performance/page.tsx` | Refactor — import checkout.ts |
| `src/app/demo/replay/page.tsx` | Refactor — import order.ts, add success state |
| `src/app/demo/alerts/page.tsx` | Refactor — add success state for 200 response |
| `src/app/demo/release/page.tsx` | Refactor — import featureFlags.ts, add success state |
| `tests/trigger-all-scenarios.spec.ts` | Rewrite — happy path assertions only |

Scenarios 6–8 lib modules unchanged. Their pages get minor assertion-friendly text tweaks only if needed.

---

## Success Criteria

- `npx playwright test` with bugs present → **8 failed**
- Apply all fixes → `npx playwright test` → **8 passed**
- Sentry receives error events for all crash paths (triggered manually or via separate Sentry-population script)
