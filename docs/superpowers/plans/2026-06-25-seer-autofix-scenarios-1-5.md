# Seer Autofix Scenarios 1–5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 5 original demo scenarios (Error Tracking, Performance, Session Replay, Alerts, Release Tracking) produce Sentry issues that Seer can read, diagnose, and autofix via GitHub PR.

**Architecture:** Each scenario gets a new focused lib or API module containing a planted real TypeScript/runtime bug with a `// BUG:` comment. The existing demo page is updated to call that module instead of throwing strings directly. Sentry `captureException` calls include `extra` context to anchor Seer's analysis. No new dependencies.

**Tech Stack:** Next.js 14 App Router, TypeScript, `@sentry/nextjs` ^10, Tailwind CSS

## Global Constraints

- No new npm packages
- Client-side Sentry capture: dynamic import `import("@sentry/nextjs").then(({ captureException }) => captureException(err, { tags: {...}, extra: {...} })).catch(() => {})`
- Server-side Sentry capture: `import * as Sentry from "@sentry/nextjs"` at top of route file
- Pages: `"use client"`, Link back to `/`, gray-950 bg, violet accent — match existing pages
- Bugs must be **real TypeScript/runtime bugs** — not thrown strings
- Each module must have `// BUG:` comment on the broken line
- Keep existing page UI/copy — only change the function that produces the error
- Playwright test in `tests/trigger-all-scenarios.spec.ts` must still pass after changes

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/payment.ts` | Create | Payment processor with null-ref bug on payload.amount |
| `src/app/demo/error/page.tsx` | Modify | Call `formatPaymentSummary()` from payment.ts |
| `src/lib/db.ts` | Create | DB query runner with missing timeout — accesses `.rows` on undefined result |
| `src/app/api/slow-route/route.ts` | Modify | Call `runQuery()` from db.ts — crash path when query returns undefined |
| `src/lib/validator.ts` | Create | Email validator with null-ref bug on undefined input |
| `src/app/demo/replay/page.tsx` | Modify | Call `validateEmail()` from validator.ts on submit |
| `src/lib/inventory.ts` | Create | Inventory fetcher with unhandled promise rejection |
| `src/app/api/broken-route/route.ts` | Modify | Call `fetchInventory()` from inventory.ts — no try/catch |
| `src/lib/release.ts` | Create | Release config reader with undefined property access bug |
| `src/app/demo/release/page.tsx` | Modify | Call `getReleaseConfig()` from release.ts |

---

## Task 1: Payment Null-Reference Bug (Scenario 1 — Error Tracking)

**Files:**
- Create: `src/lib/payment.ts`
- Modify: `src/app/demo/error/page.tsx`

**Interfaces:**
- Produces: `formatPaymentSummary(payload: PaymentPayload | undefined): string` — exported from `src/lib/payment.ts`
- Produces: `type PaymentPayload = { amount: number; currency: string; customerId: string }` — exported from same file

**What the bug is:**
`formatPaymentSummary` accesses `payload.amount.toFixed(2)` without checking if `payload` is `undefined`. When called with `undefined` (missing payment context), throws `TypeError: Cannot read properties of undefined (reading 'amount')`. Seer fixes it by adding `if (!payload) throw new Error("Payment payload is required")` before the access.

- [ ] **Step 1: Create `src/lib/payment.ts` with planted bug**

```typescript
export type PaymentPayload = {
  amount: number;
  currency: string;
  customerId: string;
};

export function formatPaymentSummary(payload: PaymentPayload | undefined): string {
  // BUG: payload can be undefined when payment context is missing — accessing .amount throws TypeError
  return `${payload.currency.toUpperCase()} ${payload.amount.toFixed(2)} charged to ${payload.customerId}`;
}
```

- [ ] **Step 2: Modify `src/app/demo/error/page.tsx`**

Replace the entire file with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPaymentSummary } from "@/lib/payment";

export default function ErrorDemoPage() {
  const [triggered, setTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function triggerError() {
    setTriggered(true);
    try {
      // Simulates missing payment context — passes undefined to trigger the bug
      formatPaymentSummary(undefined);
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { scenario: "error-tracking" },
          extra: { payload: null, reason: "payment context missing at checkout" },
        })
      ).catch(() => {});
    }
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Error Tracking Demo</h2>

      <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h3 className="font-semibold text-violet-300 mb-1">What this shows</h3>
        <p className="text-gray-400 text-sm">
          When an unhandled exception occurs in your app, Sentry captures it with a full stack trace,
          the user&apos;s browser/OS context, and a breadcrumb trail of what happened before the crash.
          No manual logging needed — the SDK instruments your app automatically.
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="font-semibold mb-1">Scenario: Payment Gateway Timeout</h3>
        <p className="text-gray-500 text-sm mb-5">
          File: <code className="bg-gray-800 px-1 rounded">src/lib/payment.ts</code> ·{" "}
          Bug: <code className="bg-gray-800 px-1 rounded">payload.amount</code> — no null guard
        </p>

        {!triggered ? (
          <button
            onClick={triggerError}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Trigger Payment Error
          </button>
        ) : (
          <div>
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 font-mono text-sm">TypeError: {error}</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Error sent to Sentry. Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard — it should appear within 5 seconds.
            </p>
            <p className="text-gray-500 text-xs">
              In Sentry: click the issue → see stack trace pointing to <code className="bg-gray-900 px-1 rounded">src/lib/payment.ts</code> → click Autofix → Seer proposes null guard fix → Create PR.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/lukydwisaputra/Desktop/QA/sentry-simulation && npx tsc --noEmit 2>&1 | grep -v "TS18048"
```
Expected: only pre-existing TS18048 errors from cart.ts and payment.ts (intentional bugs)

