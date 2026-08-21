"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isValidAvatarDataUrl } from "@/lib/avatar";

export type ActionState = { error?: string; success?: string } | undefined;

const profileSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(150),
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email));
  if (existing && existing.id !== session.user.id) return { error: "Ese email ya está en uso" };

  await db
    .update(users)
    .set({ name: parsed.data.name, email: parsed.data.email, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  revalidatePath("/", "layout");
  return { success: "Perfil actualizado" };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Requerida"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!user) return { error: "Usuario no encontrado" };

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "La contraseña actual es incorrecta" };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: "Contraseña actualizada" };
}

const avatarSchema = z.object({ avatar: z.string().refine(isValidAvatarDataUrl, "Imagen inválida") });

export async function updateAvatarAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = avatarSchema.safeParse({ avatar: formData.get("avatar") });
  if (!parsed.success) return { error: "No se pudo procesar la imagen" };

  await db
    .update(users)
    .set({ avatar: parsed.data.avatar, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  revalidatePath("/", "layout");
  return { success: "Foto actualizada" };
}
