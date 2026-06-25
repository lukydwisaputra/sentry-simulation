"use client";

import { useState } from "react";
import Link from "next/link";
import { calculateCartTotal, CartItem } from "@/lib/cart";

const MOCK_ITEMS: CartItem[] = [
  { id: "1", name: "Pro Plan", price: 99, quantity: 1 },
  { id: "2", name: "Add-on Seat", price: 25, quantity: 3 },
];

export default function SeerCartPage() {
  const [status, setStatus] = useState<"idle" | "success" | "crashed">("idle");
  const [total, setTotal] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function triggerWithItems() {
    try {
      const result = calculateCartTotal(MOCK_ITEMS);
      setTotal(result);
      setStatus("success");
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message);
      setStatus("crashed");
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { scenario: "seer-cart", trigger: "with-items" },
          extra: { items: MOCK_ITEMS },
        })
      );
    }
  }

  function triggerEmpty() {
    try {
      // Simulates empty cart — passes undefined to trigger the bug
      const result = calculateCartTotal(undefined);
      setTotal(result);
      setStatus("success");
    } catch (err) {
      const e = err as Error;
      setErrorMsg(e.message);
      setStatus("crashed");
      import("@sentry/nextjs").then(({ captureException }) =>
        captureException(err, {
          tags: { scenario: "seer-cart", trigger: "empty-cart" },
          extra: { items: null, reason: "user had empty cart at checkout" },
        })
      );
    }
  }

  function reset() {
    setStatus("idle");
    setTotal(null);
    setErrorMsg(null);
  }

  return (
    <div>
      <Link href="/" className="text-violet-400 text-sm mb-6 inline-block hover:underline">
        ← Back to demos
      </Link>

      <h2 className="text-2xl font-bold mb-2">Seer Autofix — Cart Null Reference</h2>

      <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
        <h3 className="font-semibold text-violet-300 mb-1">What this shows</h3>
        <p className="text-gray-400 text-sm">
          <code className="bg-gray-900 px-1 rounded">calculateCartTotal()</code> in{" "}
          <code className="bg-gray-900 px-1 rounded">src/lib/cart.ts</code> calls{" "}
          <code className="bg-gray-900 px-1 rounded">.reduce()</code> without checking if{" "}
          <code className="bg-gray-900 px-1 rounded">items</code> is undefined. An empty cart crashes
          the function. Sentry captures the TypeError with full stack trace — then Seer reads the source
          and opens a GitHub PR with a one-line fix.
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-4">
        <h3 className="font-semibold mb-1">Scenario: Empty Cart at Checkout</h3>
        <p className="text-gray-500 text-sm mb-5">
          File: <code className="bg-gray-800 px-1 rounded">src/lib/cart.ts</code> ·{" "}
          Bug: <code className="bg-gray-800 px-1 rounded">items.reduce()</code> — no null guard
        </p>

        {status === "idle" && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={triggerWithItems}
              className="bg-violet-700 hover:bg-violet-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Calculate with items (works)
            </button>
            <button
              onClick={triggerEmpty}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Calculate empty cart (crashes)
            </button>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="bg-green-950 border border-green-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-300 font-mono text-sm">Cart total: ${total}</p>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}

        {status === "crashed" && (
          <div>
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 font-mono text-sm">TypeError: {errorMsg}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 mb-4 text-sm text-gray-300 space-y-2">
              <p className="font-semibold text-white">Next: Use Seer to fix this</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Open <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">Sentry Issues</a> — find the TypeError</li>
                <li>Click <strong className="text-white">Autofix</strong> in the issue detail</li>
                <li>Seer reads <code className="bg-gray-900 px-1 rounded">src/lib/cart.ts</code> and proposes fix</li>
                <li>Click <strong className="text-white">Create PR</strong> — GitHub PR opens in this repo</li>
              </ol>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-300 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
