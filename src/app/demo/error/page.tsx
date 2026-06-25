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
          extra: { payload: DEMO_PAYLOAD, reason: "unexpected error processing valid payload" },
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
