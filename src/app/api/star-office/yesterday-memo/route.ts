import { NextResponse } from "next/server";
import { getYesterdayMemo } from "@/lib/data";

/**
 * GET /api/star-office/yesterday-memo
 * Shape compatible con el frontend original de Star-Office-UI:
 *   éxito: { success: true, date: "YYYY-MM-DD", memo: "string multilínea" }
 *   fallo: { success: false, msg: "..." }
 *
 * El frontend solo revisa `if (data.success && data.memo)`.
 * `date` va a #memo-date; `memo` se inyecta como innerHTML con \n→<br>.
 */
export async function GET() {
  const memo = await getYesterdayMemo();

  if (!memo) {
    return NextResponse.json({
      success: false,
      msg: "No hay memo del día anterior todavía.",
    });
  }

  return NextResponse.json({
    success: true,
    date: memo.memo_date,
    memo: memo.markdown,
  });
}
