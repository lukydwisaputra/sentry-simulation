# Seer Autofix Bug Scenarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 realistic planted-bug modules with demo pages so Sentry captures rich issues and Seer can read the source, propose a fix, and open a GitHub PR.

**Architecture:** Each bug lives in a focused lib or API module (not the page). The demo page imports the module, lets the user trigger the bug, and shows Sentry-specific follow-up instructions. Homepage gets 3 new cards. No new dependencies.

**Tech Stack:** Next.js 14 App Router, TypeScript, `@sentry/nextjs` ^10, Tailwind CSS

## Global Constraints

- No new npm packages
- All Sentry capture calls use dynamic import pattern already established: `import("@sentry/nextjs").then(({ captureException }) => captureException(err))`
- Server-side errors use `Sentry.captureException` from `@sentry/nextjs` at the top of the route file
- Follow existing page structure: `"use client"` pages, `Link` back to `/`, gray-950 bg, violet accent
- Bugs must be **real TypeScript bugs** (not just thrown strings) so Seer reads actual broken logic
- Each module must include a `// BUG:` comment on the broken line — this anchors Seer's analysis
- `NEXT_PUBLIC_APP_VERSION` already set in `.env.local` — use it via `process.env.NEXT_PUBLIC_APP_VERSION` in server code
- All new demo pages added to homepage `demos` array in `src/app/page.tsx`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/cart.ts` | Create | Cart total calculator with null-ref bug |
| `src/app/demo/seer-cart/page.tsx` | Create | Demo page: trigger cart crash |
| `src/app/api/checkout/route.ts` | Create | Checkout API with unhandled promise bug |
| `src/app/demo/seer-checkout/page.tsx` | Create | Demo page: trigger checkout 500 |
| `src/lib/recommendations.ts` | Create | Product recommender with off-by-one bug |
| `src/app/demo/seer-recommendations/page.tsx` | Create | Demo page: trigger recommendations crash |
| `src/app/page.tsx` | Modify | Add 3 new demo cards |

---

## Task 1: Cart Null-Reference Bug

**Files:**
- Create: `src/lib/cart.ts`
- Create: `src/app/demo/seer-cart/page.tsx`

**Interfaces:**
- Produces: `calculateCartTotal(items: CartItem[] | undefined): number` — exported from `src/lib/cart.ts`

### What the bug is

`calculateCartTotal` calls `.reduce()` directly on `items` without checking if `items` is `undefined`. When called with `undefined` (empty cart), JavaScript throws:
`TypeError: Cannot read properties of undefined (reading 'reduce')`

Seer reads `cart.ts`, sees the `// BUG:` comment, and fixes it to `(items ?? []).reduce(...)`.

---

- [ ] **Step 1: Create `src/lib/cart.ts` with the planted bug**

```typescript
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export function calculateCartTotal(items: CartItem[] | undefined): number {
  // BUG: items can be undefined when cart is empty — .reduce() will throw TypeError
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

- [ ] **Step 2: Create `src/app/demo/seer-cart/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/lukydwisaputra/Desktop/QA/sentry-simulation && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/cart.ts src/app/demo/seer-cart/page.tsx
git commit -m "feat: add cart null-reference bug for Seer autofix demo"
```

---

## Task 2: Checkout Unhandled Promise Bug

**Files:**
- Create: `src/app/api/checkout/route.ts`
- Create: `src/app/demo/seer-checkout/page.tsx`

**Interfaces:**
- Consumes: `POST /api/checkout` with body `{ amount: number, userId: string }`
- Produces: `{ success: true, orderId: string }` on valid input; 500 on `amount === 0`

### What the bug is

`processPayment` throws `Error("Cannot process zero-amount transaction")` when `amount` is 0. The route calls it with `await processPayment(data)` but has no try/catch. Next.js catches the unhandled rejection and returns 500. Sentry captures a server-side error with the full async stack trace.

Seer reads `route.ts`, sees the `// BUG:` comment, wraps in try/catch, and adds the zero-amount guard.

---

- [ ] **Step 1: Create `src/app/api/checkout/route.ts` with the planted bug**

```typescript
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

type CheckoutPayload = {
  amount: number;
  userId: string;
};

async function processPayment(payload: CheckoutPayload): Promise<{ orderId: string }> {
  if (payload.amount === 0) {
    throw new Error("Cannot process zero-amount transaction");
  }
  // Simulate async payment gateway call
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { orderId: `order_${Date.now()}` };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const data: CheckoutPayload = await req.json();

  // BUG: processPayment throws when amount is 0 — no try/catch wraps this await
  const result = await processPayment(data);

  return NextResponse.json({ success: true, orderId: result.orderId });
}
```

- [ ] **Step 2: Create `src/app/demo/seer-checkout/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/checkout/route.ts src/app/demo/seer-checkout/page.tsx
git commit -m "feat: add checkout unhandled-promise bug for Seer autofix demo"
```

---

## Task 3: Recommendations Off-by-One Bug

