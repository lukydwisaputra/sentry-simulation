import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  throw new Error("Internal server error: inventory service unreachable");
}
