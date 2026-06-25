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
