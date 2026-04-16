import { prisma } from "@/lib/prisma";

function toDecimalValue(value?: string) {
  if (!value || !value.trim()) {
    return null;
  }

  return value.trim();
}

export async function getHonorariosWorkspace() {
  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "STAFF"]
      }
    },
    include: {
      hourlyRates: {
        include: {
          rules: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          }
        }
      }
    },
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }]
  });

  return staff.map((user) => ({
    id: user.id,
    nombre: user.name ?? user.email,
    role: user.role,
    isActive: user.isActive,
    honorario: user.hourlyRates[0]
      ? {
          id: user.hourlyRates[0].id,
          paymentType: user.hourlyRates[0].paymentType,
          costoHora: user.hourlyRates[0].costoHora?.toString() ?? "",
          transporte: user.hourlyRates[0].transporte?.toString() ?? "",
          reglaIguala1a2: user.hourlyRates[0].reglaIguala1a2?.toString() ?? "",
          reglaIguala3a4: user.hourlyRates[0].reglaIguala3a4?.toString() ?? "",
          reglaIguala5Plus: user.hourlyRates[0].reglaIguala5Plus?.toString() ?? "",
          rules: user.hourlyRates[0].rules.map((rule) => ({
            id: rule.id,
            label: rule.label ?? "",
            desdeHoras: rule.desdeHoras?.toString() ?? "",
            hastaHoras: rule.hastaHoras?.toString() ?? "",
            montoFijo: rule.montoFijo?.toString() ?? "",
            costoHora: rule.costoHora?.toString() ?? "",
            transporte: rule.transporte?.toString() ?? "",
            sortOrder: rule.sortOrder
          }))
        }
      : null
  }));
}

export async function upsertHonorarioBase(input: {
  userId: string;
  paymentType: "HOURLY" | "FLAT" | "MIXED";
  costoHora?: string;
  transporte?: string;
  reglaIguala1a2?: string;
  reglaIguala3a4?: string;
  reglaIguala5Plus?: string;
}) {
  return prisma.staffHonorario.upsert({
    where: {
      userId: input.userId
    },
    update: {
      paymentType: input.paymentType,
      costoHora: toDecimalValue(input.costoHora),
      transporte: toDecimalValue(input.transporte),
      reglaIguala1a2: toDecimalValue(input.reglaIguala1a2),
      reglaIguala3a4: toDecimalValue(input.reglaIguala3a4),
      reglaIguala5Plus: toDecimalValue(input.reglaIguala5Plus)
    },
    create: {
      userId: input.userId,
      paymentType: input.paymentType,
      costoHora: toDecimalValue(input.costoHora),
      transporte: toDecimalValue(input.transporte),
      reglaIguala1a2: toDecimalValue(input.reglaIguala1a2),
      reglaIguala3a4: toDecimalValue(input.reglaIguala3a4),
      reglaIguala5Plus: toDecimalValue(input.reglaIguala5Plus)
    }
  });
}

export async function addHonorarioRule(input: {
  userId: string;
  label?: string;
  desdeHoras?: string;
  hastaHoras?: string;
  montoFijo?: string;
  costoHora?: string;
  transporte?: string;
}) {
  const honorario = await prisma.staffHonorario.upsert({
    where: { userId: input.userId },
    update: {},
    create: {
      userId: input.userId
    },
    select: { id: true }
  });

  const last = await prisma.staffHonorarioRule.findFirst({
    where: { honorarioId: honorario.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  return prisma.staffHonorarioRule.create({
    data: {
      honorarioId: honorario.id,
      label: input.label?.trim() || null,
      desdeHoras: toDecimalValue(input.desdeHoras),
      hastaHoras: toDecimalValue(input.hastaHoras),
      montoFijo: toDecimalValue(input.montoFijo),
      costoHora: toDecimalValue(input.costoHora),
      transporte: toDecimalValue(input.transporte),
      sortOrder: (last?.sortOrder ?? -1) + 1
    }
  });
}

export async function updateHonorarioRule(input: {
  id: string;
  label?: string;
  desdeHoras?: string;
  hastaHoras?: string;
  montoFijo?: string;
  costoHora?: string;
  transporte?: string;
  sortOrder: number;
}) {
  return prisma.staffHonorarioRule.update({
    where: { id: input.id },
    data: {
      label: input.label?.trim() || null,
      desdeHoras: toDecimalValue(input.desdeHoras),
      hastaHoras: toDecimalValue(input.hastaHoras),
      montoFijo: toDecimalValue(input.montoFijo),
      costoHora: toDecimalValue(input.costoHora),
      transporte: toDecimalValue(input.transporte),
      sortOrder: input.sortOrder
    }
  });
}

export async function removeHonorarioRule(id: string) {
  return prisma.staffHonorarioRule.delete({
    where: { id }
  });
}
