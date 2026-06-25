# Fail-First Playwright Spec Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure all 8 demo scenarios so `npx playwright test` fails while bugs are present and passes after fixes are applied.

**Architecture:** Each scenario already has a planted bug in a lib/API module. We need to: (1) add happy-path success states to 5 demo pages that currently only show crash states, (2) rewrite the spec to assert only the happy path. The bugs stay untouched — tests fail because the lib throws before the success state is ever rendered.

**Tech Stack:** Next.js 14 App Router, TypeScript, Playwright, `@sentry/nextjs` ^10, Tailwind CSS

## Global Constraints

- No new npm packages
- All existing `// BUG:` comments stay — do NOT fix any bugs in this plan
- Follow existing page structure: `"use client"`, gray-950 bg, violet accent, `Link` back to `/`
- Sentry capture calls use dynamic import pattern: `import("@sentry/nextjs").then(({ captureException }) => captureException(err, {...}))`
- Button labels must exactly match what the spec clicks (listed per task)
- Success state text must exactly match what the spec asserts (listed per task)
- `waitForTimeout` removed from spec — assertions replace it

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/demo/error/page.tsx` | Modify | Add happy-path button + success state |
| `src/app/demo/performance/page.tsx` | No change needed | Already shows `Response received in Xms` |
| `src/app/demo/replay/page.tsx` | Modify | Add happy-path button + success state |
| `src/app/demo/alerts/page.tsx` | Modify | Add happy-path button + `Inventory OK` success state |
| `src/app/demo/release/page.tsx` | Modify | Add happy-path button + success state |
| `src/app/demo/seer-cart/page.tsx` | No change needed | Already shows `Cart total: $174` |
| `src/app/demo/seer-checkout/page.tsx` | No change needed | Already shows `Order created` |
| `src/app/demo/seer-recommendations/page.tsx` | No change needed | Already shows `Recommended:` |
| `tests/trigger-all-scenarios.spec.ts` | Rewrite | Assert happy path only — all 8 fail with bugs present |

---

## Task 1: Add happy-path success state to `/demo/error`

**Files:**
- Modify: `src/app/demo/error/page.tsx`

**Interfaces:**
- Consumes: `formatPaymentSummary(payload: PaymentPayload): string` from `src/lib/payment.ts`
  - BUG: throws `TypeError` when `payload` is undefined
- The happy path calls `formatPaymentSummary` with a valid payload → returns a formatted string
- Produces: button label `"Process Payment"`, success text `"Payment processed: USD 99.00 charged to cust_demo"`

- [ ] **Step 1: Read current page**

Read `src/app/demo/error/page.tsx` — understand current state shape and button structure.

- [ ] **Step 2: Add happy-path trigger and success state**

Replace the full file content with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPaymentSummary } from "@/lib/payment";

type Status = "idle" | "success" | "crashed";

const DEMO_PAYLOAD = { amount: 99.00, currency: "USD", customerId: "cust_demo" };

export default function ErrorDemoPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function processPayment() {
    try {
      const result = formatPaymentSummary(DEMO_PAYLOAD);
      setSummary(result);
      setStatus("success");
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      setStatus("crashed");
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { scenario: "error-tracking" },
          extra: { payload: null, reason: "payment context missing at checkout" },
        })
      ).catch(() => {});
    }
  }

  function triggerError() {
    try {
      // Simulates missing payment context — passes undefined to trigger the bug
      formatPaymentSummary(undefined as any);
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      setStatus("crashed");
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { scenario: "error-tracking" },
          extra: { payload: null, reason: "payment context missing at checkout" },
        })
      ).catch(() => {});
    }
  }

  function reset() {
    setStatus("idle");
    setSummary(null);
    setError(null);
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

        {status === "idle" && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={processPayment}
              className="bg-violet-700 hover:bg-violet-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Process Payment
            </button>
            <button
              onClick={triggerError}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Trigger Payment Error
            </button>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-300 font-mono text-sm">Payment processed: {summary}</p>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}

        {status === "crashed" && (
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
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify dev server renders page without TypeScript errors**

```bash
npx tsc --noEmit
```
Expected: no errors related to `error/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/app/demo/error/page.tsx
git commit -m "feat: add happy-path to error demo page for fail-first spec"
```

---

## Task 2: Add happy-path success state to `/demo/replay`

**Files:**
- Modify: `src/app/demo/replay/page.tsx`

**Interfaces:**
- Consumes: `validateEmail(email: string | undefined): boolean` from `src/lib/validator.ts`
  - BUG: throws `TypeError` when `email` is undefined
- Happy path: calls `validateEmail` with a real email string → returns `true` → show success
- Produces: submit button label `"Submit Order"`, success text `"Order confirmed: #ORD-demo"`

- [ ] **Step 1: Read current page**

Read `src/app/demo/replay/page.tsx` — understand current step/state shape.

- [ ] **Step 2: Add success state to submitForm and add confirmed step**

Replace the full file content with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { validateEmail } from "@/lib/validator";

type Step = 1 | 2 | 3 | "confirmed" | "error";

export default function ReplayDemoPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function submitForm() {
    try {
      const valid = validateEmail(email);
      if (valid) {
        setStep("confirmed");
      }
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

  function reset() {
    setStep(1);
    setName("");
    setEmail("");
    setErrorMsg(null);
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
        <p className="text-gray-500 text-xs mb-6">Fill in the form and submit. Sentry records every step.</p>

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
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-300 underline">← Back</button>
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
              <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-300 underline">← Back</button>
              <button
                onClick={submitForm}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Submit Order
              </button>
            </div>
          </div>
        )}

        {step === "confirmed" && (
          <div>
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-300 font-mono text-sm">Order confirmed: #ORD-demo</p>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}

        {step === "error" && (
          <div>
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 font-mono text-sm">TypeError: {errorMsg}</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard → find this error → click the <strong>Replay</strong> tab to watch the recording.
            </p>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors related to `replay/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/app/demo/replay/page.tsx
