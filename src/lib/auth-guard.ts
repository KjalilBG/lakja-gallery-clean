import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";

export async function requireAdminSession(callbackUrl = "/admin") {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

export async function ensureAdminApiRequest() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  return null;
}