- [ ] **Step 4: Commit**

```bash
git add src/lib/payment.ts src/app/demo/error/page.tsx
git commit -m "feat: plant payment null-ref bug for Seer autofix (scenario 1)"
```

---

## Task 2: DB Query Undefined-Access Bug (Scenario 2 — Performance)

**Files:**
- Create: `src/lib/db.ts`
- Modify: `src/app/api/slow-route/route.ts`

**Interfaces:**
- Produces: `type QueryResult = { rows: Record<string, unknown>[]; duration_ms: number }` — exported from `src/lib/db.ts`
- Produces: `runQuery(sql: string): Promise<QueryResult>` — exported from `src/lib/db.ts`

**What the bug is:**
`runQuery` returns `undefined` when called with an empty string (simulating a misconfigured query). The route calls `const result = await runQuery(sql)` then accesses `result.rows` — if `result` is `undefined`, throws `TypeError: Cannot read properties of undefined (reading 'rows')`. Seer fixes by adding `if (!result) throw new Error("Query returned no result")`.

- [ ] **Step 1: Create `src/lib/db.ts` with planted bug**

```typescript
export type QueryResult = {
  rows: Record<string, unknown>[];
  duration_ms: number;
};

export async function runQuery(sql: string): Promise<QueryResult> {
  // BUG: returns undefined when sql is empty — caller accessing .rows will throw TypeError
  if (!sql.trim()) {
    return undefined as unknown as QueryResult;
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return {
    rows: [{ id: 1, product: "Pro Plan", qty: 3 }],
    duration_ms: 3000,
  };
}
```

- [ ] **Step 2: Modify `src/app/api/slow-route/route.ts`**

Replace the entire file with:

```typescript
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { runQuery } from "@/lib/db";

export async function GET() {
  return await Sentry.startSpan(
    { name: "checkout.database.query", op: "db.query" },
    async () => {
      const sql = "SELECT * FROM orders WHERE status = 'pending'";
      const result = await runQuery(sql);
      // Accessing result.rows — safe for non-empty sql, crashes when result is undefined
      return NextResponse.json({
        message: "Checkout complete",
        duration_ms: result.rows.length > 0 ? result.duration_ms : 0,
      });
    }
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "TS18048"
```
Expected: only pre-existing intentional errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/app/api/slow-route/route.ts
git commit -m "feat: plant db query undefined-access bug for Seer autofix (scenario 2)"
```

---

## Task 3: Email Validator Null-Reference Bug (Scenario 3 — Session Replay)

**Files:**
- Create: `src/lib/validator.ts`
- Modify: `src/app/demo/replay/page.tsx`

**Interfaces:**
- Produces: `validateEmail(email: string | undefined): boolean` — exported from `src/lib/validator.ts`

**What the bug is:**
`validateEmail` calls `email.trim()` without checking if `email` is `undefined`. When `submitForm` is called before email state is set (race condition simulation — we pass `undefined` explicitly), throws `TypeError: Cannot read properties of undefined (reading 'trim')`. Seer fixes by adding `if (!email) return false` before `.trim()`.

- [ ] **Step 1: Create `src/lib/validator.ts` with planted bug**

```typescript
export function validateEmail(email: string | undefined): boolean {
  // BUG: email can be undefined if form state is cleared before submit — .trim() throws TypeError
  const trimmed = email.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}
