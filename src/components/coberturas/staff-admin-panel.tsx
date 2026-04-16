"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createStaffMemberAction, deleteStaffMemberAction, resetStaffAccessCodeAction, updateStaffMemberAction } from "@/app/ccc/staff/actions";

type StaffItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  accessConfigured?: boolean;
  assignments: number;
  notes: number;
  hasHonorario: boolean;
};

type StaffAdminPanelProps = {
  staff: StaffItem[];
};

export function StaffAdminPanel({ staff }: StaffAdminPanelProps) {
  const router = useRouter();
  const [items, setItems] = useState(staff);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState({ name: "", email: "", role: "STAFF" });
  const [accessMessage, setAccessMessage] = useState("");

  function refreshSoon() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function createStaff() {
    if (!creating.name.trim() || !creating.email.trim()) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: StaffItem = {
      id: tempId,
      name: creating.name,
      email: creating.email,
      role: creating.role,
      isActive: true,
      accessConfigured: false,
      assignments: 0,
      notes: 0,
      hasHonorario: false
    };

    setItems((current) => [optimistic, ...current]);
    const previous = creating;
    setCreating({ name: "", email: "", role: "STAFF" });

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", previous.name);
        formData.set("email", previous.email);
        formData.set("role", previous.role);
        const created = await createStaffMemberAction(formData);
        setItems((current) =>
          current.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  id: created.id,
                  name: created.name,
                  email: created.email,
                  role: created.role,
                  isActive: created.isActive,
                  accessConfigured: true
                }
              : item
          )
        );
        setAccessMessage(`Código de ${created.name}: ${created.accessCode}`);
      } catch {
        setItems((current) => current.filter((item) => item.id !== tempId));
        setCreating(previous);
      } finally {
        refreshSoon();
      }
    });
  }

  function updateField(id: string, patch: Partial<StaffItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function saveStaff(item: StaffItem) {
    const previous = items;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", item.id);
        formData.set("name", item.name);
        formData.set("email", item.email);
        formData.set("role", item.role);
        if (item.isActive) {
          formData.set("isActive", "on");
        }
        const updated = await updateStaffMemberAction(formData);
        setItems((current) =>
          current.map((currentItem) =>
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  name: updated.id === item.id ? updated.name : currentItem.name,
                  email: updated.id === item.id ? updated.email : currentItem.email,
                  role: updated.id === item.id ? updated.role : currentItem.role,
                  isActive: updated.id === item.id ? updated.isActive : currentItem.isActive,
                  accessConfigured: true
                }
              : currentItem
          )
        );
      } catch {
        setItems(previous);
      } finally {
        refreshSoon();
      }
    });
  }

  function resetAccess(item: StaffItem) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", item.id);
      const result = await resetStaffAccessCodeAction(formData);
      updateField(item.id, { isActive: result.isActive, accessConfigured: true });
      setAccessMessage(`Nuevo código de ${item.name}: ${result.accessCode}`);
      refreshSoon();
    });
  }

  function deleteStaff(item: StaffItem) {
    const previous = items;
    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", item.id);
        const result = await deleteStaffMemberAction(formData);
        if (!result.deleted) {
          setItems((current) => [{ ...item, isActive: false }, ...current]);
        }
      } catch {
        setItems(previous);
      } finally {
        refreshSoon();
      }
    });
  }

  return (
    <div className="space-y-3">
      <details open className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-slate-900 dark:text-white">Nuevo staff</summary>
        <div className="grid gap-3 border-t border-slate-200 px-4 py-4 md:grid-cols-[1fr_1fr_150px_140px] dark:border-slate-800">
          <input value={creating.name} onChange={(event) => setCreating((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
          <input value={creating.email} onChange={(event) => setCreating((current) => ({ ...current, email: event.target.value }))} placeholder="correo@dominio.com" className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
          <select value={creating.role} onChange={(event) => setCreating((current) => ({ ...current, role: event.target.value }))} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80">
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="button" onClick={createStaff} disabled={isPending} className="rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Crear</button>
        </div>
        {accessMessage ? <div className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-lime-700 dark:border-slate-800 dark:text-lime-300">{accessMessage}</div> : null}
      </details>

      <details open className="rounded-[20px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-slate-900 dark:text-white">Equipo</summary>
        <div className="border-t border-slate-200 dark:border-slate-800">
          {items.map((person) => (
            <div key={person.id} className="grid gap-3 border-t border-slate-100 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_130px_90px_auto_auto] md:items-center dark:border-slate-800">
              <input value={person.name} onChange={(event) => updateField(person.id, { name: event.target.value })} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <input value={person.email} onChange={(event) => updateField(person.id, { email: event.target.value })} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80" />
              <select value={person.role} onChange={(event) => updateField(person.id, { role: event.target.value })} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/80">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={person.isActive} onChange={(event) => updateField(person.id, { isActive: event.target.checked })} />
                Activo
              </label>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span>{person.assignments} cob.</span>
                <span>{person.notes} notas</span>
                <span>{person.hasHonorario ? "Honorario" : "Sin honorario"}</span>
                <span>{person.accessConfigured ? "Código listo" : "Sin código"}</span>
              </div>
              <div className="flex gap-2">
                <a href={`/ccc/staff?as=${person.id}`} className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/12 dark:text-sky-300">Ver vista</a>
                <button type="button" onClick={() => resetAccess(person)} disabled={isPending} className="rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-sm font-semibold text-lime-700 disabled:opacity-50 dark:border-lime-500/30 dark:bg-lime-500/12 dark:text-lime-300">Código</button>
                <button type="button" onClick={() => saveStaff(person)} disabled={isPending} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900">Guardar</button>
                <button type="button" onClick={() => deleteStaff(person)} disabled={isPending} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-300">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
