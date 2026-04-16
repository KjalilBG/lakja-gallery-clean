import { CoberturaStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const MEXICO_TZ = "America/Mexico_City";

type CoverageCalendarPayload = {
  id: string;
  nombre: string;
  fecha: Date;
  horaInicio: string;
  duracion: number;
  comentarios: string | null;
  estatus: CoberturaStatus;
  calendarEventId: string | null;
  lugar: { nombre: string } | null;
  campus: { nombre: string } | null;
  seccion: { nombre: string } | null;
  staffAssignments: Array<{
    user: {
      email: string;
      name: string | null;
      role: "ADMIN" | "STAFF";
    };
  }>;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function localDateTimeString(date: Date, time: string) {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  return `${year}-${month}-${day}T${time}:00`;
}

function addMinutes(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const safe = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
}

async function getGoogleAccessToken() {
  const account = await prisma.account.findFirst({
    where: {
      provider: "google",
      user: {
        role: "ADMIN",
        isActive: true
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (!account?.refresh_token) {
    throw new Error("Admin Google no conectado con permisos de Calendar.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: account.refresh_token
    })
  });

  if (!response.ok) {
    throw new Error("No pude refrescar token de Google Calendar.");
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new Error("Google Calendar no devolvió access token.");
  }

  await prisma.account.update({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId
      }
    },
    data: {
      access_token: payload.access_token,
      expires_at: payload.expires_in ? Math.floor(Date.now() / 1000) + payload.expires_in : account.expires_at
    }
  });

  return payload.access_token;
}

function buildCalendarEvent(coverage: CoverageCalendarPayload) {
  const staffNames = coverage.staffAssignments.map((item) => item.user.name ?? item.user.email);
  const attendeeEmails = Array.from(new Set(coverage.staffAssignments.map((item) => item.user.email).filter(Boolean)));
  const endTime = addMinutes(coverage.horaInicio, coverage.duracion);
  const location = [coverage.lugar?.nombre, coverage.campus?.nombre].filter(Boolean).join(" · ");
  const section = coverage.seccion?.nombre ?? "Sin sección";

  return {
    summary: `${coverage.nombre} | Cubre: ${staffNames.join(", ") || "Sin staff"}`,
    description: [coverage.comentarios?.trim(), `CCC · ${section}`].filter(Boolean).join("\n\n"),
    location: location || undefined,
    start: {
      dateTime: localDateTimeString(coverage.fecha, coverage.horaInicio),
      timeZone: MEXICO_TZ
    },
    end: {
      dateTime: localDateTimeString(coverage.fecha, endTime),
      timeZone: MEXICO_TZ
    },
    attendees: attendeeEmails.map((email) => ({ email })),
    guestsCanModify: false,
    reminders: {
      useDefault: true
    }
  };
}

async function calendarFetch(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown) {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Fallo Google Calendar.");
  }

  if (method === "DELETE") {
    return null;
  }

  return (await response.json()) as { id?: string; htmlLink?: string };
}

export async function syncCoverageCalendar(coverageId: string) {
  const coverage = await prisma.cobertura.findUnique({
    where: { id: coverageId },
    include: {
      lugar: { select: { nombre: true } },
      campus: { select: { nombre: true } },
      seccion: { select: { nombre: true } },
      staffAssignments: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
              role: true
            }
          }
        }
      }
    }
  });

  if (!coverage) {
    return;
  }

  try {
    if (coverage.estatus === CoberturaStatus.CANCELADO && coverage.calendarEventId) {
      await calendarFetch(`${GOOGLE_CALENDAR_API}/${coverage.calendarEventId}`, "DELETE");
      await prisma.cobertura.update({
        where: { id: coverageId },
        data: {
          calendarEventId: null,
          calendarHtmlLink: null,
          calendarSyncError: null
        }
      });
      return;
    }

    if (coverage.estatus !== CoberturaStatus.AGENDADO || coverage.staffAssignments.length === 0) {
      return;
    }

    const activeAdmins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { email: true }
    });
    const eventPayload = buildCalendarEvent(coverage);
    eventPayload.attendees = Array.from(
      new Set([...(eventPayload.attendees ?? []).map((item) => item.email), ...activeAdmins.map((admin) => admin.email)])
    )
      .filter(Boolean)
      .map((email) => ({ email }));
    const result = coverage.calendarEventId
      ? await calendarFetch(`${GOOGLE_CALENDAR_API}/${coverage.calendarEventId}?sendUpdates=all`, "PUT", eventPayload)
      : await calendarFetch(`${GOOGLE_CALENDAR_API}?sendUpdates=all`, "POST", eventPayload);

    await prisma.cobertura.update({
      where: { id: coverageId },
      data: {
        calendarEventId: result?.id ?? coverage.calendarEventId,
        calendarHtmlLink: result?.htmlLink ?? null,
        calendarSyncError: null
      }
    });
  } catch (error) {
    await prisma.cobertura.update({
      where: { id: coverageId },
      data: {
        calendarSyncError: error instanceof Error ? error.message.slice(0, 300) : "Error de calendario"
      }
    });
  }
}