git commit -m "feat: add happy-path success state to replay demo page"
```

---

## Task 3: Add happy-path success state to `/demo/alerts`

**Files:**
- Modify: `src/app/demo/alerts/page.tsx`

**Interfaces:**
- Consumes: `GET /api/broken-route` — BUG: throws when `warehouseId` is empty → returns 500
- Happy path button triggers same fetch but page handles both ok/failed
- Already handles `status === "done"` (res.ok) but renders nothing — needs success text
- Produces: button label `"Check Inventory"`, success text `"Inventory OK"`

- [ ] **Step 1: Read current page**

Read `src/app/demo/alerts/page.tsx`.

- [ ] **Step 2: Add Check Inventory button and Inventory OK success state**

Replace the full file content with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "done" | "failed";

export default function AlertsDemoPage() {
  const [status, setStatus] = useState<Status>("idle");

  async function checkInventory() {
    setStatus("loading");
    const res = await fetch("/api/broken-route");
    setStatus(res.ok ? "done" : "failed");
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Alerts &amp; Notifications Demo</h2>

      <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h3 className="font-semibold text-violet-300 mb-1">What this shows</h3>
        <p className="text-gray-400 text-sm">
          Sentry can fire alerts the moment a new error type appears — to Slack, email, PagerDuty, or any webhook.
          You configure rules once; the team gets notified automatically. This demo triggers a server-side 500 error
          which Sentry captures and can route to your channel of choice.
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="font-semibold mb-4">Scenario: Inventory Service Unavailable (Server 500)</h3>

        <div className="bg-gray-800 rounded-lg px-4 py-3 mb-5 text-xs text-gray-400">
          <p className="font-semibold text-gray-300 mb-1">Before clicking: configure an alert rule in Sentry</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Sentry → Alerts → Create Alert Rule</li>
            <li>Condition: &quot;A new issue is created&quot;</li>
            <li>Action: Send email to your address (or Slack)</li>
            <li>Save, then come back and click the button below</li>
          </ol>
        </div>

        {status === "idle" && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={checkInventory}
              className="bg-violet-700 hover:bg-violet-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Check Inventory
            </button>
            <button
              onClick={checkInventory}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Trigger Server 500
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="text-orange-400">Calling /api/broken-route...</div>
        )}

        {status === "done" && (
          <div>
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-300 font-mono text-sm">Inventory OK</p>
            </div>
            <button onClick={() => setStatus("idle")} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}

        {status === "failed" && (
          <div>
            <div className="bg-orange-950 border border-orange-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-orange-300 font-mono text-sm">Server returned 500 — error captured by Sentry.</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Check your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard for the new server-side error.
            </p>
            <button onClick={() => setStatus("idle")} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Note:** The `Check Inventory` and `Trigger Server 500` buttons call the same function — both hit `/api/broken-route`. While the bug is present, both return 500. After the fix, both return 200 and show `Inventory OK`.

- [ ] **Step 3: Fix `/api/broken-route/route.ts` to support a happy path**

The current route always throws because `fetchInventory("")` always fails. We need it to succeed when called normally — the bug is that `warehouseId` is hardcoded to `""`. Fix: accept an optional query param, default to a valid warehouse ID for the happy path.

Read `src/app/api/broken-route/route.ts` then replace with:

```typescript
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { fetchInventory } from "@/lib/inventory";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const warehouseId = req.nextUrl.searchParams.get("warehouseId") ?? "";
  // BUG: warehouseId defaults to "" — fetchInventory throws when warehouseId is empty
  const inventory = await fetchInventory(warehouseId);
  return NextResponse.json({ status: "ok", inventory });
}
```

This preserves the bug (empty string still throws) but allows a future fix: pass `warehouseId=WH-001` as default or fix the empty string default.

- [ ] **Step 4: Update alerts page to pass warehouseId param for the happy path**

The `Check Inventory` button should eventually (after fix) hit `?warehouseId=WH-001`. For now both paths hit the same buggy endpoint. Update the `checkInventory` function:

```tsx
async function checkInventory() {
  setStatus("loading");
  const res = await fetch("/api/broken-route");
  setStatus(res.ok ? "done" : "failed");
}
```

(No change needed — the route bug causes 500 regardless of params while unfixed.)

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/app/demo/alerts/page.tsx src/app/api/broken-route/route.ts
git commit -m "feat: add happy-path to alerts demo, refactor broken-route to use query param"
```

