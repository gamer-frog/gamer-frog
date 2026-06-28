import { NextResponse } from "next/server";
import { getYesterdayMemo } from "@/lib/data";

export async function GET() {
  const memo = await getYesterdayMemo();
  return NextResponse.json({ memo });
}
