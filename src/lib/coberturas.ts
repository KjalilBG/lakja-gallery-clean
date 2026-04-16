import { CoberturaStatus, Prisma, UserRole } from "@prisma/client";

import { getCoverageAlerts } from "@/lib/alerts";
import { syncCoverageCalendar } from "@/lib/ccc-calendar";
import { formatFolderName, getMonthBounds, getNextMonthlyFolio } from "@/lib/folio";
import { prisma } from "@/lib/prisma";

export const coverageStatuses = [
  CoberturaStatus.AGENDADO,
  CoberturaStatus.SOLICITADO,
  CoberturaStatus.REALIZADO,
  CoberturaStatus.CANCELADO
] as const;

export async function getCoverageWorkspace(month: Date, search?: string, status?: CoberturaStatus | "ALL") {
  const { start, end } = getMonthBounds(month);
  const where: Prisma.CoberturaWhereInput = {
    fecha: { gte: start, lt: end },
    ...(status && status !== "ALL" ? { estatus: status } : {}),
    ...(search
      ? {
          OR: [
            { nombre: { contains: search, mode: "insensitive" } },
            { comentarios: { contains: search, mode: "insensitive" } },
            { carpetaNombre: { contains: search, mode: "insensitive" } },
            { campus: { nombre: { contains: search, mode: "insensitive" } } },
            { seccion: { nombre: { contains: search, mode: "insensitive" } } },
            { lugar: { nombre: { contains: search, mode: "insensitive" } } },
            { staffAssignments: { some: { user: { name: { contains: search, mode: "insensitive" } } } } }
          ]
        }
      : {})
  };

  const [coberturas, campus, secciones, lugares, staff] = await Promise.all([
    prisma.cobertura.findMany({
      where,
      include: {
        campus: true,
        seccion: true,
        lugar: true,
        staffAssignments: {
          include: { user: true },
          orderBy: [{ isLead: "desc" }, { createdAt: "asc" }]
        }
      },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }]
    }),
    prisma.campus.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }] }),
    prisma.seccion.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }] }),
    prisma.lugar.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }] }),
    prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.STAFF] }, isActive: true },
      orderBy: [{ role: "asc" }, { name: "asc" }]
    })
  ]);

  const conflictsByCoverage = detectCoverageConflicts(coberturas);

  const rows = coberturas.map((coverage) => {
    const alerts = getCoverageAlerts({
      fecha: coverage.fecha,
      horaInicio: coverage.horaInicio,
      duracion: coverage.duracion,
      estatus: coverage.estatus,
      staffCount: coverage.staffAssignments.length,
      hasCampus: Boolean(coverage.campusId),
      hasSeccion: Boolean(coverage.seccionId),
      hasLugar: Boolean(coverage.lugarId),
      hasNombre: Boolean(coverage.nombre.trim()),
      conflictingCoverageIds: conflictsByCoverage.get(coverage.id)
    });

    return {
      id: coverage.id,
      folio: coverage.folio,
      nombre: coverage.nombre,
      fecha: coverage.fecha.toISOString(),
      horaInicio: coverage.horaInicio,
      duracion: coverage.duracion,
      carpetaNombre: coverage.carpetaNombre,
      comentarios: coverage.comentarios ?? "",
      detalles: coverage.detalles ?? "",
      estatus: coverage.estatus,
      campusId: coverage.campusId ?? "",
      seccionId: coverage.seccionId ?? "",
      lugarId: coverage.lugarId ?? "",
      campusNombre: coverage.campus?.nombre ?? "Sin campus",
      seccionNombre: coverage.seccion?.nombre ?? "Sin sección",
      lugarNombre: coverage.lugar?.nombre ?? "Sin lugar",
      staff: coverage.staffAssignments.map((assignment) => ({
        id: assignment.userId,
        nombre: assignment.user.name ?? assignment.user.email,
        isLead: assignment.isLead
      })),
      alerts
    };
  });

  return {
    rows,
    summary: {
      total: rows.length,
      agendadas: rows.filter((row) => row.estatus === CoberturaStatus.AGENDADO).length,
      solicitadas: rows.filter((row) => row.estatus === CoberturaStatus.SOLICITADO).length,
      realizadas: rows.filter((row) => row.estatus === CoberturaStatus.REALIZADO).length,
      canceladas: rows.filter((row) => row.estatus === CoberturaStatus.CANCELADO).length,
      vencidas: rows.filter((row) => row.alerts.some((alert) => alert.type === "vencida")).length
    },
    catalogs: {
      campus: campus.map((item) => ({ id: item.id, label: item.nombre })),
      secciones: secciones.map((item) => ({ id: item.id, label: item.nombre })),
      lugares: lugares.map((item) => ({ id: item.id, label: item.nombre })),
      staff: staff.map((item) => ({ id: item.id, label: item.name ?? item.email, role: item.role }))
    }
  };
}

