import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { getMontajeItemPhotoPath } from "@/lib/montajes/queries";
import { canAccessMontajeItemPhoto } from "@/lib/montajes/photo-auth";
import { MONTAJES_UPLOADS_DIR, PHOTO_CONTENT_TYPE_BY_EXT } from "@/lib/uploads";

const paramsSchema = z.object({ itemId: z.string().uuid() });

// Se sirve por id de ítem, no por un path libre: la ruta real en disco sale de la base
// de datos, nunca de lo que mande el cliente — así no hace falta sanitizar path traversal.
// Acepta sesión O el token del enlace público (?token=...), para que el técnico vea a
// dónde va el sensor sin necesitar cuenta.
export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return new Response("No encontrado", { status: 404 });

  const canAccess = await canAccessMontajeItemPhoto(request, parsed.data.itemId);
  if (!canAccess) return new Response("No autorizado", { status: 401 });

  const photoPath = await getMontajeItemPhotoPath(parsed.data.itemId);
  if (!photoPath) return new Response("No encontrado", { status: 404 });

  const ext = photoPath.split(".").pop() ?? "";
  const contentType = PHOTO_CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) return new Response("No encontrado", { status: 404 });

  const buffer = await readFile(path.join(MONTAJES_UPLOADS_DIR, photoPath));
  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      // NO "immutable"/max-age largo: desde que existe updateMontajeItemAction, la foto
      // de un ítem SÍ puede reemplazarse manteniendo la misma URL (mismo itemId) — con
      // cache larga, el navegador seguía mostrando la versión vieja después de editarla.
      // Mismo criterio que ya usa la ruta de manuales de Sensor, que tiene el mismo caso.
      "Cache-Control": "private, no-store",
    },
  });
}
