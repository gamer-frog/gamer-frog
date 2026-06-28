import { NextResponse } from "next/server";
import { getStarOfficeStatus } from "@/lib/data";

export async function GET() {
  const status = await getStarOfficeStatus();
  return NextResponse.json(status);
}
