"use server";

import { CoberturaStatus } from "@prisma/client";
import { z } from "zod";

import { requireAdminSession, requireStaffSession } from "@/lib/auth-guard";
import { bulkCreateCoverage, createCoverage, deleteCoverage, duplicateCoverage, replaceCoverageStaff, updateCoverageField } from "@/lib/coberturas";
import { setOwnCoverageStatus } from "@/lib/staff";

const createCoverageSchema = z.object({
  nombre: z.string().trim().min(3),
  fecha: z.string().min(1),
  horaInicio: z.string().min(1),
  duracion: z.coerce.number().int().min(1).max(720),
  campusId: z.string().optional(),
  seccionId: z.string().optional(),
  lugarId: z.string().optional(),
  comentarios: z.string().optional(),
  staffIds: z.array(z.string()).optional()
});

export async function createCoverageAction(formData: FormData) {
  const session = await requireAdminSession("/ccc");
  const parsed = createCoverageSchema.parse({
    nombre: formData.get("nombre"),
    fecha: formData.get("fecha"),
    horaInicio: formData.get("horaInicio"),
    duracion: formData.get("duracion"),
    campusId: formData.get("campusId") || undefined,
    seccionId: formData.get("seccionId") || undefined,
    lugarId: formData.get("lugarId") || undefined,
    comentarios: formData.get("comentarios") || undefined,
    staffIds: formData.getAll("staffIds").map((value) => String(value))
  });

  await createCoverage({
    ...parsed,
    fecha: new Date(`${parsed.fecha}T00:00:00.000Z`),
    createdById: session.user.id ?? ""
  });
}

export async function bulkCreateCoverageAction(formData: FormData) {
  const session = await requireAdminSession("/ccc");
  const raw = z.string().min(1).parse(formData.get("raw"));
  await bulkCreateCoverage({
    raw,
    createdById: session.user.id ?? ""
  });
}

export async function updateCoverageFieldAction(input: {
  id: string;
  field: "nombre" | "fecha" | "horaInicio" | "duracion" | "campusId" | "seccionId" | "lugarId" | "estatus" | "comentarios";
  value: string;
}) {
  const session = await requireAdminSession("/ccc");
  await updateCoverageField({
    ...input,
    userId: session.user.id ?? ""
  });
}

export async function updateCoverageStaffAction(input: { id: string; staffIds: string[] }) {
  const session = await requireAdminSession("/ccc");
  await replaceCoverageStaff({
    ...input,
    userId: session.user.id ?? ""
  });
}

export async function duplicateCoverageAction(input: { id: string }) {
  const session = await requireAdminSession("/ccc");
  await duplicateCoverage(input.id, session.user.id ?? "");
}

export async function setCoverageStatusAction(input: { id: string; status: keyof typeof CoberturaStatus }) {
  const session = await requireAdminSession("/ccc");
  await updateCoverageField({
    id: input.id,
    field: "estatus",
    value: input.status,
    userId: session.user.id ?? ""
  });
}

export async function removeCoverageAction(input: { id: string }) {
  const session = await requireAdminSession("/ccc");
  await deleteCoverage(input.id, session.user.id ?? "");
}

export async function addStaffNoteAction(formData: FormData) {
  await requireStaffSession("/ccc");
  return formData;
}

export async function setOwnCoverageStatusAction(formData: FormData) {
  const session = await requireStaffSession("/ccc/staff");
  const coverageId = z.string().min(1).parse(formData.get("coverageId"));
  const status = z.nativeEnum(CoberturaStatus).parse(formData.get("status"));
  await setOwnCoverageStatus({
    coverageId,
    userId: session.user.id ?? "",
    status
  });
}
