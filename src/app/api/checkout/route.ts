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
