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
