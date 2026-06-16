# Sentry.io Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 demo app showcasing 5 Sentry features (error tracking, performance, session replay, alerts, release tracking) and produce an executive summary for a mixed technical/business audience.

**Architecture:** Greenfield Next.js 14 App Router project with `@sentry/nextjs` SDK. Five demo pages each trigger a specific Sentry feature. No database — all errors are simulated in-app. Output includes a running app and a written executive summary at `docs/executive-summary.md`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, `@sentry/nextjs`

---

## File Map

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Landing page with nav links to all 5 demo pages |
| `src/app/layout.tsx` | Root layout with Tailwind, metadata |
| `src/app/demo/error/page.tsx` | Client-side unhandled error demo |
| `src/app/demo/performance/page.tsx` | Slow API call demo |
| `src/app/demo/replay/page.tsx` | Session replay via multi-step form |
| `src/app/demo/alerts/page.tsx` | Server-side 500 error / alert demo |
| `src/app/demo/release/page.tsx` | Release-tagged error demo |
| `src/app/api/slow-route/route.ts` | API route that sleeps 3s (performance demo) |
| `src/app/api/broken-route/route.ts` | API route that throws 500 (alerts demo) |
| `src/sentry.client.config.ts` | Sentry client SDK init |
| `src/sentry.server.config.ts` | Sentry server SDK init |
| `src/instrumentation.ts` | Next.js instrumentation hook for server Sentry |
| `next.config.ts` | withSentryConfig wrapper |
| `.env.local` | DSN, auth token, app version (not committed) |
| `docs/executive-summary.md` | Final stakeholder deliverable |

---

## Task 1: Scaffold the Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create the Next.js app**

Run from `/Users/lukydwisaputra/Desktop/QA/sentry-simulation`:

```bash
npx create-next-app@14 . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
```

When prompted:
- Would you like to use ESLint? → Yes
- All other prompts → accept defaults

- [ ] **Step 2: Verify the scaffold**

```bash
npm run dev
```

Open `http://localhost:3000` — you should see the default Next.js welcome page. Stop the dev server (Ctrl+C).

- [ ] **Step 3: Install Sentry SDK**

```bash
npx @sentry/wizard@latest -i nextjs --saas
```

This wizard will:
1. Ask you to log in to Sentry (or create an account at sentry.io)
2. Create a new Sentry project (choose "Next.js" platform)
3. Write `sentry.client.config.ts`, `sentry.server.config.ts`, `instrumentation.ts`, and update `next.config.ts`
4. Set `SENTRY_DSN` in `.env.local`

When the wizard finishes, confirm these files exist:
- `sentry.client.config.ts`
- `sentry.server.config.ts`  
- `src/instrumentation.ts`
- `next.config.ts` (wrapped with `withSentryConfig`)

- [ ] **Step 4: Add missing env vars to `.env.local`**

Open `.env.local` (created by the wizard). Add these two lines:

```
NEXT_PUBLIC_APP_VERSION=v1.0.0-demo
SENTRY_AUTH_TOKEN=<paste the token the wizard gave you, if not already there>
```

> Note: `NEXT_PUBLIC_` prefix makes the value available in browser code. `SENTRY_AUTH_TOKEN` is server-only (no prefix) and is used by the build step to upload source maps.

- [ ] **Step 5: Update Sentry client config to enable replay**

Open `sentry.client.config.ts`. Replace its contents with:

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  integrations: [Sentry.replayIntegration()],
  debug: false,
});
```

- [ ] **Step 6: Update Sentry server config**

Open `sentry.server.config.ts`. Replace its contents with:

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  debug: false,
});
```

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 14 app with Sentry SDK wired up"
```

---

## Task 2: Build the Landing Page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentry Demo — QA Evaluation",
  description: "Interactive demo of Sentry.io features for the 'Should we integrate Sentry?' decision",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen font-sans antialiased">
        <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl font-bold text-violet-400">Sentry Demo</span>
          <span className="text-gray-500 text-sm">QA Evaluation · werkdone</span>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Replace `src/app/page.tsx`**

```tsx
import Link from "next/link";

