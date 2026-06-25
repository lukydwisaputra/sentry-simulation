import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { fetchInventory } from "@/lib/inventory";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const warehouseId = req.nextUrl.searchParams.get("warehouseId") ?? "";
  // BUG: warehouseId defaults to "" — fetchInventory throws when warehouseId is empty
  // FIX TARGET: change default from "" to "WH-001" so missing param still resolves safely
  const inventory = await fetchInventory(warehouseId);
  return NextResponse.json({ status: "ok", inventory });
}
