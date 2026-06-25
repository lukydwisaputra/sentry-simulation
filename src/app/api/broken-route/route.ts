import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { fetchInventory } from "@/lib/inventory";

export async function GET(): Promise<NextResponse> {
  // BUG: fetchInventory throws when warehouseId is empty — no try/catch wraps this await
  const inventory = await fetchInventory("");
  return NextResponse.json({ status: "ok", inventory });
}
