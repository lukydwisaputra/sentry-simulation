# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: trigger-all-scenarios.spec.ts >> Scenario 1 — Error Tracking: formatPaymentSummary handles undefined payload
- Location: tests/trigger-all-scenarios.spec.ts:12:5

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  locator('.text-red-400.font-mono')
Expected: not visible
Received: visible
Timeout:  5000ms

Call log:
  - Expect "not toBeVisible" with timeout 5000ms
  - waiting for locator('.text-red-400.font-mono')
    14 × locator resolved to <p class="text-red-400 font-mono text-sm">TypeError: Payment payload is required</p>
       - unexpected value "visible"

```

```yaml
- paragraph: "TypeError: Payment payload is required"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.afterEach(async ({ page }) => {
  4  |   await page.close();
  5  | });
  6  | 
  7  | // Fail-first spec: each test triggers the buggy path and asserts NO error is shown.
  8  | // With bugs present  → crash occurs → error div visible  → test FAILS
  9  | // After bugs fixed   → no crash     → error div absent   → test PASSES
  10 | // All 8 tests must FAIL with bugs present, PASS after all bugs are fixed.
  11 | 
  12 | test("Scenario 1 — Error Tracking: formatPaymentSummary handles undefined payload", async ({ page }) => {
  13 |   await page.goto("/demo/error");
  14 |   await page.getByRole("button", { name: "Trigger Payment Error" }).click();
> 15 |   await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
     |                                                             ^ Error: expect(locator).not.toBeVisible() failed
  16 | });
  17 | 
  18 | test("Scenario 2 — Performance Monitoring: slow-route responds successfully", async ({ page }) => {
  19 |   await page.goto("/demo/performance");
  20 |   await page.getByRole("button", { name: "Simulate Slow Checkout API" }).click();
  21 |   await expect(page.getByText(/Response received in \d+ms/)).toBeVisible({ timeout: 10000 });
  22 |   // With bug: duration=Infinity → renders "Infinityms" → regex \d+ no match → FAILS
  23 |   // After fix (/ 0 → / 1000): real ms value → regex matches → PASSES
  24 | });
  25 | 
  26 | test("Scenario 3 — Session Replay: submitOrder handles undefined email", async ({ page }) => {
  27 |   await page.goto("/demo/replay");
  28 |   await page.getByPlaceholder("Jane Smith").fill("Demo User");
  29 |   await page.getByRole("button", { name: "Next →" }).click();
  30 |   await page.getByPlaceholder("jane@example.com").fill("demo@werkdone.com");
  31 |   await page.getByRole("button", { name: "Next →" }).click();
  32 |   await page.getByRole("button", { name: "Submit Order" }).click();
  33 |   await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
  34 |   // With bug: submitForm calls validateEmail(undefined) → throws → error div renders → FAILS
  35 |   // After fix (if (!email) return false): returns false → no throw, no confirmed → error absent → PASSES
  36 | });
  37 | 
  38 | test("Scenario 4 — Alerts: inventory route returns 200", async ({ page }) => {
  39 |   await page.goto("/demo/alerts");
  40 |   await page.getByRole("button", { name: "Check Inventory" }).click();
  41 |   await expect(page.getByText("Inventory OK")).toBeVisible({ timeout: 8000 });
  42 | });
  43 | 
  44 | test("Scenario 5 — Release Tracking: getReleaseConfig throws for unknown version", async ({ page }) => {
  45 |   // With bug: getReleaseConfig("v1.1.0-hotfix-99") throws → error renders → not.toBeVisible FAILS
  46 |   // After fix (null guard in getReleaseConfig): unknown version returns default → no error → PASSES
  47 |   await page.goto("/demo/release");
  48 |   await page.getByRole("button", { name: "Trigger Versioned Error" }).click();
  49 |   await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
  50 | });
  51 | 
  52 | test("Scenario 6 — Seer Autofix: calculateCartTotal handles undefined items", async ({ page }) => {
  53 |   await page.goto("/demo/seer-cart");
  54 |   await page.getByRole("button", { name: "Calculate empty cart (crashes)" }).click();
  55 |   await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
  56 | });
  57 | 
  58 | test("Scenario 7 — Seer Autofix: checkout route handles zero-amount", async ({ page }) => {
  59 |   await page.goto("/demo/seer-checkout");
  60 |   await page.getByRole("button", { name: "Checkout $0 (crashes server)" }).click();
  61 |   await expect(page.getByText(/Server 500/)).not.toBeVisible({ timeout: 8000 });
  62 | });
  63 | 
  64 | test("Scenario 8 — Seer Autofix: getRecommendedProduct handles userId=100", async ({ page }) => {
  65 |   await page.goto("/demo/seer-recommendations");
  66 |   await page.getByRole("button", { name: "userId = 100 (crashes)" }).click();
  67 |   await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
  68 | });
  69 | 
```