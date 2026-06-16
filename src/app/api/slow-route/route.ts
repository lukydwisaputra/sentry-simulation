import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  return await Sentry.startSpan(
    { name: "checkout.database.query", op: "db.query" },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return NextResponse.json({ message: "Checkout complete", duration_ms: 3000 });
    }
  );
}
