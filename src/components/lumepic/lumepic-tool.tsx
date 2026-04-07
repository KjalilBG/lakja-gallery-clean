"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { ChevronDown, Link2, Save, Search, Settings2 } from "lucide-react";

import { LumepicResultCard } from "@/components/lumepic/lumepic-result-card";
import { Button } from "@/components/ui/button";
import type { LumepicCheckResult, LumepicStoredConfig } from "@/lib/lumepic/types";

type LumepicToolProps = {
  initialConfig: LumepicStoredConfig;
  initialUpdatedAt: string | null;
};

type SaveConfigResponse = {
  ok: boolean;
  error?: string;
  config?: LumepicStoredConfig & { updatedAt: string | null };
};

function isFilledActiveEvent(event: LumepicStoredConfig["activeEvents"][number]) {
  return event.name.trim().length > 0 && event.eventUrl.trim().length > 0;
}

export function LumepicTool({ initialConfig, initialUpdatedAt }: LumepicToolProps) {
  const [config, setConfig] = useState<LumepicStoredConfig>(initialConfig);
  const [savedAt, setSavedAt] = useState<string | null>(initialUpdatedAt);
  const [eventId, setEventId] = useState("");
  const [bibNumber, setBibNumber] = useState("");
  const [result, setResult] = useState<LumepicCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configMessage, setConfigMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const activeEvents = useMemo(() => config.activeEvents.filter(isFilledActiveEvent), [config.activeEvents]);

  useEffect(() => {
    if (!eventId && activeEvents.length > 0) {
      setEventId(activeEvents[0].id);
      return;
    }

    if (eventId && !activeEvents.some((event) => event.id === eventId)) {
      setEventId(activeEvents[0]?.id ?? "");
    }
  }, [activeEvents, eventId]);

  function updateActiveEvent(id: string, field: "name" | "eventUrl" | "selfieUrl", value: string) {
    setConfig((currentConfig) => ({
      ...currentConfig,
      activeEvents: currentConfig.activeEvents.map((currentEvent) =>
        currentEvent.id === id ? { ...currentEvent, [field]: value } : currentEvent
      )
    }));
    setConfigError(null);
    setConfigMessage(null);
  }

  function updateMessageTemplate(group: "successMessageTemplates" | "noPhotosMessageTemplates", index: number, value: string) {
    setConfig((currentConfig) => ({
      ...currentConfig,
      [group]: currentConfig[group].map((currentTemplate, currentIndex) => (currentIndex === index ? value : currentTemplate))
    }));
    setConfigError(null);
    setConfigMessage(null);
  }

  function updateInstagramHandle(value: string) {
    setConfig((currentConfig) => ({
      ...currentConfig,
      instagramHandle: value
    }));
    setConfigError(null);
    setConfigMessage(null);
  }

  async function handleSaveConfiguration() {
    const invalidActiveEvent = config.activeEvents.find((event) => {
      const hasAnyValue = event.name.trim().length > 0 || event.eventUrl.trim().length > 0 || event.selfieUrl?.trim().length;
      return hasAnyValue && !isFilledActiveEvent(event);
    });

    if (invalidActiveEvent) {
      setConfigError("Cada evento activo debe tener al menos nombre y link general de Lumepic.");
      setConfigMessage(null);
      return;
    }

    if (!config.instagramHandle.trim()) {
      setConfigError("Agrega el handle de Instagram para los mensajes.");
      setConfigMessage(null);
      return;
    }

    const hasInvalidTemplate = [...config.successMessageTemplates, ...config.noPhotosMessageTemplates].some((template) => !template.trim());
    if (hasInvalidTemplate) {
      setConfigError("Las 6 opciones de mensaje deben tener contenido.");
      setConfigMessage(null);
      return;
    }

    setIsSavingConfig(true);

    try {
      const response = await fetch("/api/lumepic/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });

      const payload = (await response.json()) as SaveConfigResponse;

      if (!response.ok || !payload.ok || !payload.config) {
        setConfigError(payload.error ?? "No se pudo guardar la configuración.");
        setConfigMessage(null);
        return;
      }

      setConfig(payload.config);
      setSavedAt(payload.config.updatedAt);
      setConfigError(null);
      setConfigMessage("Configuración guardada y compartida entre dispositivos.");
    } catch (saveError) {
      setConfigError(saveError instanceof Error ? saveError.message : "No se pudo guardar la configuración.");
      setConfigMessage(null);
    } finally {
      setIsSavingConfig(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedBibNumber = bibNumber.trim();
    if (!eventId) {
      setError("Primero configura y selecciona un evento activo.");
      return;
    }

    if (!/^\d+$/.test(normalizedBibNumber)) {
      setError("Escribe un número de competidor válido usando solo dígitos.");
      return;
    }

    const selectedEvent = activeEvents.find((event) => event.id === eventId);
    if (!selectedEvent) {
      setError("El evento seleccionado ya no está activo.");
      return;
    }

    setError(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/lumepic/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            customEvent: {
              ...selectedEvent,
              selfieUrl: selectedEvent.selfieUrl?.trim() ? selectedEvent.selfieUrl.trim() : undefined,
              instagramHandle: config.instagramHandle.trim(),
              successMessageTemplates: config.successMessageTemplates,
              noPhotosMessageTemplates: config.noPhotosMessageTemplates
            },
            bibNumber: normalizedBibNumber
          })
        });

        const payload = (await response.json()) as LumepicCheckResult;

        if (!response.ok) {
          setResult(payload);
          setError(payload.reason);
          return;
        }

        setResult(payload);
      } catch (requestError) {
        setResult(null);
        setError(requestError instanceof Error ? requestError.message : "No se pudo consultar Lumepic.");
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-slate-400">Herramienta interna</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Lumepic por número</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Consulta un número de competidor, valida si sí hay fotos visibles y obtén el mensaje listo para copiar o abrir en WhatsApp.
          </p>
        </div>

        <form className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Evento activo</span>
            <select
              value={eventId}
              onChange={(currentEvent) => setEventId(currentEvent.target.value)}
              className="h-14 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-400"
            >
              {activeEvents.length === 0 ? <option value="">Configura tus eventos activos</option> : null}
              {activeEvents.map((activeEvent) => (
                <option key={activeEvent.id} value={activeEvent.id}>
                  {activeEvent.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Número de competidor</span>
            <input
              value={bibNumber}
              onChange={(currentBib) => setBibNumber(currentBib.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Ej. 248"
              className="h-14 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-400"
            />
          </label>

          <div className="flex items-end">
            <Button type="submit" className="h-14 w-full px-6" disabled={isPending || activeEvents.length === 0}>
              <Search className="mr-2 size-4" />
              Buscar
            </Button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
        ) : null}
      </section>

      <LumepicResultCard result={result} isPending={isPending} />

      <details className="group rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Settings2 className="size-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">Configuración</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Eventos activos y mensajes</h2>
            </div>
          </div>
          <ChevronDown className="size-5 text-slate-400 transition group-open:rotate-180" />
        </summary>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Eventos activos</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Aquí defines los 3 eventos que estás revisando ahorita. Esta configuración ya queda compartida entre dispositivos.
            </p>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              {config.activeEvents.map((activeEvent, index) => (
                <div key={activeEvent.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Activo {index + 1}</p>
                  <div className="mt-3 space-y-3">
                    <input
                      value={activeEvent.name}
                      onChange={(event) => updateActiveEvent(activeEvent.id, "name", event.target.value)}
                      placeholder="Nombre del evento"
                      className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-400"
                    />
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={activeEvent.eventUrl}
                        onChange={(event) => updateActiveEvent(activeEvent.id, "eventUrl", event.target.value)}
                        placeholder="https://www.lumepic.com/es/events/..."
                        className="h-12 w-full rounded-[18px] border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-400"
                      />
                    </div>
                    <input
                      value={activeEvent.selfieUrl ?? ""}
                      onChange={(event) => updateActiveEvent(activeEvent.id, "selfieUrl", event.target.value)}
                      placeholder="Link selfie opcional"
                      className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.36fr_1fr_1fr]">
            <label className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Instagram</span>
              <input
                value={config.instagramHandle}
                onChange={(event) => updateInstagramHandle(event.target.value)}
                placeholder="@LaKja.top"
                className="h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-lime-400"
              />
            </label>

            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">3 mensajes si sí hay fotos</span>
              {config.successMessageTemplates.map((template, index) => (
                <textarea
                  key={`success-template-${index}`}
                  value={template}
                  onChange={(event) => updateMessageTemplate("successMessageTemplates", index, event.target.value)}
                  className="min-h-32 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-lime-400"
                />
              ))}
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">3 mensajes si no hay fotos</span>
              {config.noPhotosMessageTemplates.map((template, index) => (
                <textarea
                  key={`no-photos-template-${index}`}
                  value={template}
                  onChange={(event) => updateMessageTemplate("noPhotosMessageTemplates", index, event.target.value)}
                  className="min-h-32 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-lime-400"
                />
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Variables disponibles: <code>{`{resultUrl}`}</code>, <code>{`{selfieUrl}`}</code>, <code>{`{instagramHandle}`}</code>, <code>{`{bibNumber}`}</code>, <code>{`{eventName}`}</code>
            <div className="mt-2 text-xs font-medium text-slate-500">
              Última actualización compartida: {savedAt ? new Date(savedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "aún no guardada"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={handleSaveConfiguration} disabled={isSavingConfig}>
              <Save className="mr-2 size-4" />
              {isSavingConfig ? "Guardando..." : "Guardar configuración"}
            </Button>
            {configError ? <span className="text-sm font-medium text-rose-700">{configError}</span> : null}
            {configMessage ? <span className="text-sm font-medium text-lime-700">{configMessage}</span> : null}
          </div>
        </div>
      </details>
    </div>
  );
}
