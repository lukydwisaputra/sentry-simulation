import { test, expect } from "@playwright/test";

// Fail-first spec: each test triggers the buggy path and asserts NO error is shown.
// With bugs present  → crash occurs → error div visible  → test FAILS
// After bugs fixed   → no crash     → error div absent   → test PASSES
// All 8 tests must FAIL with bugs present, PASS after all bugs are fixed.

test("Scenario 1 — Error Tracking: formatPaymentSummary handles undefined payload", async ({ page }) => {
  await page.goto("/demo/error");
  await page.getByRole("button", { name: "Trigger Payment Error" }).click();
  await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
});

test("Scenario 2 — Performance Monitoring: slow-route responds successfully", async ({ page }) => {
  await page.goto("/demo/performance");
  await page.getByRole("button", { name: "Simulate Slow Checkout API" }).click();
  await expect(page.getByText(/Response received in \d+ms/)).toBeVisible({ timeout: 10000 });
  // With bug: duration=Infinity → renders "Infinityms" → regex \d+ no match → FAILS
  // After fix (/ 0 → / 1000): real ms value → regex matches → PASSES
});

test("Scenario 3 — Session Replay: submitOrder handles undefined email", async ({ page }) => {
  await page.goto("/demo/replay");
  await page.getByPlaceholder("Jane Smith").fill("Demo User");
  await page.getByRole("button", { name: "Next →" }).click();
  await page.getByPlaceholder("jane@example.com").fill("demo@werkdone.com");
  await page.getByRole("button", { name: "Next →" }).click();
  await page.getByRole("button", { name: "Submit Order" }).click();
  await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
  // With bug: submitForm calls validateEmail(undefined) → throws → error div renders → FAILS
  // After fix (if (!email) return false): returns false → no throw, no confirmed → error absent → PASSES
});

test("Scenario 4 — Alerts: inventory route returns 200", async ({ page }) => {
  await page.goto("/demo/alerts");
  await page.getByRole("button", { name: "Check Inventory" }).click();
  await expect(page.getByText("Inventory OK")).toBeVisible({ timeout: 8000 });
});

test("Scenario 5 — Release Tracking: getReleaseConfig throws for unknown version", async ({ page }) => {
  // With bug: getReleaseConfig("v1.1.0-hotfix-99") throws → error renders → not.toBeVisible FAILS
  // After fix (null guard in getReleaseConfig): unknown version returns default → no error → PASSES
  await page.goto("/demo/release");
  await page.getByRole("button", { name: "Trigger Versioned Error" }).click();
  await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
});

test("Scenario 6 — Seer Autofix: calculateCartTotal handles undefined items", async ({ page }) => {
  await page.goto("/demo/seer-cart");
  await page.getByRole("button", { name: "Calculate empty cart (crashes)" }).click();
  await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
});

test("Scenario 7 — Seer Autofix: checkout route handles zero-amount", async ({ page }) => {
  await page.goto("/demo/seer-checkout");
  await page.getByRole("button", { name: "Checkout $0 (crashes server)" }).click();
  await expect(page.getByText(/Server 500/)).not.toBeVisible({ timeout: 8000 });
});

test("Scenario 8 — Seer Autofix: getRecommendedProduct handles userId=100", async ({ page }) => {
  await page.goto("/demo/seer-recommendations");
  await page.getByRole("button", { name: "userId = 100 (crashes)" }).click();
  await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
});
