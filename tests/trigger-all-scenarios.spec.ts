import { test, expect } from "@playwright/test";

// Triggers all 8 demo scenarios to populate Sentry with issues.
// Requires the app running: npm start (port 3000)

test("Scenario 1 — Error Tracking: Payment Gateway Timeout", async ({ page }) => {
  await page.goto("/demo/error");
  await page.getByRole("button", { name: "Trigger Payment Error" }).click();
  await expect(page.getByText("Payment service failed: timeout after 5000ms")).toBeVisible();
  // Give Sentry SDK time to flush
  await page.waitForTimeout(3000);
});

test("Scenario 2 — Performance Monitoring: Slow Checkout API", async ({ page }) => {
  await page.goto("/demo/performance");
  await page.getByRole("button", { name: "Simulate Slow Checkout API" }).click();
  await expect(page.getByText(/Response received in/)).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2000);
});

test("Scenario 3 — Session Replay: Form Crash on Submit", async ({ page }) => {
  await page.goto("/demo/replay");
  // Step 1: enter name
  await page.getByPlaceholder("Jane Smith").fill("Demo User");
  await page.getByRole("button", { name: "Next →" }).click();
  // Step 2: enter email
  await page.getByPlaceholder(/email/i).fill("demo@werkdone.com");
  await page.getByRole("button", { name: "Next →" }).click();
  // Step 3: submit (crashes)
  await page.getByRole("button", { name: /submit/i }).click();
  await page.waitForTimeout(3000);
});

test("Scenario 4 — Alerts: Inventory Service 500", async ({ page }) => {
  await page.goto("/demo/alerts");
  await page.getByRole("button", { name: "Trigger Server 500" }).click();
  await expect(page.getByText(/500|server|error/i)).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(2000);
});

test("Scenario 5 — Release Tracking: Feature Flag Timeout", async ({ page }) => {
  await page.goto("/demo/release");
  await page.getByRole("button", { name: "Trigger Versioned Error" }).click();
  await expect(page.getByText(/attributed to release/i)).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(2000);
});

test("Scenario 6 — Seer Autofix: Cart Null Reference", async ({ page }) => {
  await page.goto("/demo/seer-cart");
  // First show it works with items
  await page.getByRole("button", { name: "Calculate with items (works)" }).click();
  await expect(page.getByText(/Cart total/)).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  // Then trigger the crash
  await page.getByRole("button", { name: "Calculate empty cart (crashes)" }).click();
  await expect(page.getByText(/TypeError/)).toBeVisible();
  await page.waitForTimeout(3000);
});

test("Scenario 7 — Seer Autofix: Checkout Unhandled Promise", async ({ page }) => {
  await page.goto("/demo/seer-checkout");
  // Show valid path works
  await page.getByRole("button", { name: "Checkout $149 (works)" }).click();
  await expect(page.getByText(/Order created/)).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: "Reset" }).click();
  // Trigger the crash
  await page.getByRole("button", { name: "Checkout $0 (crashes server)" }).click();
  await expect(page.getByText(/Server 500/)).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(3000);
});

test("Scenario 8 — Seer Autofix: Off-by-One Array", async ({ page }) => {
  await page.goto("/demo/seer-recommendations");
  // Show safe path
  await page.getByRole("button", { name: "userId = 45 (safe)" }).click();
  await expect(page.getByText(/recommended/)).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  // Trigger the crash
  await page.getByRole("button", { name: "userId = 100 (crashes)" }).click();
  await expect(page.getByText(/TypeError/)).toBeVisible();
  await page.waitForTimeout(3000);
});
