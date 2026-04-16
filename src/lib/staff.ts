import { CoberturaStatus } from "@prisma/client";

import { syncCoverageCalendar } from "@/lib/ccc-calendar";
import { prisma } from "@/lib/prisma";

function coverageDateTime(fecha: Date, horaInicio: string) {
  return new Date(`${fecha.toISOString().slice(0, 10)}T${horaInicio}:00.000Z`);
}

export async function getStaffWorkspace(userId?: string) {
  const coberturas = await prisma.cobertura.findMany({
    where: userId
      ? {
          staffAssignments: {
            some: {
              userId
            }
          }
        }
      : undefined,
    include: {
      campus: true,
      seccion: true,
      lugar: true,
      staffAssignments: {
        include: {
          user: true
        }
      },
      staffNotes: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }]
  });

  const activeUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true }
      })
    : null;

  const mine =
    userId && activeUser?.isActive === false
      ? []
      : coberturas.filter((item) => (userId ? item.staffAssignments.some((assignment) => assignment.userId === userId) : true));

  const now = new Date();
  const upcoming = mine.filter((item) => {
    const start = coverageDateTime(item.fecha, item.horaInicio);
    return start >= now || item.estatus === CoberturaStatus.AGENDADO || item.estatus === CoberturaStatus.SOLICITADO;
  });
  const history = mine.filter((item) => !upcoming.some((current) => current.id === item.id)).reverse();

  return {
    all: coberturas,
    pending: upcoming.filter((item) => item.estatus === CoberturaStatus.AGENDADO || item.estatus === CoberturaStatus.SOLICITADO),
    mine,
    upcoming,
    history
  };
}

export async function setOwnCoverageStatus(input: { coverageId: string; userId: string; status: CoberturaStatus }) {
  const assignment = await prisma.coberturaStaff.findFirst({
    where: {
      coberturaId: input.coverageId,
      userId: input.userId
    },
    select: {
      coberturaId: true
    }
  });

  if (!assignment) {
    throw new Error("No puedes editar esta cobertura.");
  }

  const coverage = await prisma.cobertura.findUnique({
    where: { id: input.coverageId },
    select: { estatus: true }
  });

  if (!coverage) {
    throw new Error("Cobertura no encontrada.");
  }

  await prisma.cobertura.update({
    where: { id: input.coverageId },
    data: {
      estatus: input.status,
      updatedById: input.userId,
      history: {
        create: {
          userId: input.userId,
          action: "STATUS_CHANGED",
          field: "estatus",
          beforeValue: coverage.estatus,
          afterValue: input.status
        }
      }
    }
  });

  await syncCoverageCalendar(input.coverageId);
}
