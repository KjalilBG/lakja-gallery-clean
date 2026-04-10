"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSuperAdminSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  buildLegacyShortLinkUrl,
  buildShortLinkUrl,
  createShortLink,
  deleteShortLink,
  normalizeShortLinkDestination,
  normalizeShortLinkSlug,
  resolveShortLinkDestination,
  toggleShortLinkActive,
  updateShortLink,
  validateShortLinkDestination,
  validateShortLinkSlug
} from "@/lib/short-links";

const LINK_SORT_OPTIONS = new Set(["recent", "clicks", "slug"]);

function normalizeListStateValue(value: FormDataEntryValue | null) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue || undefined;
}

function getListStateFromFormData(formData: FormData) {
  const q = normalizeListStateValue(formData.get("q"));
  const sortCandidate = normalizeListStateValue(formData.get("sort"));
  const sort = sortCandidate && LINK_SORT_OPTIONS.has(sortCandidate) ? sortCandidate : undefined;

  return { q, sort };
}

function buildRedirectUrl(params: { saved?: string; error?: string; q?: string; sort?: string }) {
  const searchParams = new URLSearchParams();

  if (params.saved) {
    searchParams.set("saved", params.saved);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const query = searchParams.toString();
  return query ? `/links?${query}` : "/links";
}

function normalizeCheckboxValue(formData: FormData, name: string, fallback = false) {
  if (!formData.has(name)) {
    return fallback;
  }

  return formData
    .getAll(name)
    .map((value) => String(value).toLowerCase())
    .some((value) => value === "on" || value === "true");
}

function validateShortLinkInput(formData: FormData) {
  const slug = normalizeShortLinkSlug(String(formData.get("slug") ?? ""));
  const destinationUrl = normalizeShortLinkDestination(String(formData.get("destinationUrl") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const isActive = normalizeCheckboxValue(formData, "isActive", true);

  const slugError = validateShortLinkSlug(slug);
  if (slugError) {
    return { ok: false as const, error: slugError };
  }

  const destinationError = validateShortLinkDestination(destinationUrl);
  if (destinationError) {
    return { ok: false as const, error: destinationError };
  }

  const shortLinkUrl = new URL(buildShortLinkUrl(slug));
  const legacyShortLinkUrl = new URL(buildLegacyShortLinkUrl(slug));
  const targetUrl = new URL(resolveShortLinkDestination(destinationUrl));

  const pointsToCurrentShortLink =
    targetUrl.origin === shortLinkUrl.origin &&
    (targetUrl.pathname === shortLinkUrl.pathname || targetUrl.pathname === legacyShortLinkUrl.pathname);

  if (pointsToCurrentShortLink) {
    return {
      ok: false as const,
      error: "Ese destino generaria un bucle porque apunta al mismo enlace corto."
    };
  }

  return {
    ok: true as const,
    data: {
      slug,
      destinationUrl,
      title: title || null,
      note: note || null,
      isActive
    }
  };
}

export async function createShortLinkAction(formData: FormData) {
  const session = await requireSuperAdminSession("/links");
  const listState = getListStateFromFormData(formData);
  const parsed = validateShortLinkInput(formData);

  if (!parsed.ok) {
    redirect(buildRedirectUrl({ error: parsed.error, ...listState }));
  }

  const createdByEmail = session.user?.email?.trim().toLowerCase() ?? null;
  const existingAdminUser = createdByEmail
    ? await prisma.user.findUnique({
        where: { email: createdByEmail },
        select: { id: true }
      })
    : null;

  try {
    await createShortLink({
      ...parsed.data,
      createdById: existingAdminUser?.id ?? null
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(buildRedirectUrl({ error: "Ese slug ya existe. Prueba con otro.", ...listState }));
    }

    console.error("[short-links] mutation failed", error);
    redirect(buildRedirectUrl({ error: "No se pudo guardar el enlace corto.", ...listState }));
  }

  revalidatePath("/links");
  redirect(buildRedirectUrl({ saved: "created", ...listState }));
}

export async function updateShortLinkAction(formData: FormData) {
  await requireSuperAdminSession("/links");
  const listState = getListStateFromFormData(formData);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect(buildRedirectUrl({ error: "No encontramos el enlace que querias editar.", ...listState }));
  }

  const parsed = validateShortLinkInput(formData);
  if (!parsed.ok) {
    redirect(buildRedirectUrl({ error: parsed.error, ...listState }));
  }

  try {
    await updateShortLink(id, parsed.data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(buildRedirectUrl({ error: "Ese slug ya existe. Prueba con otro.", ...listState }));
    }

    console.error("[short-links] mutation failed", error);
    redirect(buildRedirectUrl({ error: "No se pudo guardar el enlace corto.", ...listState }));
  }

  revalidatePath("/links");
  redirect(buildRedirectUrl({ saved: "updated", ...listState }));
}

export async function toggleShortLinkAction(formData: FormData) {
  await requireSuperAdminSession("/links");
  const listState = getListStateFromFormData(formData);

  const id = String(formData.get("id") ?? "").trim();
  const nextValue = String(formData.get("nextValue") ?? "").trim() === "true";

  if (!id) {
    redirect(buildRedirectUrl({ error: "No encontramos el enlace que querias cambiar.", ...listState }));
  }

  try {
    await toggleShortLinkActive(id, nextValue);
  } catch (error) {
    console.error("[short-links] toggle failed", error);
    redirect(buildRedirectUrl({ error: "No se pudo actualizar el estado del enlace.", ...listState }));
  }

  revalidatePath("/links");
  redirect(buildRedirectUrl({ saved: nextValue ? "enabled" : "disabled", ...listState }));
}

export async function deleteShortLinkAction(formData: FormData) {
  await requireSuperAdminSession("/links");
  const listState = getListStateFromFormData(formData);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect(buildRedirectUrl({ error: "No encontramos el enlace que querias borrar.", ...listState }));
  }

  try {
    await deleteShortLink(id);
  } catch (error) {
    console.error("[short-links] delete failed", error);
    redirect(buildRedirectUrl({ error: "No se pudo borrar el enlace.", ...listState }));
  }

  revalidatePath("/links");
  redirect(buildRedirectUrl({ saved: "deleted", ...listState }));
}
