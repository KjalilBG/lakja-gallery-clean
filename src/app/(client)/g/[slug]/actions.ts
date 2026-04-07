"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAlbumAccessToken, getAlbumAccessCookieName } from "@/lib/album-access";
import { getAlbumBySlug } from "@/lib/albums";
import { verifyPassword } from "@/lib/password";

export async function unlockAlbumAction(formData: FormData) {
  const slug = z.string().parse(formData.get("slug"));
  const password = z.string().trim().min(1).parse(formData.get("password"));

  const album = await getAlbumBySlug(slug);

  if (!album || !album.passwordHash) {
    redirect(`/appfotos/g/${slug}`);
  }

  if (!verifyPassword(password, album.passwordHash)) {
    redirect(`/appfotos/g/${slug}?error=password`);
  }

  const cookieStore = await cookies();
  cookieStore.set(getAlbumAccessCookieName(slug), createAlbumAccessToken(slug, album.passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/appfotos/g/${slug}`,
    maxAge: 60 * 60 * 12
  });

  redirect(`/appfotos/g/${slug}`);
}
