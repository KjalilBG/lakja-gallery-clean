import { prisma } from "@/lib/prisma";
import { getFinanceReport } from "@/lib/finance/reports";
import { formatPeriodLabel, getCurrentPeriodKey } from "@/lib/finance/period";

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  }).format(value);
}

function buildSectionCard(title: string, rows: Array<{ label: string; value: string }>) {
  return `
    <section style="margin:0 0 18px;border:1px solid #e2e8f0;border-radius:8px;padding:16px;background:#ffffff">
      <h2 style="margin:0 0 12px;font-size:16px;letter-spacing:0.08em;text-transform:uppercase;color:#0f172a">${title}</h2>
      <table style="width:100%;border-collapse:collapse">
        ${rows
          .map(
            (row) => `
              <tr>
                <td style="padding:8px 0;border-top:1px solid #f1f5f9;color:#475569">${row.label}</td>
                <td style="padding:8px 0;border-top:1px solid #f1f5f9;text-align:right;font-weight:700;color:#0f172a">${row.value}</td>
              </tr>
            `
          )
          .join("")}
      </table>
    </section>
  `;
}

export async function sendMonthlyFinanceDigest(periodKey = getCurrentPeriodKey()) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const to = process.env.FINANCE_MONTHLY_REPORT_TO?.trim();

  if (!apiKey || !from || !to) {
    throw new Error("Faltan variables de Resend para el reporte financiero.");
  }

  const alreadySent = await prisma.financeMonthlyDigest.findUnique({
    where: { periodKey }
  });

  if (alreadySent) {
    return { skipped: true, periodKey };
  }

  const [general, lakja, kk, kjalil] = await Promise.all([
    getFinanceReport({ periodKey }),
    getFinanceReport({ periodKey, owner: "LAKJA" }),
    getFinanceReport({ periodKey, owner: "KK" }),
    getFinanceReport({ periodKey, owner: "KJALIL" })
  ]);

  const periodLabel = formatPeriodLabel(periodKey);
  const subject = `Reporte financiero ${periodLabel}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:760px;margin:0 auto">
        <h1 style="margin:0 0 8px;font-size:28px">Reporte financiero ${periodLabel}</h1>
        <p style="margin:0 0 20px;color:#475569">KPIs, hallazgos y cortes por bolsa sin mezclar flujos.</p>

        ${buildSectionCard("REPORTE GENERAL", [
          { label: "Ingresos LaKja", value: money(general.totals.lakjaIncome) },
          { label: "Gasto operativo LaKja", value: money(general.totals.lakjaOperationalExpense) },
          { label: "Honorarios a Kjalil", value: money(general.totals.lakjaHonorariosKjalil) },
          { label: "Honorarios a terceros", value: money(general.totals.lakjaHonorariosTerceros) },
          { label: "Gasto Kjalil", value: money(general.totals.kjalilExpense) },
          { label: "Gasto K&K", value: money(general.totals.kkExpense) },
          { label: "Movimientos especiales", value: money(general.totals.special) }
        ])}

        ${buildSectionCard("REPORTE LAKJA", [
          { label: "Ingresos", value: money(lakja.totals.lakjaIncome) },
          { label: "Gasto operativo", value: money(lakja.totals.lakjaOperationalExpense) },
          { label: "Honorarios Kjalil", value: money(lakja.totals.lakjaHonorariosKjalil) },
          { label: "Honorarios terceros", value: money(lakja.totals.lakjaHonorariosTerceros) },
          { label: "Balance", value: money(lakja.totals.lakjaBalance) },
          { label: "Validación", value: lakja.insights.classificationHealth }
        ])}

        ${buildSectionCard("REPORTE K&K", [
          { label: "Gasto K&K", value: money(kk.totals.kkExpense) },
          { label: "Especiales", value: money(kk.totals.special) },
          { label: "Movimientos", value: String(kk.totals.totalTransactions) }
        ])}

        ${buildSectionCard("REPORTE KJALIL", [
          { label: "Gasto Kjalil", value: money(kjalil.totals.kjalilExpense) },
          { label: "Especiales", value: money(kjalil.totals.special) },
          { label: "Movimientos", value: String(kjalil.totals.totalTransactions) }
        ])}

        ${buildSectionCard(
          "HALLAZGOS Y RECOMENDACIONES",
          [
            { label: "Estado de clasificación", value: general.insights.classificationHealth },
            {
              label: "Top categorías",
              value: general.insights.topCategories.map((item) => `${item.label}: ${money(item.amount)}`).join(" · ") || "Sin datos"
            },
            {
              label: "Fuentes de ingreso LaKja",
              value: general.insights.topIncomeSources.map((item) => `${item.label}: ${money(item.amount)}`).join(" · ") || "Sin datos"
            },
            {
              label: "Proveedores principales LaKja",
              value: lakja.sections.lakja.proveedoresPrincipales.map((item) => `${item.name}: ${money(item.amount)}`).join(" · ") || "Sin datos"
            }
          ]
        )}
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    throw new Error(`Resend devolvió ${response.status}.`);
  }

  await prisma.financeMonthlyDigest.create({
    data: {
      periodKey,
      recipient: to,
      subject,
      metadata: {
        reportPeriod: periodKey
      }
    }
  });

  return { skipped: false, periodKey };
}
