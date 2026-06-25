import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { runQuery } from "@/lib/db";

export async function GET() {
  return await Sentry.startSpan(
    { name: "checkout.database.query", op: "db.query" },
    async () => {
      const sql = "SELECT * FROM orders WHERE status = 'pending'";
      const result = await runQuery(sql);
      // Accessing result.rows — safe for non-empty sql, crashes when result is undefined
      return NextResponse.json({
        message: "Checkout complete",
        duration_ms: result.rows.length > 0 ? result.duration_ms : 0,
      });
    }
  );
}
