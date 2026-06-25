"use client";

import { useState } from "react";
import Link from "next/link";
import { validateEmail } from "@/lib/validator";

type Step = 1 | 2 | 3 | "confirmed" | "error";

export default function ReplayDemoPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function submitForm() {
    try {
      // BUG: always passes undefined to trigger validator.ts bug — real email ignored
      // With bug present: validateEmail(undefined) throws → setStep("error")
      // After bug fixed (if (!email) return false): returns false → no error → not.toBeVisible PASSES
      const valid = validateEmail(undefined as unknown as string);
      if (valid) {
        setStep("confirmed");
      }
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message);
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { scenario: "session-replay" },
          extra: { name, email: null, reason: "email state undefined at submit" },
        })
      ).catch(() => {});
      setStep("error");
    }
  }

  function reset() {
    setStep(1);
    setName("");
    setEmail("");
    setErrorMsg(null);
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
        <p className="text-gray-500 text-xs mb-6">Fill in the form and submit. Sentry records every step.</p>

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
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-300 underline">← Back</button>
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
              <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-300 underline">← Back</button>
              <button
                onClick={submitForm}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Submit Order
              </button>
            </div>
          </div>
        )}

        {step === "confirmed" && (
          <div>
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-300 font-mono text-sm">Order confirmed: #ORD-demo</p>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}

        {step === "error" && (
          <div>
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 font-mono text-sm">TypeError: {errorMsg}</p>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Open your{" "}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">
                Sentry Issues
              </a>{" "}
              dashboard → find this error → click the <strong>Replay</strong> tab to watch the recording.
            </p>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