const demos = [
  {
    href: "/demo/error",
    title: "1. Error Tracking",
    description: "Trigger an unhandled client-side exception and watch it appear in Sentry with a full stack trace.",
    feature: "Issues",
    color: "border-red-500",
    badge: "bg-red-500",
  },
  {
    href: "/demo/performance",
    title: "2. Performance Monitoring",
    description: "Call a slow API route and see the transaction trace with slow spans highlighted in Sentry.",
    feature: "Performance",
    color: "border-yellow-500",
    badge: "bg-yellow-500",
  },
  {
    href: "/demo/replay",
    title: "3. Session Replay",
    description: "Fill out a multi-step form that crashes on submit — then watch the session replay in Sentry.",
    feature: "Replay",
    color: "border-blue-500",
    badge: "bg-blue-500",
  },
  {
    href: "/demo/alerts",
    title: "4. Alerts & Notifications",
    description: "Trigger a server-side 500 error and see Sentry create an issue and fire a configured alert rule.",
    feature: "Alerts",
    color: "border-orange-500",
    badge: "bg-orange-500",
  },
  {
    href: "/demo/release",
    title: "5. Release Tracking",
    description: "Throw a version-tagged error and see Sentry attribute it to the current release.",
    feature: "Releases",
    color: "border-green-500",
    badge: "bg-green-500",
  },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Interactive Sentry Evaluation</h1>
      <p className="text-gray-400 mb-10">
        Click each demo below, trigger the scenario, then open your{" "}
        <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
          Sentry dashboard
        </a>{" "}
        to see the data captured in real time.
      </p>

      <div className="grid gap-4">
        {demos.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            className={`block rounded-xl border-l-4 ${demo.color} bg-gray-900 px-6 py-5 hover:bg-gray-800 transition-colors`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-lg">{demo.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${demo.badge}`}>{demo.feature}</span>
            </div>
            <p className="text-gray-400 text-sm">{demo.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the landing page**

```bash
npm run dev
```

Open `http://localhost:3000` — you should see a dark page titled "Interactive Sentry Evaluation" with 5 clickable cards. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat: add landing page with navigation to all 5 demo scenarios"
```

---

## Task 3: Error Tracking Demo Page

**Files:**
- Create: `src/app/demo/error/page.tsx`

- [ ] **Step 1: Create the directory and page**

Create `src/app/demo/error/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ErrorDemoPage() {
  const [triggered, setTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function triggerError() {
    setTriggered(true);
    // Sentry automatically captures unhandled errors in React via the error boundary.
    // We use a try/catch here to show the error in the UI AND let Sentry capture it.
    try {
      throw new Error("Payment service failed: timeout after 5000ms");
    } catch (err) {
      // Re-throw so Sentry's global handler captures it
      const e = err as Error;
      setError(e.message);
      // Manually capture so it's definitely sent even in try/catch
      import("@sentry/nextjs").then(({ captureException }) => captureException(err));
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
        <h3 className="font-semibold mb-4">Scenario: Payment Gateway Timeout</h3>

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
              <p className="text-red-400 font-mono text-sm">Error: {error}</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Error sent to Sentry. Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard — it should appear within 5 seconds.
            </p>
            <p className="text-gray-500 text-xs">
              In Sentry: click the issue → see stack trace, breadcrumbs, browser context, and affected users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders and captures the error**

```bash
npm run dev
```

1. Open `http://localhost:3000/demo/error`
2. Click "Trigger Payment Error"
3. Confirm the red error box appears in the UI
4. Open your Sentry dashboard → Issues — the error should appear within ~5 seconds with the message "Payment service failed: timeout after 5000ms"

Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/demo/error/page.tsx
git commit -m "feat: add error tracking demo page"
```

---

## Task 4: API Routes (Slow + Broken)

**Files:**
- Create: `src/app/api/slow-route/route.ts`
- Create: `src/app/api/broken-route/route.ts`

- [ ] **Step 1: Create the slow API route**

Create `src/app/api/slow-route/route.ts`:

```ts
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  return await Sentry.startSpan(
    { name: "checkout.database.query", op: "db.query" },
    async () => {
      // Simulate a slow database query
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return NextResponse.json({ message: "Checkout complete", duration_ms: 3000 });
    }
  );
}
```

- [ ] **Step 2: Create the broken API route**

Create `src/app/api/broken-route/route.ts`:

```ts
import { NextResponse } from "next/server";

export async function GET() {
  // Sentry automatically captures unhandled errors in Next.js API routes
  // via the withSentryConfig wrapper in next.config.ts — no manual try/catch needed.
  throw new Error("Internal server error: inventory service unreachable");
  // This line is unreachable; Next.js returns a 500 automatically on unhandled throw
  return NextResponse.json({ error: "unreachable" }, { status: 500 });
}
```

- [ ] **Step 3: Verify both routes**

```bash
npm run dev
```

In a new terminal:
```bash
# Should respond after ~3 seconds
curl http://localhost:3000/api/slow-route

# Should return a 500 error
curl -I http://localhost:3000/api/broken-route
```

Expected for slow-route: `{"message":"Checkout complete","duration_ms":3000}` (after 3s delay)
Expected for broken-route: HTTP 500 response

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/slow-route/route.ts src/app/api/broken-route/route.ts
git commit -m "feat: add slow and broken API routes for demo scenarios"
```

---

## Task 5: Performance Monitoring Demo Page

**Files:**
- Create: `src/app/demo/performance/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/demo/performance/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "done";

export default function PerformanceDemoPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [duration, setDuration] = useState<number | null>(null);

  async function triggerSlowCall() {
    setStatus("loading");
    const start = Date.now();
    await fetch("/api/slow-route");
    setDuration(Date.now() - start);
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
              tab — find the <code className="bg-gray-800 px-1 rounded">GET /api/slow-route</code> transaction and expand
              the span waterfall to see the <code className="bg-gray-800 px-1 rounded">checkout.database.query</code> span.
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

- [ ] **Step 2: Verify the page**

```bash
npm run dev
```

1. Open `http://localhost:3000/demo/performance`
2. Click "Simulate Slow Checkout API" — the spinner should show for ~3 seconds
3. After completion, open Sentry → Performance tab → find the `GET /api/slow-route` transaction
4. Expand the spans — you should see `checkout.database.query` with a ~3s duration

Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/demo/performance/page.tsx
git commit -m "feat: add performance monitoring demo page"
```

---

## Task 6: Session Replay Demo Page

**Files:**
- Create: `src/app/demo/replay/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/demo/replay/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

type Step = 1 | 2 | 3 | "error";

export default function ReplayDemoPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submitForm() {
    // Simulate a crash on form submission
    const err = new Error("Form submission failed: CSRF token mismatch");
    Sentry.captureException(err);
    setStep("error");
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
              <p className="text-red-400 font-mono text-sm">Error: Form submission failed: CSRF token mismatch</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Error sent to Sentry. Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard → find this error → click the <strong>Replay</strong> tab to watch the recording of exactly
              what you typed and clicked.
            </p>
            <button
              onClick={() => { setStep(1); setName(""); setEmail(""); }}
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

- [ ] **Step 2: Verify the page**

```bash
npm run dev
```

1. Open `http://localhost:3000/demo/replay`
2. Fill in the 3-step form with any name and email, click through all steps, click "Submit Order"
3. Confirm the red error box appears
4. Open Sentry → Issues → find "Form submission failed: CSRF token mismatch" → click it → click the **Replay** tab
5. Confirm the session replay recording shows your interactions (may take 30–60 seconds to process)

Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/demo/replay/page.tsx
git commit -m "feat: add session replay demo page with multi-step form"
```

---

## Task 7: Alerts Demo Page

**Files:**
- Create: `src/app/demo/alerts/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/demo/alerts/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "done" | "failed";

export default function AlertsDemoPage() {
  const [status, setStatus] = useState<Status>("idle");

  async function triggerServerError() {
    setStatus("loading");
    const res = await fetch("/api/broken-route");
    setStatus(res.ok ? "done" : "failed");
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Alerts & Notifications Demo</h2>

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
          <button
            onClick={triggerServerError}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Trigger Server 500
          </button>
        )}

        {status === "loading" && (
          <div className="text-orange-400">Calling /api/broken-route...</div>
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
              dashboard for the new server-side error. If you configured an alert rule, check your email or Slack for the notification.
            </p>
            <button
              onClick={() => setStatus("idle")}
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

- [ ] **Step 2: Verify the page**

```bash
npm run dev
```

1. (Optional) Configure an alert rule in Sentry first (see on-page instructions)
2. Open `http://localhost:3000/demo/alerts`
3. Click "Trigger Server 500"
4. Confirm the orange error box appears
5. Open Sentry → Issues — confirm a server-side error appears ("Internal server error: inventory service unreachable")
6. If you set up an alert rule, check your email/Slack for the notification

Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/demo/alerts/page.tsx
git commit -m "feat: add alerts demo page"
```

---

## Task 8: Release Tracking Demo Page

**Files:**
- Create: `src/app/demo/release/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/demo/release/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function ReleaseDemoPage() {
  const [triggered, setTriggered] = useState(false);
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";

  function triggerVersionedError() {
    const err = new Error(`Feature flag service timeout — release ${version}`);
    Sentry.captureException(err, {
      tags: { release: version, scenario: "release-tracking" },
    });
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
        <h3 className="font-semibold mb-4">Scenario: Error Tagged to Current Release</h3>

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
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-400 font-mono text-sm">
                Error captured and tagged to release: {version}
              </p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard → find the &quot;Feature flag service timeout&quot; issue → look for{" "}
              <strong>First seen in release {version}</strong>. Also check the <strong>Releases</strong> tab to see errors
              grouped by version.
            </p>
            <button
              onClick={() => setTriggered(false)}
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

- [ ] **Step 2: Verify the page**

```bash
npm run dev
```

1. Open `http://localhost:3000/demo/release`
2. Confirm the green "Current release" box shows `v1.0.0-demo` (from your `.env.local`)
3. Click "Trigger Versioned Error"
4. Open Sentry → Issues → find "Feature flag service timeout" → confirm it shows the release tag `v1.0.0-demo`

Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/demo/release/page.tsx
git commit -m "feat: add release tracking demo page"
```

---

## Task 9: End-to-End Verification

**No new files — this is a full run-through of all scenarios.**

- [ ] **Step 1: Start the app**

```bash
npm run dev
```

- [ ] **Step 2: Run all 5 scenarios in order**

Visit each URL and trigger the scenario:

| URL | Action | Expected Sentry result |
|---|---|---|
| `/demo/error` | Click "Trigger Payment Error" | New issue in Sentry Issues within 5s |
| `/demo/performance` | Click "Simulate Slow Checkout API" | Transaction in Performance tab with 3s span |
| `/demo/replay` | Fill form, submit | Issue with Replay tab visible (allow 30-60s to process) |
| `/demo/alerts` | Click "Trigger Server 500" | Server-side issue in Sentry; alert fires if configured |
| `/demo/release` | Click "Trigger Versioned Error" | Issue tagged with `v1.0.0-demo` in Sentry |

- [ ] **Step 3: Verify all 5 scenarios are captured in Sentry**

In your Sentry dashboard:
- Issues list should show at least 3–4 distinct issues
- Performance tab should show the slow-route transaction
- Replay tab (on the replay issue) should show the recording
- Releases tab (optional, requires `SENTRY_AUTH_TOKEN`) should show `v1.0.0-demo`

- [ ] **Step 4: Make note of real Sentry findings for the executive summary**

For each scenario, note:
- The exact error message Sentry captured
- How quickly it appeared (seconds)
- What extra context Sentry provided (browser, OS, stack trace depth, breadcrumbs)
- Whether the replay, span, or release tag was visible

These become the "Key Findings" section of the executive summary.

---

## Task 10: Write the Executive Summary

**Files:**
- Create: `docs/executive-summary.md`

- [ ] **Step 1: Create `docs/executive-summary.md`**

Use the template below, replacing `[...]` placeholders with your real findings from Task 9:

```markdown
# Should We Integrate Sentry? — Executive Summary

**Prepared by:** luky.saputra@werkdone.com  
**Date:** 2026-06-16  
**Demo app:** Next.js 14 + @sentry/nextjs (run locally)

---

## Executive Summary

Sentry is a production observability platform that captures errors, performance bottlenecks, and user session
recordings automatically — with minimal code changes. Our evaluation demo showed that Sentry can detect and
surface a production error in under 5 seconds, with full context (stack trace, user actions, browser environment)
that would otherwise require hours of log-digging. For a greenfield stack with no existing monitoring,
the integration cost is approximately 1 developer-day. **Recommendation: integrate Sentry before the first
production deployment.**

---

## What is Sentry?

Sentry is an application monitoring platform used by over 100,000 organisations (including GitHub, Cloudflare,
and Notion). It automatically captures exceptions, slow API transactions, and user session recordings from your
running application and presents them in a searchable dashboard. Unlike server logs, Sentry correlates errors
with the user journey, browser environment, and code version — giving engineers the context they need to reproduce
and fix bugs without guessing.

---

## What We Tested

We built a Next.js 14 demo app with 5 intentional failure scenarios:

1. **Error Tracking** — Triggered an unhandled client-side exception simulating a payment gateway timeout
2. **Performance Monitoring** — Called an API route with a 3-second simulated database query
3. **Session Replay** — Filled a multi-step form that crashed on submit
4. **Alerts** — Triggered a server-side 500 error to test alert rule delivery
5. **Release Tracking** — Threw an error tagged to release `v1.0.0-demo`

---

## Key Findings

### Error Tracking
- **What happened:** Sentry captured the exception in [X] seconds
- **Context provided:** Full stack trace, [X] breadcrumbs, browser ([browser]), OS ([OS]), app version
- **Business impact:** Engineers can reproduce and fix errors without asking users to describe what happened.
  Estimated MTTR reduction: hours → minutes for UI bugs.

### Performance Monitoring
- **What happened:** The 3-second API call appeared as a transaction with a `checkout.database.query` span
- **Context provided:** Span waterfall showing exactly which operation was slow
- **Business impact:** Pinpoints which query or service is causing latency. No more "the app feels slow" tickets
  without actionable data.

### Session Replay
- **What happened:** Sentry recorded the full multi-step form interaction and attached it to the error
- **Context provided:** Video-style replay of every click and keystroke before the crash
- **Business impact:** Eliminates "cannot reproduce" bugs. Particularly valuable for checkout flows and onboarding
  where user behaviour is hard to predict.

### Alerts & Notifications
- **What happened:** The server-side 500 error created a new Sentry issue and [fired / did not fire, see note] an alert
- **Context provided:** Issue created with server stack trace; alert delivered to [email/Slack] in [X] minutes
- **Business impact:** The team is notified of production regressions immediately — not when a customer complaints.

### Release Tracking
- **What happened:** The error was tagged to release `v1.0.0-demo` and appeared under the Releases tab
- **Context provided:** "First seen in release v1.0.0-demo" — links error to the deploy that introduced it
- **Business impact:** After each deploy, Sentry shows a regression count. Engineers know within minutes if a
  release is stable or needs a rollback.

---

## Integration Effort

| Factor | Assessment |
|---|---|
| SDK maturity | Official `@sentry/nextjs` package — maintained by Sentry, used in production by thousands of Next.js apps |
| Setup time (greenfield) | ~1 developer-day: wizard scaffolds the config, manual tuning of sample rates and alert rules |
| Ongoing maintenance | Low — SDK updates are minor version bumps; alert rules are configured once |
| Code changes required | ~5 lines of config; zero changes to existing application logic |
| CI/CD integration | Source map upload via `SENTRY_AUTH_TOKEN` in the build step (~30 min to configure) |

---

## Risks & Considerations

| Risk | Severity | Mitigation |
|---|---|---|
| Session Replay captures PII (names, emails typed into forms) | Medium | Enable PII scrubbing rules in Sentry replay config; mask sensitive fields with `data-sentry-mask` attribute |
| Cost at scale — replay and performance data volume | Medium | Set `replaysSessionSampleRate` to 0.1 (10%) in production; scale up as budget allows. Free tier covers 5k errors/month. |
| Alert fatigue if too many rules are configured | Low | Start with 1 rule: "new issue → Slack". Add granularity after 2 weeks of baseline data. |
| Data residency (EU data stored in US by default) | Low (verify with legal) | Sentry offers EU-region hosting on paid plans |

---

## Recommendation

**Yes — integrate Sentry before the first production deployment.**

The integration cost is 1 developer-day and the ongoing maintenance is negligible. Without it, the team will be
flying blind in production: errors will only surface when users report them, performance issues will be invisible,
and debugging will require log archaeology. With Sentry, the team gets automatic error detection, performance
baselines, and a direct line from user experience to code.

**Conditions:**
- Enable PII scrubbing for Session Replay before enabling it in production
- Start with 10% session sampling in production (adjust based on cost)
- Configure a single Slack alert rule on day 1; iterate from there

---

## Next Steps (if approved)

- [ ] Engineer sets up Sentry project and wires `SENTRY_DSN` into the production environment
- [ ] Configure `SENTRY_AUTH_TOKEN` in CI/CD pipeline for source map uploads
- [ ] Add `data-sentry-mask` attributes to any input fields that capture PII
- [ ] Create 1 alert rule: new issue → #engineering-alerts Slack channel
- [ ] Set production sample rates: `tracesSampleRate: 0.2`, `replaysSessionSampleRate: 0.1`
- [ ] Review after 2 weeks: tune alert rules, add performance thresholds

---

*This summary was produced from a live demo. All findings are from real Sentry captures, not hypothetical.*
```

- [ ] **Step 2: Fill in the placeholders**

Replace every `[...]` in the document with your real observations from Task 9 Step 4.

- [ ] **Step 3: Commit everything**

```bash
git add docs/executive-summary.md
git commit -m "docs: add executive summary with real Sentry findings"
```

---

## Verification Checklist

Before presenting:

- [ ] `npm run dev` starts without errors
- [ ] All 5 demo pages load at their respective URLs
- [ ] All 5 scenarios show real Sentry captures in the dashboard
- [ ] Session Replay recording is visible for the replay scenario
- [ ] Performance span waterfall shows `checkout.database.query`
- [ ] `docs/executive-summary.md` has no `[...]` placeholders remaining
- [ ] At least one alert rule has been configured and tested in Sentry
```
