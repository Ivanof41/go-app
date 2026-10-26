import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sensors } from "@/db/schema";
import { MANUAL_CONTENT_TYPE_BY_EXT, SENSOR_MANUALS_DIR } from "@/lib/uploads";
import { canAccessSensorManual } from "@/lib/montajes/manual-auth";

const paramsSchema = z.object({ sensorId: z.string().uuid() });

// Se sirve por id de sensor, no por un path libre — mismo criterio que la ruta de
// fotos de Montajes: la ruta real en disco sale de la base de datos, nunca de lo que
// mande el cliente.
export async function GET(request: Request, { params }: { params: Promise<{ sensorId: string }> }) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return new Response("No encontrado", { status: 404 });

  const canAccess = await canAccessSensorManual(request, parsed.data.sensorId);
  if (!canAccess) return new Response("No autorizado", { status: 401 });

  const [row] = await db
    .select({ manualPath: sensors.manualPath })
    .from(sensors)
    .where(eq(sensors.id, parsed.data.sensorId));
  if (!row?.manualPath) return new Response("No encontrado", { status: 404 });

  const ext = row.manualPath.split(".").pop() ?? "";
  const contentType = MANUAL_CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) return new Response("No encontrado", { status: 404 });

  const buffer = await readFile(path.join(SENSOR_MANUALS_DIR, row.manualPath));
  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      // inline (no attachment): se abre en el navegador para que el técnico lo consulte
      // rápido, no fuerza una descarga.
      "Content-Disposition": "inline",
      // A diferencia de la foto de un ítem de montaje, un manual sí puede reemplazarse
      // (ver updateSensorAction) — cache corta, no immutable. Como cada reemplazo genera
      // un nombre de archivo nuevo (randomUUID), ni siquiera hay riesgo real de servir
      // una versión vieja bajo la misma URL.
      "Cache-Control": "private, max-age=300",
    },
  });
}
