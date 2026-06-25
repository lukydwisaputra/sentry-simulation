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
