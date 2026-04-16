"use server";

import { UserRole } from "@prisma/client";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth-guard";
import { createStaffMember, removeStaffMember, resetStaffAccessCode, updateStaffMember } from "@/lib/staff-admin";

const staffSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  role: z.nativeEnum(UserRole)
});

export async function createStaffMemberAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const parsed = staffSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role")
  });
  const { user, accessCode } = await createStaffMember(parsed);
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    accessCode
  };
}

export async function updateStaffMemberAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const id = z.string().min(1).parse(formData.get("id"));
  const parsed = staffSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role")
  });
  const user = await updateStaffMember({ id, ...parsed, isActive: formData.get("isActive") === "on" });
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
}

export async function deleteStaffMemberAction(formData: FormData) {
  const session = await requireAdminSession("/ccc/admin");
  const id = z.string().min(1).parse(formData.get("id"));
  const result = await removeStaffMember(id, session.user.id ?? "");
  return { id, ...result };
}

export async function resetStaffAccessCodeAction(formData: FormData) {
  await requireAdminSession("/ccc/admin");
  const id = z.string().min(1).parse(formData.get("id"));
  const { user, accessCode } = await resetStaffAccessCode(id);
  return {
    id: user.id,
    isActive: user.isActive,
    accessCode
  };
}
