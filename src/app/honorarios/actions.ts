"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth-guard";
import { addHonorarioRule, removeHonorarioRule, updateHonorarioRule, upsertHonorarioBase } from "@/lib/honorarios";

const honorarioSchema = z.object({
  userId: z.string().min(1),
  paymentType: z.enum(["HOURLY", "FLAT", "MIXED"]),
  costoHora: z.string().optional(),
  transporte: z.string().optional(),
  reglaIguala1a2: z.string().optional(),
  reglaIguala3a4: z.string().optional(),
  reglaIguala5Plus: z.string().optional()
});

const ruleSchema = z.object({
  label: z.string().optional(),
  desdeHoras: z.string().optional(),
  hastaHoras: z.string().optional(),
  montoFijo: z.string().optional(),
  costoHora: z.string().optional(),
  transporte: z.string().optional()
});

export async function saveHonorarioAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = honorarioSchema.parse({
    userId: formData.get("userId"),
    paymentType: formData.get("paymentType"),
    costoHora: formData.get("costoHora") || undefined,
    transporte: formData.get("transporte") || undefined,
    reglaIguala1a2: formData.get("reglaIguala1a2") || undefined,
    reglaIguala3a4: formData.get("reglaIguala3a4") || undefined,
    reglaIguala5Plus: formData.get("reglaIguala5Plus") || undefined
  });
  await upsertHonorarioBase(parsed);
  revalidatePath("/ccc/admin");
}

export async function addHonorarioRuleAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const userId = z.string().min(1).parse(formData.get("userId"));
  const parsed = ruleSchema.parse({
    label: formData.get("label") || undefined,
    desdeHoras: formData.get("desdeHoras") || undefined,
    hastaHoras: formData.get("hastaHoras") || undefined,
    montoFijo: formData.get("montoFijo") || undefined,
    costoHora: formData.get("costoHora") || undefined,
    transporte: formData.get("transporte") || undefined
  });
  await addHonorarioRule({ userId, ...parsed });
  revalidatePath("/ccc/admin");
}

export async function updateHonorarioRuleAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const id = z.string().min(1).parse(formData.get("id"));
  const sortOrder = z.coerce.number().int().min(0).parse(formData.get("sortOrder"));
  const parsed = ruleSchema.parse({
    label: formData.get("label") || undefined,
    desdeHoras: formData.get("desdeHoras") || undefined,
    hastaHoras: formData.get("hastaHoras") || undefined,
    montoFijo: formData.get("montoFijo") || undefined,
    costoHora: formData.get("costoHora") || undefined,
    transporte: formData.get("transporte") || undefined
  });
  await updateHonorarioRule({ id, sortOrder, ...parsed });
  revalidatePath("/ccc/admin");
}

export async function removeHonorarioRuleAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const id = z.string().min(1).parse(formData.get("id"));
  await removeHonorarioRule(id);
  revalidatePath("/ccc/admin");
}
