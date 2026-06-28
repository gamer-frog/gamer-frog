import { NextResponse } from "next/server";
import { listCronJobs } from "@/lib/data";

export async function GET() {
  const jobs = await listCronJobs();
  return NextResponse.json({ jobs });
}