function detectCoverageConflicts(
  coberturas: Array<{
    id: string;
    fecha: Date;
    horaInicio: string;
    duracion: number;
    staffAssignments: Array<{ userId: string }>;
  }>
) {
  const conflicts = new Map<string, string[]>();

  for (let index = 0; index < coberturas.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < coberturas.length; otherIndex += 1) {
      const current = coberturas[index];
      const next = coberturas[otherIndex];
      if (current.fecha.toISOString().slice(0, 10) !== next.fecha.toISOString().slice(0, 10)) continue;
      const sharedStaff = current.staffAssignments.some((assignment) => next.staffAssignments.some((other) => other.userId === assignment.userId));
      if (!sharedStaff) continue;
      const currentStart = toMinutes(current.horaInicio);
      const currentEnd = currentStart + current.duracion;
      const nextStart = toMinutes(next.horaInicio);
      const nextEnd = nextStart + next.duracion;
      if (currentStart < nextEnd && nextStart < currentEnd) {
        conflicts.set(current.id, [...(conflicts.get(current.id) ?? []), next.id]);
        conflicts.set(next.id, [...(conflicts.get(next.id) ?? []), current.id]);
      }
    }
  }

  return conflicts;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function createCoverage(input: {
  nombre: string;
  fecha: Date;
  horaInicio: string;
  duracion: number;
  campusId?: string;
  seccionId?: string;
  lugarId?: string;
  comentarios?: string;
  createdById: string;
  staffIds?: string[];
}) {
  const folio = await getNextMonthlyFolio(input.fecha);
  const seccion = input.seccionId ? await prisma.seccion.findUnique({ where: { id: input.seccionId }, select: { nombre: true } }) : null;

  const coverage = await prisma.cobertura.create({
    data: {
      folio,
      nombre: input.nombre,
      fecha: input.fecha,
      horaInicio: input.horaInicio,
      duracion: input.duracion,
      carpetaNombre: formatFolderName({ folio, nombre: input.nombre, fecha: input.fecha, seccion: seccion?.nombre }),
      campusId: input.campusId || null,
      seccionId: input.seccionId || null,
      lugarId: input.lugarId || null,
      comentarios: input.comentarios || null,
      createdById: input.createdById,
      updatedById: input.createdById,
      staffAssignments: input.staffIds?.length
        ? {
            create: input.staffIds.map((staffId, index) => ({ userId: staffId, isLead: index === 0 }))
          }
        : undefined,
      history: {
        create: {
          userId: input.createdById,
          action: "CREATED"
        }
      }
    }
  });

  if (coverage.estatus === CoberturaStatus.AGENDADO) {
    await syncCoverageCalendar(coverage.id);
  }

  return coverage;
}

