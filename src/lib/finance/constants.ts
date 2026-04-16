import {
  FinanceOwner,
  FinanceSourceChannel,
  FinanceSpecialType,
  FinanceTransactionStatus,
  FinanceTransactionType
} from "@prisma/client";

export const financeOwners = [FinanceOwner.LAKJA, FinanceOwner.KJALIL, FinanceOwner.KK] as const;

export const financeOwnerLabels: Record<FinanceOwner, string> = {
  [FinanceOwner.LAKJA]: "LaKja",
  [FinanceOwner.KJALIL]: "Kjalil",
  [FinanceOwner.KK]: "K&K"
};

export const financeTypeLabels: Record<FinanceTransactionType, string> = {
  [FinanceTransactionType.INCOME]: "Ingreso",
  [FinanceTransactionType.EXPENSE]: "Gasto",
  [FinanceTransactionType.SPECIAL]: "Movimiento especial",
  [FinanceTransactionType.HONORARIOS_KJALIL]: "Honorarios a Kjalil",
  [FinanceTransactionType.HONORARIOS_TERCEROS]: "Honorarios a terceros"
};

export const financeStatusLabels: Record<FinanceTransactionStatus, string> = {
  [FinanceTransactionStatus.CONFIRMED]: "Confirmado",
  [FinanceTransactionStatus.NEEDS_REVIEW]: "Revisar"
};

export const financeSpecialTypeLabels: Record<FinanceSpecialType, string> = {
  [FinanceSpecialType.PRESTAMO_DADO]: "Préstamo dado",
  [FinanceSpecialType.PRESTAMO_RECUPERADO]: "Préstamo recuperado",
  [FinanceSpecialType.REEMBOLSO]: "Reembolso",
  [FinanceSpecialType.TRANSFERENCIA]: "Transferencia",
  [FinanceSpecialType.AJUSTE]: "Ajuste",
  [FinanceSpecialType.OTRO]: "Otro"
};

export const financeSourceLabels: Record<FinanceSourceChannel, string> = {
  [FinanceSourceChannel.TELEGRAM]: "Telegram",
  [FinanceSourceChannel.DASHBOARD]: "Dashboard",
  [FinanceSourceChannel.IMPORT]: "Importación",
  [FinanceSourceChannel.SYSTEM]: "Sistema"
};

export const monthNamesEs = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
] as const;
