"use server";

import { z } from "zod";
import { isItemAccessibleByToken } from "@/lib/montajes/queries";
import {
  removeInstalledPhotoCore,
  setItemInstalledCore,
  uploadInstalledPhotoCore,
  type InstallActionResult,
} from "@/lib/montajes/install-core";

// Puerta de entrada pública (sin auth() a propósito): el técnico entra desde un enlace
// de WhatsApp sin cuenta. La lógica real vive en install-core.ts, compartida con la
// acción autenticada de Gestión — acá solo se valida que el ítem sea del montaje dueño
// de ESE token, no de otro.
const setInstalledPublicSchema = z.object({
  token: z.string().min(1, "Enlace inválido"),
  id: z.string().uuid("Id inválido"),
  installed: z.enum(["1", "0"]),
});

export async function setMontajeItemInstalledPublicAction(
  _prev: InstallActionResult | undefined,
  formData: FormData,
): Promise<InstallActionResult> {
  const parsed = setInstalledPublicSchema.safeParse({
    token: formData.get("token"),
    id: formData.get("id"),
    installed: formData.get("installed"),
  });
  if (!parsed.success) return { error: "Datos inválidos" };

  const ok = await isItemAccessibleByToken(parsed.data.id, parsed.data.token);
  if (!ok) return { error: "Enlace inválido" };

  return setItemInstalledCore(parsed.data.id, parsed.data.installed === "1");
}

const uploadPhotoPublicSchema = z.object({
  token: z.string().min(1, "Enlace inválido"),
  id: z.string().uuid("Id inválido"),
});

export async function uploadInstalledPhotoPublicAction(
  _prev: InstallActionResult | undefined,
  formData: FormData,
): Promise<InstallActionResult> {
  const parsed = uploadPhotoPublicSchema.safeParse({
    token: formData.get("token"),
    id: formData.get("id"),
  });
  if (!parsed.success) return { error: "Datos inválidos" };

  const ok = await isItemAccessibleByToken(parsed.data.id, parsed.data.token);
  if (!ok) return { error: "Enlace inválido" };

  const photo = formData.get("photo");
  if (!(photo instanceof File)) return { error: "Selecciona una foto" };

  return uploadInstalledPhotoCore(parsed.data.id, photo);
}

const removePhotoPublicSchema = z.object({
  token: z.string().min(1, "Enlace inválido"),
  id: z.string().uuid("Id inválido"),
});

export async function removeInstalledPhotoPublicAction(
  _prev: InstallActionResult | undefined,
  formData: FormData,
): Promise<InstallActionResult> {
  const parsed = removePhotoPublicSchema.safeParse({
    token: formData.get("token"),
    id: formData.get("id"),
  });
  if (!parsed.success) return { error: "Datos inválidos" };

  const ok = await isItemAccessibleByToken(parsed.data.id, parsed.data.token);
  if (!ok) return { error: "Enlace inválido" };

  return removeInstalledPhotoCore(parsed.data.id);
}
