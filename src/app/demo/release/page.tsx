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
