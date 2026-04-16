import { CoberturaStatus } from "@prisma/client";

export type CoverageAlertType = "vencida" | "sin-staff" | "datos-incompletos" | "conflicto" | "duracion-invalida";

export type CoverageAlert = {
  type: CoverageAlertType;
  label: string;
  tone: "red" | "amber" | "slate";
};

export type CoverageAlertInput = {
  fecha: Date;
  horaInicio: string;
  duracion: number;
  estatus: CoberturaStatus;
  staffCount: number;
  hasCampus: boolean;
  hasSeccion: boolean;
  hasLugar: boolean;
  hasNombre: boolean;
  conflictingCoverageIds?: string[];
};

export function getCoverageAlerts(input: CoverageAlertInput) {
  const alerts: CoverageAlert[] = [];
  const coverageDateTime = new Date(`${input.fecha.toISOString().slice(0, 10)}T${input.horaInicio || "00:00"}:00.000Z`);
  const isPastDue =
    coverageDateTime.getTime() < Date.now() &&
    input.estatus !== CoberturaStatus.REALIZADO &&
    input.estatus !== CoberturaStatus.CANCELADO;

  if (isPastDue) alerts.push({ type: "vencida", label: "Vencida", tone: "red" });
  if (input.staffCount === 0) alerts.push({ type: "sin-staff", label: "Sin staff", tone: "amber" });
  if (!input.hasNombre || !input.hasCampus || !input.hasSeccion || !input.hasLugar) {
    alerts.push({ type: "datos-incompletos", label: "Datos incompletos", tone: "slate" });
  }
  if (input.duracion <= 0 || input.duracion > 720) alerts.push({ type: "duracion-invalida", label: "Duración inválida", tone: "amber" });
  if ((input.conflictingCoverageIds?.length ?? 0) > 0) alerts.push({ type: "conflicto", label: "Conflicto horario", tone: "red" });

  return alerts;
}
