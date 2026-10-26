import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { getMontajeItemInstalledPhotoPath } from "@/lib/montajes/queries";
import { canAccessMontajeItemPhoto } from "@/lib/montajes/photo-auth";
import { MONTAJES_UPLOADS_DIR, PHOTO_CONTENT_TYPE_BY_EXT } from "@/lib/uploads";

const paramsSchema = z.object({ itemId: z.string().uuid() });

// Mismo patrón que la ruta hermana de la foto de referencia (servir por id, nunca por
// path libre) — ruta aparte en vez de un query param en la misma, para no meter lógica
// condicional en un solo handler que sirve dos recursos distintos. Acepta sesión O el
// token del enlace público (?token=...), para que el técnico vea la foto sin login.
export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return new Response("No encontrado", { status: 404 });

  const canAccess = await canAccessMontajeItemPhoto(request, parsed.data.itemId);
  if (!canAccess) return new Response("No autorizado", { status: 401 });

  const photoPath = await getMontajeItemInstalledPhotoPath(parsed.data.itemId);
  if (!photoPath) return new Response("No encontrado", { status: 404 });

  const ext = photoPath.split(".").pop() ?? "";
  const contentType = PHOTO_CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) return new Response("No encontrado", { status: 404 });

  const buffer = await readFile(path.join(MONTAJES_UPLOADS_DIR, photoPath));
  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      // no-store, no immutable: esta foto se puede reemplazar manteniendo la misma URL
      // (mismo itemId) — mismo motivo que la ruta de la foto de referencia.
      "Cache-Control": "private, no-store",
    },
  });
}
