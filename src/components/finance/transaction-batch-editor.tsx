"use client";

import { useEffect, useMemo, useState } from "react";
import type { FinanceOwner, FinanceTransactionStatus, FinanceTransactionType } from "@prisma/client";
import { Save } from "lucide-react";

type EditableTransaction = {
  id: string;
  date: string;
  owner: FinanceOwner;
  type: FinanceTransactionType;
  category: string;
  description: string;
  amount: number;
  currency: string;
  status: FinanceTransactionStatus;
};

export function TransactionBatchEditor({
  transactions,
  returnTo,
  ownerLabels,
  typeLabels,
  statusLabels,
  action
}: {
  transactions: EditableTransaction[];
  returnTo: string;
  ownerLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [rows, setRows] = useState(transactions);

  useEffect(() => {
    setRows(transactions);
  }, [transactions]);

  const dirtyCount = useMemo(
    () =>
      rows.reduce((count, row, index) => {
        const original = transactions[index];
        return count + (original && (original.description !== row.description || original.category !== row.category) ? 1 : 0);
      }, 0),
    [rows, transactions]
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Edita varias descripciones y categorías sin refrescos intermedios.
        </p>
        <button className="inline-flex items-center gap-2 rounded-[8px] border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <Save className="h-4 w-4" />
          Guardar {dirtyCount > 0 ? `${dirtyCount} cambios` : "todo"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-[8px] border border-slate-200 dark:border-slate-700">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr className="text-left text-slate-500 dark:text-slate-300">
              <th className="px-3 py-2 font-bold">Fecha</th>
              <th className="px-3 py-2 font-bold">Owner</th>
              <th className="px-3 py-2 font-bold">Tipo</th>
              <th className="px-3 py-2 font-bold">Monto</th>
              <th className="px-3 py-2 font-bold">Categoría</th>
              <th className="px-3 py-2 font-bold">Descripción</th>
              <th className="px-3 py-2 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                  {row.date}
                  <input type="hidden" name="ids" value={row.id} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-200">{ownerLabels[row.owner]}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-200">{typeLabels[row.type]}</td>
                <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                  {row.type === "INCOME" ? "+" : "-"} {new Intl.NumberFormat("es-MX", { style: "currency", currency: row.currency }).format(row.amount)}
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-44 rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    name="categories"
                    list="finance-categories"
                    value={row.category}
                    onChange={(event) => {
                      const next = [...rows];
                      next[index] = { ...row, category: event.target.value };
                      setRows(next);
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-[26rem] max-w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    name="descriptions"
                    value={row.description}
                    onChange={(event) => {
                      const next = [...rows];
                      next[index] = { ...row, description: event.target.value };
                      setRows(next);
                    }}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">{statusLabels[row.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
