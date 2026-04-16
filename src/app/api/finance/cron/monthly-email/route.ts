import { NextResponse } from "next/server";

import { sendMonthlyFinanceDigest } from "@/lib/finance/email";
import { getCurrentPeriodKey, getPeriodDateRange } from "@/lib/finance/period";

function getPreviousPeriodKey(reference = new Date()) {
  const current = getCurrentPeriodKey(reference);
  const { year, monthIndex } = getPeriodDateRange(current);
  const previousDate = new Date(Date.UTC(year, monthIndex - 1, 1, 0, 0, 0));
  return `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const result = await sendMonthlyFinanceDigest(getPreviousPeriodKey());
  return NextResponse.json({ ok: true, result });
}