```

- [ ] **Step 2: Modify `src/app/demo/replay/page.tsx`**

Replace the entire file with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { validateEmail } from "@/lib/validator";

type Step = 1 | 2 | 3 | "error";

export default function ReplayDemoPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function submitForm() {
    try {
      // Simulates a race condition — email cleared before validation runs
      validateEmail(undefined);
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message);
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { scenario: "session-replay" },
          extra: { name, email: null, reason: "email state undefined at submit" },
        })
      ).catch(() => {});
      setStep("error");
    }
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Session Replay Demo</h2>

      <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h3 className="font-semibold text-violet-300 mb-1">What this shows</h3>
        <p className="text-gray-400 text-sm">
          Session Replay records every click, keystroke, and scroll before an error — like a DVR for your app.
          When a user hits a bug, you don&apos;t have to guess what they did. You watch it. This eliminates
          entire categories of &quot;I can&apos;t reproduce it&quot; bugs.
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="font-semibold mb-1">Scenario: Multi-Step Checkout Form</h3>
        <p className="text-gray-500 text-xs mb-6">Fill in the form — it will crash on submit. Sentry records every step.</p>

        {step === 1 && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Step 1 of 3 — Your name</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 text-white focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Step 2 of 3 — Your email</label>
            <input
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 text-white focus:outline-none focus:border-violet-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-300 underline"
              >
                ← Back
              </button>
              <button
                onClick={() => email.trim() && setStep(3)}
                disabled={!email.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-sm text-gray-400 mb-1">Step 3 of 3 — Confirm & Submit</p>
            <div className="bg-gray-800 rounded-lg px-4 py-3 mb-4 text-sm text-gray-300">
              <p>Name: {name}</p>
              <p>Email: {email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="text-sm text-gray-500 hover:text-gray-300 underline"
              >
                ← Back
              </button>
              <button
                onClick={submitForm}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Submit Order
              </button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div>
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 font-mono text-sm">TypeError: {errorMsg}</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Error sent to Sentry. Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard → find this error → click the <strong>Replay</strong> tab to watch the recording.
              Then click <strong>Autofix</strong> — Seer reads <code className="bg-gray-900 px-1 rounded">src/lib/validator.ts</code> and adds the null guard.
            </p>
            <button
              onClick={() => { setStep(1); setName(""); setEmail(""); setErrorMsg(null); }}
              className="text-sm text-gray-500 hover:text-gray-300 underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "TS18048"
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/validator.ts src/app/demo/replay/page.tsx
git commit -m "feat: plant email validator null-ref bug for Seer autofix (scenario 3)"
```

---

## Task 4: Inventory Unhandled Promise Bug (Scenario 4 — Alerts)

**Files:**
- Create: `src/lib/inventory.ts`
- Modify: `src/app/api/broken-route/route.ts`

**Interfaces:**
- Produces: `fetchInventory(warehouseId: string): Promise<{ items: number; warehouseId: string }>` — exported from `src/lib/inventory.ts`

**What the bug is:**
`fetchInventory` throws `Error("Warehouse ID cannot be empty")` when called with an empty string. The route calls `await fetchInventory("")` with no try/catch — unhandled rejection crashes the route with 500. Seer reads `broken-route/route.ts`, sees the `// BUG:` comment, wraps in try/catch.

- [ ] **Step 1: Create `src/lib/inventory.ts` with planted bug**

```typescript
export async function fetchInventory(warehouseId: string): Promise<{ items: number; warehouseId: string }> {
  if (!warehouseId) {
    throw new Error("Warehouse ID cannot be empty");
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { items: 42, warehouseId };
}
```

- [ ] **Step 2: Modify `src/app/api/broken-route/route.ts`**

Replace the entire file with:

```typescript
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { fetchInventory } from "@/lib/inventory";

export async function GET(): Promise<NextResponse> {
  // BUG: fetchInventory throws when warehouseId is empty — no try/catch wraps this await
  const inventory = await fetchInventory("");
  return NextResponse.json({ status: "ok", inventory });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "TS18048"
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/inventory.ts src/app/api/broken-route/route.ts
git commit -m "feat: plant inventory unhandled-promise bug for Seer autofix (scenario 4)"
```

---

## Task 5: Release Config Undefined-Property Bug (Scenario 5 — Release Tracking)

**Files:**
- Create: `src/lib/release.ts`
- Modify: `src/app/demo/release/page.tsx`

**Interfaces:**
- Produces: `type ReleaseConfig = { version: string; featureFlags: Record<string, boolean>; deployedAt: string }` — exported from `src/lib/release.ts`
- Produces: `getReleaseConfig(version: string): ReleaseConfig` — exported from `src/lib/release.ts`

**What the bug is:**
`getReleaseConfig` looks up a config by version from a map. For an unknown version it returns `undefined`. Caller accesses `.featureFlags` on the result — throws `TypeError: Cannot read properties of undefined (reading 'featureFlags')`. Seer fixes with a null check: `if (!config) throw new Error(\`No release config for ${version}\`)`.

- [ ] **Step 1: Create `src/lib/release.ts` with planted bug**

