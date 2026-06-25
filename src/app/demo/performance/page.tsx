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
