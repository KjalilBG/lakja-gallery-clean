"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth-guard";
import { createCampus, createLugar, createSeccion, moveCampus, moveLugar, moveSeccion, updateCampus, updateLugar, updateSeccion } from "@/lib/catalogos";

const createSchema = z.object({
  nombre: z.string().trim().min(2)
});

const updateSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().trim().min(2),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean()
});

const moveSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"])
});

export async function createCampusAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = createSchema.parse({
    nombre: formData.get("nombre")
  });
  await createCampus(parsed);
  revalidatePath("/ccc/admin");
}

export async function createSeccionAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = createSchema.parse({
    nombre: formData.get("nombre")
  });
  await createSeccion(parsed);
  revalidatePath("/ccc/admin");
}

export async function createLugarAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = createSchema.parse({
    nombre: formData.get("nombre")
  });
  await createLugar({
    ...parsed,
    campusId: String(formData.get("campusId") || "") || undefined
  });
  revalidatePath("/ccc/admin");
}

export async function updateCampusAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = updateSchema.parse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on"
  });
  await updateCampus(parsed);
  revalidatePath("/ccc/admin");
}

export async function updateSeccionAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = updateSchema.parse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on"
  });
  await updateSeccion(parsed);
  revalidatePath("/ccc/admin");
}

export async function updateLugarAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = updateSchema.parse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on"
  });
  await updateLugar({
    ...parsed,
    campusId: String(formData.get("campusId") || "") || undefined
  });
  revalidatePath("/ccc/admin");
}

export async function moveCampusAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = moveSchema.parse({
    id: formData.get("id"),
    direction: formData.get("direction")
  });
  await moveCampus(parsed.id, parsed.direction);
  revalidatePath("/ccc/admin");
}

export async function moveSeccionAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = moveSchema.parse({
    id: formData.get("id"),
    direction: formData.get("direction")
  });
  await moveSeccion(parsed.id, parsed.direction);
  revalidatePath("/ccc/admin");
}

export async function moveLugarAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = moveSchema.parse({
    id: formData.get("id"),
    direction: formData.get("direction")
  });
  await moveLugar(parsed.id, parsed.direction);
  revalidatePath("/ccc/admin");
}
