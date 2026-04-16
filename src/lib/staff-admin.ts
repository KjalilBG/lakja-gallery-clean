import { UserRole } from "@prisma/client";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function getStaffAdminWorkspace() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.ADMIN, UserRole.STAFF]
      }
    },
    include: {
      _count: {
        select: {
          staffAssignments: true,
          coverageNotes: true
        }
      },
      hourlyRates: true
    },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    accessConfigured: Boolean(user.staffAccessCodeHash),
    assignments: user._count.staffAssignments,
    notes: user._count.coverageNotes,
    hasHonorario: user.hourlyRates.length > 0
  }));
}

function generateAccessCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createStaffMember(input: { name: string; email: string; role: UserRole }) {
  const accessCode = generateAccessCode();
  const user = await prisma.user.upsert({
    where: {
      email: input.email.toLowerCase()
    },
    update: {
      name: input.name,
      role: input.role,
      isActive: true,
      staffAccessCodeHash: hashPassword(accessCode)
    },
    create: {
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      isActive: true,
      staffAccessCodeHash: hashPassword(accessCode)
    }
  });

  return {
    user,
    accessCode
  };
}

export async function updateStaffMember(input: { id: string; name: string; email: string; role: UserRole; isActive: boolean }) {
  return prisma.user.update({
    where: {
      id: input.id
    },
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      isActive: input.isActive
    }
  });
}

export async function resetStaffAccessCode(id: string) {
  const accessCode = generateAccessCode();
  const user = await prisma.user.update({
    where: { id },
    data: {
      staffAccessCodeHash: hashPassword(accessCode),
      isActive: true
    }
  });

  return {
    user,
    accessCode
  };
}

export async function removeStaffMember(id: string, actorUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          createdCoberturas: true,
          updatedCoberturas: true,
          staffAssignments: true,
          coberturaHistory: true,
          coverageNotes: true,
          accounts: true,
          sessions: true
        }
      }
    }
  });

  if (!user) {
    throw new Error("Staff no encontrado.");
  }

  if (id === actorUserId) {
    throw new Error("No puedes borrarte a ti mismo.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.cobertura.updateMany({
      where: { createdById: id },
      data: { createdById: actorUserId, updatedById: actorUserId }
    });

    await tx.cobertura.updateMany({
      where: { updatedById: id },
      data: { updatedById: actorUserId }
    });

    await tx.user.delete({
      where: { id }
    });
  });

  return { deleted: true };
}
