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
