import { prisma } from "@/lib/prisma";

const monthShortMap = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const seccionShortMap: Record<string, string> = {
  preescolar: "Pre",
  primaria: "Pri",
  secundaria: "Sec",
  bachillerato: "Bach",
  general: "Gen"
};

export function getMonthBounds(baseDate: Date) {
  const start = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1));
  const end = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + 1, 1));
  return { start, end };
}

export async function getNextMonthlyFolio(date: Date) {
  const { start, end } = getMonthBounds(date);
  const lastCoverage = await prisma.cobertura.findFirst({
    where: {
      fecha: {
        gte: start,
        lt: end
      }
    },
    orderBy: {
      folio: "desc"
    },
    select: {
      folio: true
    }
  });

  return (lastCoverage?.folio ?? 0) + 1;
}

export function formatCoverageCode({ folio, fecha }: { folio: number; fecha: Date }) {
  const month = monthShortMap[fecha.getUTCMonth()] ?? "Mes";
  const year = String(fecha.getUTCFullYear()).slice(-2);
  return `${month}${year}-${String(folio).padStart(3, "0")}`;
}

function abbreviateSeccion(seccion?: string | null) {
  if (!seccion?.trim()) {
    return "SinSec";
  }

  const normalized = seccion
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

  return seccionShortMap[normalized] ?? seccion.trim().replace(/\s+/g, "").slice(0, 4);
}

export function formatFolderName({
  folio,
  nombre,
  fecha,
  seccion
}: {
  folio: number;
  nombre: string;
  fecha: Date;
  seccion?: string | null;
}) {
  const monthLabel = `${monthShortMap[fecha.getUTCMonth()] ?? "Mes"}${String(fecha.getUTCFullYear()).slice(-2)}`;

  return [formatCoverageCode({ folio, fecha }), nombre.trim(), monthLabel, abbreviateSeccion(seccion)]
    .filter(Boolean)
    .join("-");
}
