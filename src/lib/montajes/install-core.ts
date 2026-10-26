import { eq } from "drizzle-orm";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { montajeItems, montajes } from "@/db/schema";
import { MAX_PHOTO_BYTES, MONTAJES_UPLOADS_DIR, PHOTO_EXT_BY_MIME } from "@/lib/uploads";

export type InstallActionResult = { error?: string; success?: string };

// Núcleo compartido entre la acción autenticada (Gestión, con sesión) y la pública
// (enlace /i/[token] para el técnico, sin sesión) — cada una valida el acceso a su
// manera (sesión vs. token) y después llama a esto mismo, para que la lógica real de
// negocio viva en un solo lugar y no pueda desincronizarse entre las dos puertas de
// entrada.
async function getItemWithMontaje(itemId: string) {
  const [row] = await db
    .select({
      montajeId: montajeItems.montajeId,
      installedAt: montajeItems.installedAt,
      installedPhotoPath: montajeItems.installedPhotoPath,
      startedAt: montajes.startedAt,
      installToken: montajes.installToken,
    })
    .from(montajeItems)
    .innerJoin(montajes, eq(montajes.id, montajeItems.montajeId))
    .where(eq(montajeItems.id, itemId));
  return row ?? null;
}

function revalidateInstallPaths(montajeId: string, installToken: string | null) {
  revalidatePath(`/montajes/${montajeId}/instalacion`);
  revalidatePath("/montajes");
  if (installToken) revalidatePath(`/i/${installToken}`);
}

export async function setItemInstalledCore(itemId: string, installed: boolean): Promise<InstallActionResult> {
  const existing = await getItemWithMontaje(itemId);
  if (!existing) return { error: "Ítem no encontrado" };
  // No tiene sentido marcar instalado en campo algo que nunca salió de la oficina — el
  // descuento de inventario pasa al iniciar, no acá.
  if (!existing.startedAt) return { error: "Este montaje todavía no se inició" };

  // Si ya estaba instalado y se vuelve a marcar como instalado, conserva el timestamp
  // original en vez de pisarlo — evita que reabrir/cerrar sin querer borre cuándo se
  // instaló de verdad.
  const installedAt = installed ? (existing.installedAt ?? new Date()) : null;
  await db.update(montajeItems).set({ installedAt, updatedAt: new Date() }).where(eq(montajeItems.id, itemId));

  revalidateInstallPaths(existing.montajeId, existing.installToken);
  return { success: installedAt ? "Sensor marcado como instalado" : "Sensor marcado como pendiente" };
}

export async function uploadInstalledPhotoCore(itemId: string, photo: File): Promise<InstallActionResult> {
  if (photo.size === 0) return { error: "Selecciona una foto" };
  if (photo.size > MAX_PHOTO_BYTES) return { error: "La imagen no puede superar 10 MB" };
  const ext = PHOTO_EXT_BY_MIME[photo.type];
  if (!ext) return { error: "Formato de imagen no soportado (usa JPG, PNG o WebP)" };

  const existing = await getItemWithMontaje(itemId);
  if (!existing) return { error: "Ítem no encontrado" };
  if (!existing.startedAt) return { error: "Este montaje todavía no se inició" };

  const relativePath = `${existing.montajeId}/${itemId}-instalado.${ext}`;
  await mkdir(path.join(MONTAJES_UPLOADS_DIR, existing.montajeId), { recursive: true });
  await writeFile(path.join(MONTAJES_UPLOADS_DIR, relativePath), Buffer.from(await photo.arrayBuffer()));
  if (existing.installedPhotoPath && existing.installedPhotoPath !== relativePath) {
    await rm(path.join(MONTAJES_UPLOADS_DIR, existing.installedPhotoPath), { force: true }).catch((err) => {
      console.error("No se pudo borrar la foto de instalación anterior", existing.installedPhotoPath, err);
    });
  }

  await db
    .update(montajeItems)
    .set({
      installedPhotoPath: relativePath,
      // Adjuntar una foto de instalación implica que ya está instalado — sin esto,
      // alguien podría subir la prueba y olvidarse de tildar el check aparte.
      installedAt: existing.installedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(montajeItems.id, itemId));

  revalidateInstallPaths(existing.montajeId, existing.installToken);
  return { success: "Foto de instalación guardada" };
}

export async function removeInstalledPhotoCore(itemId: string): Promise<InstallActionResult> {
  const existing = await getItemWithMontaje(itemId);
  if (!existing) return { error: "Ítem no encontrado" };
  if (!existing.installedPhotoPath) return { success: "No había foto para quitar" };

  await rm(path.join(MONTAJES_UPLOADS_DIR, existing.installedPhotoPath), { force: true }).catch((err) => {
    console.error("No se pudo borrar el archivo de la foto de instalación", existing.installedPhotoPath, err);
  });

  // installedAt no se toca: quitar la foto no tiene por qué desmarcar el sensor como
  // instalado — son dos confirmaciones independientes (el check y la foto de prueba).
  await db
    .update(montajeItems)
    .set({ installedPhotoPath: null, updatedAt: new Date() })
    .where(eq(montajeItems.id, itemId));

  revalidateInstallPaths(existing.montajeId, existing.installToken);
  return { success: "Foto de instalación eliminada" };
}