export async function updateCoverageField(input: {
  id: string;
  field: "nombre" | "fecha" | "horaInicio" | "duracion" | "campusId" | "seccionId" | "lugarId" | "estatus" | "comentarios";
  value: string;
  userId: string;
}) {
  const current = await prisma.cobertura.findUnique({
    where: { id: input.id },
    include: { seccion: true }
  });

  if (!current) throw new Error("Cobertura no encontrada.");

  const data: Prisma.CoberturaUpdateInput = {
    updatedBy: { connect: { id: input.userId } }
  };

  if (input.field === "nombre") data.nombre = input.value.trim();
  if (input.field === "fecha") data.fecha = new Date(`${input.value}T00:00:00.000Z`);
  if (input.field === "horaInicio") data.horaInicio = input.value;
  if (input.field === "duracion") data.duracion = Number(input.value);
  if (input.field === "campusId") data.campus = input.value ? { connect: { id: input.value } } : { disconnect: true };
  if (input.field === "seccionId") data.seccion = input.value ? { connect: { id: input.value } } : { disconnect: true };
  if (input.field === "lugarId") data.lugar = input.value ? { connect: { id: input.value } } : { disconnect: true };
  if (input.field === "estatus") data.estatus = input.value as CoberturaStatus;
  if (input.field === "comentarios") data.comentarios = input.value.trim() || null;

  const futureDate = input.field === "fecha" ? new Date(`${input.value}T00:00:00.000Z`) : current.fecha;
  const futureName = input.field === "nombre" ? input.value.trim() : current.nombre;
  const futureSectionId = input.field === "seccionId" ? input.value : current.seccionId ?? "";
  const nextSection = futureSectionId ? await prisma.seccion.findUnique({ where: { id: futureSectionId }, select: { nombre: true } }) : null;

  data.carpetaNombre = formatFolderName({
    folio: current.folio,
    nombre: futureName,
    fecha: futureDate,
    seccion: nextSection?.nombre ?? current.seccion?.nombre
  });

  await prisma.cobertura.update({
    where: { id: input.id },
    data: {
      ...data,
      history: {
        create: {
          userId: input.userId,
          action: input.field === "estatus" ? "STATUS_CHANGED" : "UPDATED",
          field: input.field,
          beforeValue: String((current as unknown as Record<string, unknown>)[input.field] ?? ""),
          afterValue: input.value
        }
      }
    }
  });

  if (["nombre", "fecha", "horaInicio", "duracion", "estatus", "comentarios", "seccionId", "lugarId", "campusId"].includes(input.field)) {
    await syncCoverageCalendar(input.id);
  }
}

export async function replaceCoverageStaff(input: { id: string; staffIds: string[]; userId: string }) {
  await prisma.$transaction([
    prisma.coberturaStaff.deleteMany({ where: { coberturaId: input.id } }),
    prisma.cobertura.update({
      where: { id: input.id },
      data: {
        updatedById: input.userId,
        staffAssignments: {
          create: input.staffIds.map((staffId, index) => ({ userId: staffId, isLead: index === 0 }))
        },
        history: {
          create: {
            userId: input.userId,
            action: "STAFF_REASSIGNED",
            field: "staff"
          }
        }
      }
    })
  ]);

  await syncCoverageCalendar(input.id);
}

export async function duplicateCoverage(id: string, userId: string) {
  const current = await prisma.cobertura.findUnique({
    where: { id },
    include: { staffAssignments: true }
  });

  if (!current) throw new Error("Cobertura no encontrada.");

  const duplicated = await createCoverage({
    nombre: `${current.nombre} copia`,
    fecha: current.fecha,
    horaInicio: current.horaInicio,
    duracion: current.duracion,
    campusId: current.campusId ?? undefined,
    seccionId: current.seccionId ?? undefined,
    lugarId: current.lugarId ?? undefined,
    comentarios: current.comentarios ?? undefined,
    createdById: userId,
    staffIds: current.staffAssignments.map((assignment) => assignment.userId)
  });

  await prisma.coberturaHistory.create({
    data: {
      coberturaId: duplicated.id,
      userId,
      action: "DUPLICATED"
    }
  });
}

export async function deleteCoverage(id: string, userId: string) {
  const current = await prisma.cobertura.findUnique({
    where: { id },
    select: { estatus: true, calendarEventId: true }
  });

  if (current?.calendarEventId) {
    await prisma.cobertura.update({
      where: { id },
      data: { estatus: CoberturaStatus.CANCELADO }
    });
    await syncCoverageCalendar(id);
  }

  await prisma.coberturaHistory.create({
    data: {
      coberturaId: id,
      userId,
      action: "DELETED"
    }
  });

  await prisma.cobertura.delete({ where: { id } });
}

