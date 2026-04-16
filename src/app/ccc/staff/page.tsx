import { StaffWorkspaceClient } from "@/components/coberturas/staff-workspace-client";
import { requireStaffSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getStaffWorkspace } from "@/lib/staff";

export const dynamic = "force-dynamic";

export default async function CCCStaffPage({
  searchParams
}: {
  searchParams?: Promise<{ as?: string }>;
}) {
  const session = await requireStaffSession("/ccc/staff");
  const params = (await searchParams) ?? {};
  const requestedUserId = session.user.role === "ADMIN" && params.as ? params.as : session.user.id;
  const workspace = await getStaffWorkspace(requestedUserId);
  const previewUser =
    session.user.role === "ADMIN" && requestedUserId && requestedUserId !== session.user.id
      ? await prisma.user.findUnique({
          where: { id: requestedUserId },
          select: { id: true, name: true, email: true }
        })
      : null;

  const upcoming = workspace.upcoming.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    fecha: item.fecha.toISOString().slice(0, 10),
    horaInicio: item.horaInicio,
    estatus: item.estatus,
    comentarios: item.comentarios ?? "",
    campusNombre: item.campus?.nombre ?? "Sin campus",
    seccionNombre: item.seccion?.nombre ?? "Sin sección",
    lugarNombre: item.lugar?.nombre ?? "Sin lugar"
  }));

  const history = workspace.history.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    fecha: item.fecha.toISOString().slice(0, 10),
    horaInicio: item.horaInicio,
    estatus: item.estatus,
    comentarios: item.comentarios ?? "",
    campusNombre: item.campus?.nombre ?? "Sin campus",
    seccionNombre: item.seccion?.nombre ?? "Sin sección",
    lugarNombre: item.lugar?.nombre ?? "Sin lugar"
  }));

  return (
    <StaffWorkspaceClient
      initialUpcoming={upcoming}
      initialHistory={history}
      previewUser={previewUser ? { id: previewUser.id, label: previewUser.name ?? previewUser.email } : null}
      readOnly={Boolean(previewUser)}
    />
  );
}
