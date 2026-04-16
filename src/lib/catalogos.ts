import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/utils";

async function moveCatalogItem(
  current: { id: string; sortOrder: number } | null,
  sibling: { id: string; sortOrder: number } | null,
  updateCurrent: (sortOrder: number) => Promise<unknown>,
  updateSibling: (sortOrder: number) => Promise<unknown>
) {
  if (!current || !sibling) {
    return;
  }

  await updateCurrent(sibling.sortOrder);
  await updateSibling(current.sortOrder);
}

export async function getCatalogWorkspace() {
  const [campus, secciones, lugares] = await Promise.all([
    prisma.campus.findMany({
      include: {
        _count: {
          select: {
            coberturas: true,
            lugares: true
          }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }]
    }),
    prisma.seccion.findMany({
      include: {
        _count: {
          select: {
            coberturas: true
          }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { nombre: "asc" }]
    }),
    prisma.lugar.findMany({
      include: {
        campus: true,
        _count: {
          select: {
            coberturas: true
          }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { campus: { nombre: "asc" } }, { nombre: "asc" }]
    })
  ]);

  return { campus, secciones, lugares };
}

export async function createCampus(input: { nombre: string }) {
  const last = await prisma.campus.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  return prisma.campus.create({
    data: {
      nombre: input.nombre,
      slug: toSlug(input.nombre),
      sortOrder: (last?.sortOrder ?? -1) + 1
    }
  });
}

export async function updateCampus(input: { id: string; nombre: string; sortOrder: number; isActive: boolean }) {
  return prisma.campus.update({
    where: { id: input.id },
    data: {
      nombre: input.nombre,
      slug: toSlug(input.nombre),
      sortOrder: input.sortOrder,
      isActive: input.isActive
    }
  });
}

export async function createSeccion(input: { nombre: string }) {
  const last = await prisma.seccion.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  return prisma.seccion.create({
    data: {
      nombre: input.nombre,
      slug: toSlug(input.nombre),
      sortOrder: (last?.sortOrder ?? -1) + 1
    }
  });
}

export async function updateSeccion(input: { id: string; nombre: string; sortOrder: number; isActive: boolean }) {
  return prisma.seccion.update({
    where: { id: input.id },
    data: {
      nombre: input.nombre,
      slug: toSlug(input.nombre),
      sortOrder: input.sortOrder,
      isActive: input.isActive
    }
  });
}

export async function createLugar(input: { nombre: string; campusId?: string }) {
  const last = await prisma.lugar.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  return prisma.lugar.create({
    data: {
      nombre: input.nombre,
      slug: toSlug(input.nombre),
      campusId: input.campusId || null,
      sortOrder: (last?.sortOrder ?? -1) + 1
    }
  });
}

export async function updateLugar(input: { id: string; nombre: string; campusId?: string; sortOrder: number; isActive: boolean }) {
  return prisma.lugar.update({
    where: { id: input.id },
    data: {
      nombre: input.nombre,
      slug: toSlug(input.nombre),
      campusId: input.campusId || null,
      sortOrder: input.sortOrder,
      isActive: input.isActive
    }
  });
}

export async function moveCampus(id: string, direction: "up" | "down") {
  const current = await prisma.campus.findUnique({ where: { id }, select: { id: true, sortOrder: true } });
  const sibling = await prisma.campus.findFirst({
    where: { sortOrder: direction === "up" ? { lt: current?.sortOrder ?? 0 } : { gt: current?.sortOrder ?? 0 } },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true }
  });

  return moveCatalogItem(
    current,
    sibling,
    (sortOrder) => prisma.campus.update({ where: { id }, data: { sortOrder } }),
    (sortOrder) => prisma.campus.update({ where: { id: sibling!.id }, data: { sortOrder } })
  );
}

export async function moveSeccion(id: string, direction: "up" | "down") {
  const current = await prisma.seccion.findUnique({ where: { id }, select: { id: true, sortOrder: true } });
  const sibling = await prisma.seccion.findFirst({
    where: { sortOrder: direction === "up" ? { lt: current?.sortOrder ?? 0 } : { gt: current?.sortOrder ?? 0 } },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true }
  });

  return moveCatalogItem(
    current,
    sibling,
    (sortOrder) => prisma.seccion.update({ where: { id }, data: { sortOrder } }),
    (sortOrder) => prisma.seccion.update({ where: { id: sibling!.id }, data: { sortOrder } })
  );
}

export async function moveLugar(id: string, direction: "up" | "down") {
  const current = await prisma.lugar.findUnique({ where: { id }, select: { id: true, sortOrder: true } });
  const sibling = await prisma.lugar.findFirst({
    where: { sortOrder: direction === "up" ? { lt: current?.sortOrder ?? 0 } : { gt: current?.sortOrder ?? 0 } },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true }
  });

  return moveCatalogItem(
    current,
    sibling,
    (sortOrder) => prisma.lugar.update({ where: { id }, data: { sortOrder } }),
    (sortOrder) => prisma.lugar.update({ where: { id: sibling!.id }, data: { sortOrder } })
  );
}
