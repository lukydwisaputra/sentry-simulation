"use client";

import { useState } from "react";
import Link from "next/link";
import { getRecommendedProduct, Product } from "@/lib/recommendations";

export default function SeerRecommendationsPage() {
  const [status, setStatus] = useState<"idle" | "success" | "crashed">("idle");
  const [product, setProduct] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testedUserId, setTestedUserId] = useState<number | null>(null);

  function triggerSafe() {
    const userId = 45; // index = 4, within bounds
    try {
      const result = getRecommendedProduct(userId);
      setProduct(result);
      setTestedUserId(userId);
      setStatus("success");
    } catch (err) {
      handleCrash(err, userId);
    }
  }

  function triggerCrash() {
    const userId = 100; // index = 10, out of bounds
    try {
      const result = getRecommendedProduct(userId);
      setProduct(result);
      setTestedUserId(userId);
      setStatus("success");
    } catch (err) {
      handleCrash(err, userId);
    }
  }

  function handleCrash(err: unknown, userId: number) {
    const e = err as Error;
    setErrorMsg(e.message);
    setTestedUserId(userId);
    setStatus("crashed");
    import("@sentry/nextjs").then(({ captureException }) =>
      captureException(err, {
        tags: { scenario: "seer-recommendations" },
        extra: {
          userId,
          computedIndex: Math.floor(userId / 10),
          productsLength: 10,
        },
      })
    );
  }

  function reset() {
    setStatus("idle");
    setProduct(null);
    setErrorMsg(null);
    setTestedUserId(null);
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Seer Autofix — Off-by-One Array Access</h2>

      <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h3 className="font-semibold text-violet-300 mb-1">What this shows</h3>
        <p className="text-gray-400 text-sm">
          <code className="bg-gray-900 px-1 rounded">getRecommendedProduct()</code> in{" "}
          <code className="bg-gray-900 px-1 rounded">src/lib/recommendations.ts</code> computes an
          array index as <code className="bg-gray-900 px-1 rounded">Math.floor(userId / 10)</code>.
          For <code className="bg-gray-900 px-1 rounded">userId = 100</code> this gives index 10 on a
          10-item array — out of bounds. Sentry captures the TypeError with{" "}
          <code className="bg-gray-900 px-1 rounded">userId</code> and computed index as extra context,
          giving Seer everything it needs to propose the correct bounds clamp.
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-4">
        <h3 className="font-semibold mb-1">Scenario: High-Value User Recommendation</h3>
        <p className="text-gray-500 text-sm mb-5">
          File: <code className="bg-gray-800 px-1 rounded">src/lib/recommendations.ts</code> ·{" "}
          Bug: <code className="bg-gray-800 px-1 rounded">PRODUCTS[Math.floor(userId / 10)]</code> — no bounds clamp
        </p>

        {status === "idle" && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={triggerSafe}
              className="bg-violet-700 hover:bg-violet-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              userId = 45 (safe)
            </button>
            <button
              onClick={triggerCrash}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              userId = 100 (crashes)
            </button>
          </div>
        )}

        {status === "success" && product && (
          <div>
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-2">
              <p className="text-green-300 font-mono text-sm">
                userId {testedUserId} → recommended: {product.name} (${product.price})
              </p>
            </div>
            <p className="text-gray-500 text-xs mb-4">index = {Math.floor((testedUserId ?? 0) / 10)} — within bounds</p>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}

        {status === "crashed" && (
          <div>
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-2">
              <p className="text-red-400 font-mono text-sm">TypeError: {errorMsg}</p>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              userId {testedUserId} → index {Math.floor((testedUserId ?? 0) / 10)} — out of bounds (max 9)
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-4 text-sm text-gray-300 space-y-2">
              <p className="font-semibold text-white">Next: Use Seer to fix this</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Open <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">Sentry Issues</a> — find the TypeError with userId/index in extra context</li>
                <li>Click <strong className="text-white">Autofix</strong> — Seer sees the extra context immediately</li>
                <li>Seer reads <code className="bg-gray-900 px-1 rounded">src/lib/recommendations.ts</code></li>
                <li>Proposed fix: <code className="bg-gray-900 px-1 rounded">Math.min(Math.floor(userId / 10), PRODUCTS.length - 1)</code></li>
                <li>Click <strong className="text-white">Create PR</strong></li>
              </ol>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
