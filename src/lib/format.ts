export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(date));
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}