const monthNames = new Map<string, number>([
  ["enero", 0],
  ["febrero", 1],
  ["marzo", 2],
  ["abril", 3],
  ["mayo", 4],
  ["junio", 5],
  ["julio", 6],
  ["agosto", 7],
  ["septiembre", 8],
  ["setiembre", 8],
  ["octubre", 9],
  ["noviembre", 10],
  ["diciembre", 11]
]);

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function parseBulkDate(raw: string) {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`);
  }

  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-záéíóúñ]+)(?:\s+(\d{4}))?$/i);
  if (!match) {
    throw new Error(`Fecha inválida: ${raw}`);
  }

  const day = Number(match[1]);
  const month = monthNames.get(normalizeLookup(match[2]));
  const year = match[3] ? Number(match[3]) : new Date().getUTCFullYear();

  if (month === undefined) {
    throw new Error(`Mes inválido: ${raw}`);
  }

  return new Date(Date.UTC(year, month, day));
}

function parseBulkDuration(raw: string) {
  const value = raw.trim().toLowerCase();
  const hourMatch = value.match(/^(\d+(?:\.\d+)?)h$/);
  if (hourMatch) {
    return Math.round(Number(hourMatch[1]) * 60);
  }

  const minuteMatch = value.match(/^(\d+)\s*(min|m)$/);
  if (minuteMatch) {
    return Number(minuteMatch[1]);
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return Math.round((numeric <= 24 ? numeric * 60 : numeric));
  }

  throw new Error(`Duración inválida: ${raw}`);
}

export async function bulkCreateCoverage(input: { raw: string; createdById: string }) {
  const campus = await prisma.campus.findMany({ select: { id: true, nombre: true } });
  const secciones = await prisma.seccion.findMany({ select: { id: true, nombre: true } });
  const lugares = await prisma.lugar.findMany({ select: { id: true, nombre: true } });
  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.ADMIN, UserRole.STAFF]
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  const lines = input.raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const createdIds: string[] = [];

  for (const line of lines) {
    const parts = line.split("|").map((part) => part.trim()).filter(Boolean);

    if (parts.length < 7) {
      throw new Error(`Línea incompleta: ${line}`);
    }

    const [nombre, fechaRaw, horaInicio, duracionRaw, fifth, sixth, seventh, eighth] = parts;
    const hasCampus = parts.length >= 8;
    const campusRaw = hasCampus ? fifth : "";
    const lugarRaw = hasCampus ? sixth : fifth;
    const seccionRaw = hasCampus ? seventh : sixth;
    const staffRaw = hasCampus ? eighth ?? "" : seventh;

    const fecha = parseBulkDate(fechaRaw);
    const duracion = parseBulkDuration(duracionRaw);
    const campusId = campus.find((item) => normalizeLookup(item.nombre).includes(normalizeLookup(campusRaw)) || normalizeLookup(campusRaw).includes(normalizeLookup(item.nombre)))?.id;
    const seccionId = secciones.find((item) => normalizeLookup(item.nombre).includes(normalizeLookup(seccionRaw)) || normalizeLookup(seccionRaw).includes(normalizeLookup(item.nombre)))?.id;
    const lugarId = lugares.find((item) => normalizeLookup(item.nombre).includes(normalizeLookup(lugarRaw)) || normalizeLookup(lugarRaw).includes(normalizeLookup(item.nombre)))?.id;
    const staffIds = staffRaw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((name) =>
        staff.find((item) => {
          const label = normalizeLookup(item.name ?? item.email ?? "");
          const probe = normalizeLookup(name);
          return label.includes(probe) || probe.includes(label);
        })?.id
      )
      .filter((value): value is string => Boolean(value));

    const created = await createCoverage({
      nombre,
      fecha,
      horaInicio,
      duracion,
      campusId,
      seccionId,
      lugarId,
      createdById: input.createdById,
      staffIds
    });

    createdIds.push(created.id);
  }

  return createdIds;
}
