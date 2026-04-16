import { monthNamesEs } from "@/lib/finance/constants";

export const FINANCE_TIME_ZONE = "America/Mexico_City";

function getZonedParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: FINANCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day)
  };
}

export function getCurrentPeriodKey(reference = new Date()) {
  const parts = getZonedParts(reference);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

export function getPeriodDateRange(periodKey: string) {
  const match = periodKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error("Periodo inválido.");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));

  return { start, end, year, monthIndex };
}

export function formatPeriodLabel(periodKey: string) {
  const { year, monthIndex } = getPeriodDateRange(periodKey);
  return `${monthNamesEs[monthIndex]} ${year}`;
}

export function parseSpanishMonthPeriod(input: string) {
  const normalized = input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

  const match = normalized.match(/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{4})$/);
  if (!match) return null;

  const monthToken = match[1] === "setiembre" ? "septiembre" : match[1];
  const monthIndex = monthNamesEs.findIndex((month) => month === monthToken);
  if (monthIndex < 0) return null;

  return `${match[2]}-${String(monthIndex + 1).padStart(2, "0")}`;
}