---

## Task 4: Add happy-path success state to `/demo/release`

**Files:**
- Modify: `src/app/demo/release/page.tsx`

**Interfaces:**
- Consumes: `getReleaseConfig(version: string): ReleaseConfig` from `src/lib/release.ts`
  - BUG: throws `TypeError` when version not in `RELEASE_CONFIGS` map
  - Happy path: call with a known version (`process.env.NEXT_PUBLIC_APP_VERSION`) → returns config
- Produces: button label `"Check Feature Flag"`, success text `"Flag enabled: newCheckout"`

- [ ] **Step 1: Read current page**

Read `src/app/demo/release/page.tsx`.

- [ ] **Step 2: Add happy-path button and success state**

Replace the full file content with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { getReleaseConfig } from "@/lib/release";

type Status = "idle" | "success" | "crashed";

export default function ReleaseDemoPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [flagName, setFlagName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";

  function checkFeatureFlag() {
    try {
      const config = getReleaseConfig(version);
      const enabledFlag = Object.entries(config.featureFlags).find(([, v]) => v)?.[0] ?? "none";
      setFlagName(enabledFlag);
      setStatus("success");
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message);
      setStatus("crashed");
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { release: version, scenario: "release-tracking" },
          extra: { requestedVersion: version },
        })
      ).catch(() => {});
    }
  }

  function triggerVersionedError() {
    try {
      const unknownVersion = `${version}-hotfix-99`;
      getReleaseConfig(unknownVersion);
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message);
      setStatus("crashed");
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { release: version, scenario: "release-tracking" },
          extra: { requestedVersion: `${version}-hotfix-99`, knownVersions: [version] },
        })
      ).catch(() => {});
    }
  }

  function reset() {
    setStatus("idle");
    setFlagName(null);
    setErrorMsg(null);
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
          When a new deploy causes a regression, Sentry surfaces it immediately.
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

        {status === "idle" && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={checkFeatureFlag}
              className="bg-violet-700 hover:bg-violet-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Check Feature Flag
            </button>
            <button
              onClick={triggerVersionedError}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Trigger Versioned Error
            </button>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-300 font-mono text-sm">Flag enabled: {flagName}</p>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}

        {status === "crashed" && (
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
              <strong>First seen in release {version}</strong>.
            </p>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Note on the bug:** `getReleaseConfig(version)` where `version = "v1.1.0"` will ALSO throw because `RELEASE_CONFIGS` only has `"v1.0.0-demo"`. The fix for this task's happy path requires either adding `v1.1.0` to `RELEASE_CONFIGS` in `release.ts`, OR fixing `getReleaseConfig` to not crash on unknown versions. The spec fix target is: fix `getReleaseConfig` to return a default config instead of throwing.

- [ ] **Step 3: Add v1.1.0 to RELEASE_CONFIGS so happy path works after fix**

Read `src/lib/release.ts` then add the new version entry:

```typescript
const RELEASE_CONFIGS: Record<string, ReleaseConfig> = {
  "v1.0.0-demo": {
    version: "v1.0.0-demo",
    featureFlags: { newCheckout: true, betaDashboard: false },
    deployedAt: "2026-06-25T00:00:00Z",
  },
  "v1.1.0": {
    version: "v1.1.0",
    featureFlags: { newCheckout: true, betaDashboard: true },
    deployedAt: "2026-06-25T00:00:00Z",
  },
};
```

This does NOT fix the bug — `getReleaseConfig` still throws for unknown versions. But it means after the bug fix (adding a null guard), the happy path with `v1.1.0` succeeds.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/demo/release/page.tsx src/lib/release.ts
git commit -m "feat: add happy-path to release demo, add v1.1.0 to release configs"
```

---

## Task 5: Rewrite spec — assert happy path only, all 8 tests fail with bugs present

**Files:**
- Modify: `tests/trigger-all-scenarios.spec.ts`

**Interfaces:**
- Consumes button labels and success text from Tasks 1–4 plus existing pages 6–8
- All 8 tests must FAIL before any bug is fixed
- All 8 tests must PASS after all bugs are fixed

**Expected failure reasons per test (bugs present):**

| Test | Failure reason |
|---|---|
| 1 | `formatPaymentSummary(DEMO_PAYLOAD)` throws — `payload` access crashes before success state renders |
| 2 | `/api/slow-route` still succeeds (no bug here) — **already passes** |
| 3 | `validateEmail(email)` — email is a real string now, `trim()` works → **already passes** |
| 4 | `GET /api/broken-route` returns 500 — `status === "done"` never reached |
| 5 | `getReleaseConfig(version)` throws for `v1.1.0` → success state never renders |
| 6 | `calculateCartTotal(MOCK_ITEMS)` — items is defined, works → **already passes** |
| 7 | `POST /api/checkout` with $149 — amount != 0, works → **already passes** |
| 8 | `getRecommendedProduct(45)` — `Math.floor(45/10) = 4`, within bounds → **already passes** |

**Re-analysis:** Tests 2, 3, 6, 7, 8 test the working path that already succeeds. Only tests 1, 4, 5 fail with bugs. To make ALL 8 fail, the happy-path buttons must call the buggy path OR we need to reconsider.

**Revised approach:** The spec should call the **crash path** button and assert the **error does NOT appear** (i.e., assert `text-red-400` is NOT visible). This way:
- With bug: crash happens → error visible → `not.toBeVisible()` fails ✓
- After fix: no crash → error not visible → `not.toBeVisible()` passes ✓

This makes all 8 tests fail with bugs present.

- [ ] **Step 1: Read current spec**

Read `tests/trigger-all-scenarios.spec.ts`.

- [ ] **Step 2: Rewrite spec with crash-path + negative assertions**

Replace the full file content with:

```typescript
import { test, expect } from "@playwright/test";

// Fail-first spec: each test triggers the buggy path and asserts NO error is shown.
// With bugs present  → crash occurs → error div visible  → test FAILS
// After bugs fixed   → no crash     → error div absent   → test PASSES

test("Scenario 1 — Error Tracking: formatPaymentSummary handles undefined payload", async ({ page }) => {
  await page.goto("/demo/error");
  await page.getByRole("button", { name: "Trigger Payment Error" }).click();
  await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
});

test("Scenario 2 — Performance Monitoring: slow-route responds successfully", async ({ page }) => {
  await page.goto("/demo/performance");
  await page.getByRole("button", { name: "Simulate Slow Checkout API" }).click();
  await expect(page.getByText(/Response received in \d+ms/)).toBeVisible({ timeout: 10000 });
  // No error path exists for this scenario — test passes always (performance bug is latency, not crash)
});

test("Scenario 3 — Session Replay: submitOrder handles undefined email", async ({ page }) => {
  await page.goto("/demo/replay");
  await page.getByPlaceholder("Jane Smith").fill("Demo User");
  await page.getByRole("button", { name: "Next →" }).click();
  await page.getByPlaceholder("jane@example.com").fill("demo@werkdone.com");
  await page.getByRole("button", { name: "Next →" }).click();
  await page.getByRole("button", { name: "Submit Order" }).click();
  await expect(page.locator(".text-red-400.font-mono")).not.toBeVisible({ timeout: 5000 });
});

test("Scenario 4 — Alerts: inventory route returns 200", async ({ page }) => {
  await page.goto("/demo/alerts");
  await page.getByRole("button", { name: "Check Inventory" }).click();
  await expect(page.getByText("Inventory OK")).toBeVisible({ timeout: 8000 });
});

test("Scenario 5 — Release Tracking: getReleaseConfig handles current version", async ({ page }) => {
  await page.goto("/demo/release");
  await page.getByRole("button", { name: "Check Feature Flag" }).click();
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
```

- [ ] **Step 3: Run spec — verify all 8 FAIL**

```bash
npx playwright test tests/trigger-all-scenarios.spec.ts
```

Expected output:
```
  8 failed
  1) Scenario 1 — Error Tracking: ...
  2) Scenario 2 — Performance Monitoring: ...  ← may pass (no crash path)
  ...
```

**Note:** Scenario 2 has no crash path — it always passes. If you want it to fail, the slow-route API needs a bug planted (e.g., divide-by-zero in duration calculation). Accept it passing for now, or plant a bug per the spec's extension path.

- [ ] **Step 4: Commit**

```bash
git add tests/trigger-all-scenarios.spec.ts
git commit -m "feat: rewrite spec to fail-first — assert crash path produces no error"
```

---

## Task 6: Plant bug in performance scenario so Scenario 2 also fails

**Files:**
- Modify: `src/app/demo/performance/page.tsx`
- Modify (or create): ensure `/api/slow-route` can return an error state

**Context:** Scenario 2 has no crash state today — `triggerSlowCall` always succeeds. To make the test fail, we need to either:
- Make `/api/slow-route` return an error (plant a server bug)
- Or change the assertion to something that only passes after a fix

**Approach:** Plant a bug in the performance page that causes `duration` to display as `Infinity` (divide by zero in a helper), then assert the displayed text does NOT contain `Infinity`.

- [ ] **Step 1: Create `src/lib/checkout.ts` with planted divide-by-zero bug**

```typescript
// BUG: divisor is 0 instead of 1000 — returns Infinity instead of milliseconds
export function getCheckoutDuration(startMs: number, endMs: number): number {
  return (endMs - startMs) / 0;
}
```

- [ ] **Step 2: Modify performance page to use getCheckoutDuration**

Read `src/app/demo/performance/page.tsx` then replace the full file with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { getCheckoutDuration } from "@/lib/checkout";

type Status = "idle" | "loading" | "done";

export default function PerformanceDemoPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [duration, setDuration] = useState<number | null>(null);

  async function triggerSlowCall() {
    setStatus("loading");
    const start = Date.now();
    await fetch("/api/slow-route");
    const end = Date.now();
    // BUG: getCheckoutDuration divides by 0 — returns Infinity
    const ms = getCheckoutDuration(start, end);
    import("@sentry/nextjs").then(({ captureMessage }) => {
      if (!isFinite(ms)) {
        captureMessage("Checkout duration calculation returned Infinity", {
          level: "error",
          tags: { scenario: "performance" },
          extra: { start, end, result: ms },
        });
      }
    }).catch(() => {});
    setDuration(ms);
    setStatus("done");
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Performance Monitoring Demo</h2>

      <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h3 className="font-semibold text-violet-300 mb-1">What this shows</h3>
        <p className="text-gray-400 text-sm">
          Sentry traces every API call as a transaction and breaks it into spans (database queries, HTTP calls, etc.).
          Slow spans are automatically highlighted. You can see P50/P95 latency across all users — not just your own.
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="font-semibold mb-4">Scenario: Slow Checkout Database Query</h3>

        {status === "idle" && (
          <button
            onClick={triggerSlowCall}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Simulate Slow Checkout API
          </button>
        )}

        {status === "loading" && (
          <div className="flex items-center gap-3 text-yellow-400">
            <span className="animate-spin text-xl">⏳</span>
            <span>Calling /api/slow-route — this will take ~3 seconds...</span>
          </div>
        )}

        {status === "done" && (
          <div>
            <div className="bg-yellow-950 border border-yellow-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-yellow-300 font-mono text-sm">
                Response received in {duration}ms — a 3s database query was traced as a span.
              </p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Performance
              </a>{" "}
              tab — find the <code className="bg-gray-800 px-1 rounded">GET /api/slow-route</code> transaction.
            </p>
            <button
              onClick={() => { setStatus("idle"); setDuration(null); }}
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

- [ ] **Step 3: Update Scenario 2 assertion in spec to fail when Infinity**

Read `tests/trigger-all-scenarios.spec.ts` then update test 2:

```typescript
test("Scenario 2 — Performance Monitoring: getCheckoutDuration returns finite ms", async ({ page }) => {
  await page.goto("/demo/performance");
  await page.getByRole("button", { name: "Simulate Slow Checkout API" }).click();
  await expect(page.getByText(/Response received in \d+ms/)).toBeVisible({ timeout: 10000 });
  // With bug: shows "Infinity ms" — regex \d+ does not match "Infinity" → FAILS
  // After fix: shows e.g. "3021ms" — regex matches → PASSES
});
```

The regex `/Response received in \d+ms/` only matches finite integer values — `Infinity` does not match `\d+`, so the test fails with the bug present.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Run full spec — verify all 8 now fail**

```bash
npx playwright test tests/trigger-all-scenarios.spec.ts
```

Expected: `8 failed`

- [ ] **Step 6: Commit**

```bash
git add src/lib/checkout.ts src/app/demo/performance/page.tsx tests/trigger-all-scenarios.spec.ts
git commit -m "feat: plant divide-by-zero bug in checkout lib so scenario 2 fails in spec"
```

---

## Fix Targets (reference — do NOT implement in this plan)

After this plan is complete, applying these fixes makes all 8 tests pass:

| # | File | Fix |
|---|---|---|
| 1 | `src/lib/payment.ts` | Add null guard: `if (!payload) throw` → `if (!payload) return "No payment data"` — or make function handle undefined gracefully |
| 2 | `src/lib/checkout.ts` | Change `/ 0` to `/ 1000` |
| 3 | `src/lib/validator.ts` | `if (!email) return false` before `.trim()` |
| 4 | `src/app/api/broken-route/route.ts` | Pass `"WH-001"` as default instead of `""` |
| 5 | `src/lib/release.ts` | Return default config instead of crashing: `if (!config) return { version, featureFlags: {}, deployedAt: new Date().toISOString() }` |
| 6 | `src/lib/cart.ts` | `(items ?? []).reduce(...)` |
| 7 | `src/app/api/checkout/route.ts` | Wrap `processPayment` in try/catch, return `NextResponse.json({ error }, { status: 400 })` |
| 8 | `src/lib/recommendations.ts` | `const index = Math.min(Math.floor(userId / 10), PRODUCTS.length - 1)` |
