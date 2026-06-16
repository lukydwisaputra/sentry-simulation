# Sentry.io Demo — Design Spec
**Date:** 2026-06-16
**Author:** luky.saputra@werkdone.com
**Goal:** Build a Next.js demo app connected to Sentry.io and produce an executive summary to support a "should we integrate Sentry?" decision for a mixed technical/business audience.

---

## Context

The team has no existing monitoring or error tracking (greenfield). This project proves the value of Sentry through a self-contained, runnable demo before committing to integration. The output is a live app that can be clicked through in a presentation, plus a written executive summary stakeholders can read independently.

---

## Architecture

**Stack:**
- Next.js 14 (App Router)
- `@sentry/nextjs` official SDK
- Tailwind CSS
- No database — all errors simulated in-app

**Project layout:**
```
sentry-simulation/
├── src/
│   ├── app/
│   │   ├── page.tsx                     ← Landing/navigation hub
│   │   ├── demo/
│   │   │   ├── error/page.tsx           ← Client-side error demo
│   │   │   ├── performance/page.tsx     ← Slow API demo
│   │   │   ├── replay/page.tsx          ← Session replay demo
│   │   │   ├── alerts/page.tsx          ← Server error / alert demo
│   │   │   └── release/page.tsx         ← Release tracking demo
│   │   └── api/
│   │       ├── slow-route/route.ts      ← Sleeps 3s, traces perf span
│   │       └── broken-route/route.ts   ← Throws 500 server error
│   ├── sentry.client.config.ts          ← Client SDK init (DSN, replay, tracing)
│   ├── sentry.server.config.ts          ← Server SDK init
│   └── instrumentation.ts               ← Next.js instrumentation hook
├── docs/
│   ├── executive-summary.md             ← Final stakeholder deliverable
│   └── superpowers/specs/               ← This file
├── .env.local                           ← SENTRY_DSN, SENTRY_AUTH_TOKEN
├── next.config.ts                       ← withSentryConfig wrapper
└── package.json
```

**Environment variables required:**
- `NEXT_PUBLIC_SENTRY_DSN` — from Sentry project settings
- `SENTRY_AUTH_TOKEN` — for source map upload (release tracking)
- `NEXT_PUBLIC_APP_VERSION` — set to git SHA or semver string

---

## Demo Scenarios

Five pages, each demonstrating one Sentry feature. Each page includes a "What this shows" callout for self-narrated demos.

### 1. Error Tracking — `/demo/error`
- UI: Single button "Trigger Payment Error"
- Action: Click fires `throw new Error("Payment service failed: timeout after 5000ms")`
- Sentry captures: stack trace, breadcrumbs (prior user actions), browser/OS context
- What to show in Sentry: Issues list → click issue → see full stack trace, reproduction steps

### 2. Performance Monitoring — `/demo/performance`
- UI: Button "Simulate Slow Checkout API"
- Action: Calls `/api/slow-route` which uses `setTimeout` to delay 3s, wrapped in a Sentry span
- Sentry captures: transaction with slow span, P50/P95 latency metrics
- What to show in Sentry: Performance tab → transaction → span waterfall

### 3. Session Replay — `/demo/replay`
- UI: 3-step form (Name → Email → Submit)
- Action: On submit, injects a simulated crash ("Form submission failed")
- Sentry captures: session replay video of all interactions before the error
- What to show in Sentry: Issues → click issue → Session Replay tab → watch the recording

### 4. Alerts — `/demo/alerts`
- UI: Button "Trigger Server 500"
- Action: Calls `/api/broken-route` which throws an unhandled exception server-side
- Sentry creates: new issue, fires configured alert rule (email or Slack)
- What to show in Sentry: Issues list populating in real-time; alert rule configuration

### 5. Release Tracking — `/demo/release`
- UI: Displays current `NEXT_PUBLIC_APP_VERSION`; button triggers a version-tagged error
- Action: Throws an error with release context set; Sentry tags it to the release
- Sentry captures: error attributed to specific release/commit
- What to show in Sentry: Issues → "First seen in release vX.Y.Z"; Releases tab → regression detection
- Requires: `SENTRY_AUTH_TOKEN` for source map upload in `next.config.ts`

---

## Sentry SDK Configuration Details

**`sentry.client.config.ts`**
```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,          // capture all transactions for demo
  replaysSessionSampleRate: 1.0,  // capture all sessions for demo
  replaysOnErrorSampleRate: 1.0,  // always capture replay on error
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  integrations: [Sentry.replayIntegration()],
})
```

**`next.config.ts`**
- Wrap with `withSentryConfig` to enable source map upload and tree-shaking

---

## Executive Summary Structure

File: `docs/executive-summary.md`

```
1. Executive Summary         — 3-4 sentence TL;DR
2. What is Sentry?           — 1 paragraph, non-technical
3. What We Tested            — 5 scenarios in plain English
4. Key Findings
   ├── Error Tracking
   ├── Performance Monitoring
   ├── Session Replay
   ├── Alerting
   └── Release Tracking
5. Integration Effort        — greenfield = low; ~1 dev-day; official Next.js support
6. Risks & Considerations   — data privacy (replay PII), cost at scale, alert fatigue
7. Recommendation            — clear yes/no with conditions
8. Next Steps               — first sprint actions if approved
```

The summary is generated after running the demo, drawing from what Sentry actually captured. It is written to stand alone without screenshots (but screenshots from the Sentry dashboard can be embedded in a slide deck).

---

## Verification Plan

1. **Run the app locally:** `npm run dev` — navigate all 5 demo pages
2. **Verify error capture:** Trigger each scenario, confirm issues appear in the Sentry dashboard within ~5 seconds
3. **Verify replay:** Open an issue from the replay scenario, confirm the Session Replay tab shows the recording
4. **Verify performance:** Check the Performance tab for the slow-route transaction and its span breakdown
5. **Verify release:** Confirm the error on `/demo/release` is tagged with the correct `NEXT_PUBLIC_APP_VERSION`
6. **Alert rule:** Configure at least one Sentry alert rule (e.g., "new issue → email") and confirm it fires from the alerts demo
7. **Executive summary:** Review `docs/executive-summary.md` for completeness and accuracy against demo findings

---

## Out of Scope

- Real database or authentication
- Deployment to production (demo runs locally only)
- Cost modelling or ROI calculation (stakeholders can request this as a follow-up)