```typescript
export type ReleaseConfig = {
  version: string;
  featureFlags: Record<string, boolean>;
  deployedAt: string;
};

const RELEASE_CONFIGS: Record<string, ReleaseConfig> = {
  "v1.0.0-demo": {
    version: "v1.0.0-demo",
    featureFlags: { newCheckout: true, betaDashboard: false },
    deployedAt: "2026-06-25T00:00:00Z",
  },
};

export function getReleaseConfig(version: string): ReleaseConfig {
  const config = RELEASE_CONFIGS[version];
  // BUG: config is undefined for unknown versions — accessing .featureFlags throws TypeError
  return { ...config, featureFlags: config.featureFlags };
}
```

- [ ] **Step 2: Modify `src/app/demo/release/page.tsx`**

Replace the entire file with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { getReleaseConfig } from "@/lib/release";

export default function ReleaseDemoPage() {
  const [triggered, setTriggered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";

  function triggerVersionedError() {
    try {
      // Passes an unknown version to trigger the undefined config bug
      const unknownVersion = `${version}-hotfix-99`;
      getReleaseConfig(unknownVersion);
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message);
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { release: version, scenario: "release-tracking" },
          extra: { requestedVersion: `${version}-hotfix-99`, knownVersions: ["v1.0.0-demo"] },
        })
      ).catch(() => {});
    }
    setTriggered(true);
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Release Tracking Demo</h2>

      <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h3 className="font-semibold text-violet-300 mb-1">What this shows</h3>
        <p className="text-gray-400 text-sm">
          Sentry links every error to the release (version/git SHA) that first introduced it.
          When a new deploy causes a regression, Sentry surfaces it immediately: &quot;This issue first appeared in v2.1.4.&quot;
          You can correlate error spikes with deploys without digging through logs.
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="font-semibold mb-1">Scenario: Error Tagged to Current Release</h3>
        <p className="text-gray-500 text-sm mb-5">
          File: <code className="bg-gray-800 px-1 rounded">src/lib/release.ts</code> ·{" "}
          Bug: <code className="bg-gray-800 px-1 rounded">config.featureFlags</code> — no undefined guard
        </p>

        <div className="bg-gray-800 rounded-lg px-4 py-3 mb-5 inline-block">
          <p className="text-xs text-gray-500 mb-0.5">Current release</p>
          <p className="text-green-400 font-mono font-bold">{version}</p>
        </div>

        {!triggered ? (
          <div>
            <p className="text-gray-400 text-sm mb-4">
              Click below to throw an error tagged to release <code className="bg-gray-800 px-1 rounded">{version}</code>.
              Sentry will record which release this error first appeared in.
            </p>
            <button
              onClick={triggerVersionedError}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Trigger Versioned Error
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 font-mono text-sm">TypeError: {errorMsg}</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard → find the release config error → look for{" "}
              <strong>First seen in release {version}</strong>. Click <strong>Autofix</strong> — Seer reads{" "}
              <code className="bg-gray-900 px-1 rounded">src/lib/release.ts</code> and adds the undefined guard.
            </p>
            <button
              onClick={() => { setTriggered(false); setErrorMsg(null); }}
              className="text-sm text-gray-500 hover:text-gray-300 underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "TS18048"
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/release.ts src/app/demo/release/page.tsx
git commit -m "feat: plant release config undefined-property bug for Seer autofix (scenario 5)"
```

---

## Task 6: Update Playwright Spec

**Files:**
- Modify: `tests/trigger-all-scenarios.spec.ts`

**What changes:**
- Scenario 1: error message is now `TypeError: Cannot read properties of undefined` — update assertion
- Scenario 3: error UI now shows `TypeError:` text in `.text-red-400.font-mono` — same selector already works
- Scenario 5: success state now shows red error box not green — update assertion to `.text-red-400.font-mono`

- [ ] **Step 1: Update assertions for scenarios 1, 3, 5**

In `tests/trigger-all-scenarios.spec.ts`, replace:

```typescript
// Scenario 1 — old assertion
await expect(page.getByText("Payment service failed: timeout after 5000ms")).toBeVisible();
```
with:
```typescript
await expect(page.locator(".text-red-400.font-mono")).toBeVisible();
```

Replace:
```typescript
// Scenario 5 — old assertion
await expect(page.getByText("Error captured and tagged to release")).toBeVisible({ timeout: 5000 });
```
with:
```typescript
await expect(page.locator(".text-red-400.font-mono")).toBeVisible({ timeout: 5000 });
```

- [ ] **Step 2: Run all 8 tests to confirm pass**

```bash
npx playwright test tests/trigger-all-scenarios.spec.ts --reporter=list
```
Expected: 8 passed

- [ ] **Step 3: Commit**

```bash
git add tests/trigger-all-scenarios.spec.ts
git commit -m "fix: update Playwright assertions for refactored scenarios 1, 3, 5"
```
