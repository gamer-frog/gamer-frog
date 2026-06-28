import { NextResponse } from "next/server";
import { listDepartments } from "@/lib/data";

export async function GET() {
  const departments = await listDepartments();
  return NextResponse.json({ departments });
}
