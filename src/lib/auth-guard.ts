import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getServerAuthSession, isAdminEmail, isSuperAdminEmail } from "@/lib/auth";

export async function requireAdminSession(callbackUrl = "/appfotos/admin") {
  const session = await getServerAuthSession();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}

export async function ensureAdminApiRequest() {
  const session = await getServerAuthSession();

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  return null;
}

export async function ensureSuperAdminApiRequest() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  if (!isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ ok: false, error: "Sin permisos de super admin." }, { status: 403 });
  }

  return null;
}

export async function requireSuperAdminSession(callbackUrl = "/appfotos/admin") {
  const session = await requireAdminSession(callbackUrl);

  if (!isSuperAdminEmail(session.user?.email)) {
    redirect("/appfotos/admin");
  }

  return session;
}
