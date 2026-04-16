import { FinanceOwner } from "@prisma/client";
import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { getFinanceReport } from "@/lib/finance/reports";

export async function GET(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ownerParam = searchParams.get("owner");
  const periodKey = searchParams.get("period") ?? undefined;
  const historical = searchParams.get("historical") === "true";
  const owner = ownerParam && ["LAKJA", "KJALIL", "KK"].includes(ownerParam) ? (ownerParam as FinanceOwner) : undefined;

  const report = await getFinanceReport({
    owner,
    periodKey,
    historical
  });

  return NextResponse.json({ ok: true, report });
}