**Files:**
- Create: `src/lib/recommendations.ts`
- Create: `src/app/demo/seer-recommendations/page.tsx`

**Interfaces:**
- Produces: `getRecommendedProduct(userId: number): Product` — exported from `src/lib/recommendations.ts`
- Produces: `type Product = { id: string; name: string; price: number }` — exported from same file

### What the bug is

`getRecommendedProduct` derives an index with `Math.floor(userId / 10)`. For `userId = 0` this gives `0` (safe). But for `userId = 100` it gives `10`, which is out of bounds on a 10-item array (indices 0–9). `products[10]` returns `undefined`, and accessing `.name` on it throws `TypeError: Cannot read properties of undefined (reading 'name')`.

Seer reads `recommendations.ts`, sees the `// BUG:` comment, and fixes to `Math.min(Math.floor(userId / 10), products.length - 1)`.

---

- [ ] **Step 1: Create `src/lib/recommendations.ts` with the planted bug**

```typescript
export type Product = {
  id: string;
  name: string;
  price: number;
};

const PRODUCTS: Product[] = [
  { id: "p0", name: "Starter Plan", price: 29 },
  { id: "p1", name: "Growth Plan", price: 79 },
  { id: "p2", name: "Pro Plan", price: 149 },
  { id: "p3", name: "Business Plan", price: 299 },
  { id: "p4", name: "Enterprise Plan", price: 599 },
  { id: "p5", name: "Add-on: Analytics", price: 49 },
  { id: "p6", name: "Add-on: SSO", price: 99 },
  { id: "p7", name: "Add-on: Audit Log", price: 79 },
  { id: "p8", name: "Add-on: Custom Domain", price: 19 },
  { id: "p9", name: "Add-on: Priority Support", price: 199 },
];

export function getRecommendedProduct(userId: number): Product {
  // BUG: index overflows when userId >= 100 — Math.floor(100 / 10) = 10, out of bounds (max index is 9)
  const index = Math.floor(userId / 10);
  const product = PRODUCTS[index];
  return { id: product.id, name: product.name, price: product.price };
}
```

- [ ] **Step 2: Create `src/app/demo/seer-recommendations/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/recommendations.ts src/app/demo/seer-recommendations/page.tsx
git commit -m "feat: add recommendations off-by-one bug for Seer autofix demo"
```

---

## Task 4: Wire Homepage Cards

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: routes `/demo/seer-cart`, `/demo/seer-checkout`, `/demo/seer-recommendations` (created in Tasks 1–3)

- [ ] **Step 1: Add 3 new demo cards to the `demos` array in `src/app/page.tsx`**

Open `src/app/page.tsx`. After the existing 5 entries in the `demos` array, add:

```typescript
  {
    href: "/demo/seer-cart",
    title: "6. Seer Autofix — Cart Null Reference",
    description: "Trigger a TypeError from an empty cart, then use Seer to auto-fix src/lib/cart.ts and open a GitHub PR.",
    feature: "Autofix",
    color: "border-purple-500",
    badge: "bg-purple-500",
  },
  {
    href: "/demo/seer-checkout",
    title: "7. Seer Autofix — Unhandled Promise",
    description: "Submit a $0 checkout to crash the server route, then let Seer add try/catch and create a PR.",
    feature: "Autofix",
    color: "border-purple-500",
    badge: "bg-purple-500",
  },
  {
    href: "/demo/seer-recommendations",
    title: "8. Seer Autofix — Off-by-One Array",
    description: "Pass userId=100 to overflow the product array, then watch Seer clamp the index and open a PR.",
    feature: "Autofix",
    color: "border-purple-500",
    badge: "bg-purple-500",
  },
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Start dev server and verify all 3 cards appear on homepage**

```bash
npm run dev
```
Open `http://localhost:3000` — confirm 8 cards total, 3 purple "Autofix" badges at bottom.
Visit each new demo page — confirm both buttons render and the "safe" path works without crashing.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add 3 Seer autofix demo cards to homepage"
```

---

## Seer Setup Checklist (do once in Sentry dashboard before demo)

These are not code tasks — required Sentry configuration for Seer + GitHub PR to work:

1. **GitHub integration:** Sentry → Settings → Integrations → GitHub → connect this repo (`sentry-simulation`)
2. **Seer enabled:** Sentry → Settings → Seer → enable Autofix
3. **Source code mapping:** confirm `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in `.env.local` match your project (already set)
4. **Run app locally or deploy** so errors reach Sentry with real stack frames (source maps uploaded on `next build`)

---

## Demo Walkthrough Order (for presentations)

1. Homepage → card 6 → click "Calculate empty cart" → Sentry issue appears → Autofix → PR (simplest fix)
2. Homepage → card 7 → click "Checkout $0" → server 500 in Sentry → Autofix → PR (async pattern)
3. Homepage → card 8 → click "userId = 100" → TypeError with extra context → Autofix → PR (logic bug with context)
