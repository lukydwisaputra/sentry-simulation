"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "success" | "failed";

export default function SeerCheckoutPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function triggerValidCheckout() {
    setStatus("loading");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 149, userId: "user_demo_001" }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderId(data.orderId);
        setStatus("success");
      } else {
        setErrorDetail(data.error ?? "Unknown server error");
        setStatus("failed");
      }
    } catch {
      setErrorDetail("Network error — could not reach server");
      setStatus("failed");
    }
  }

  async function triggerZeroAmount() {
    setStatus("loading");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 0, userId: "user_demo_002" }),
    });
    const data = await res.json().catch(() => ({}));
    setErrorDetail(data.error ?? `HTTP ${res.status} — unhandled server exception`);
    setStatus("failed");
  }

  function reset() {
    setStatus("idle");
    setOrderId(null);
    setErrorDetail(null);
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Seer Autofix — Unhandled Promise Rejection</h2>

      <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h3 className="font-semibold text-violet-300 mb-1">What this shows</h3>
        <p className="text-gray-400 text-sm">
          <code className="bg-gray-900 px-1 rounded">POST /api/checkout</code> calls{" "}
          <code className="bg-gray-900 px-1 rounded">await processPayment()</code> with no try/catch.
          When <code className="bg-gray-900 px-1 rounded">amount</code> is 0, the async function throws
          and the entire route crashes with 500. Sentry captures the server-side exception with async
          stack trace — Seer reads the route, adds error handling, and opens a GitHub PR.
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-4">
        <h3 className="font-semibold mb-1">Scenario: Zero-Amount Checkout</h3>
        <p className="text-gray-500 text-sm mb-5">
          File: <code className="bg-gray-800 px-1 rounded">src/app/api/checkout/route.ts</code> ·{" "}
          Bug: missing try/catch around <code className="bg-gray-800 px-1 rounded">await processPayment()</code>
        </p>

        {status === "idle" && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={triggerValidCheckout}
              className="bg-violet-700 hover:bg-violet-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Checkout $149 (works)
            </button>
            <button
              onClick={triggerZeroAmount}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Checkout $0 (crashes server)
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="text-violet-400 flex items-center gap-2">
            <span className="animate-spin">⏳</span> Calling /api/checkout...
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-300 font-mono text-sm">Order created: {orderId}</p>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}

        {status === "failed" && (
          <div>
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 font-mono text-sm">Server 500 — {errorDetail}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 mb-4 text-sm text-gray-300 space-y-2">
              <p className="font-semibold text-white">Next: Use Seer to fix this</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Open <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">Sentry Issues</a> — find the server-side Error</li>
                <li>Click <strong className="text-white">Autofix</strong> in the issue detail</li>
                <li>Seer reads <code className="bg-gray-900 px-1 rounded">src/app/api/checkout/route.ts</code></li>
                <li>Click <strong className="text-white">Create PR</strong> — fix wraps the await in try/catch</li>
              </ol>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
