"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands, providers, sensors, technologies } from "@/db/schema";

export type CatalogActionState =
  | { error?: string; success?: string; id?: string; name?: string }
  | undefined;

const nameSchema = z.object({ name: z.string().trim().min(2, "Mínimo 2 caracteres").max(150) });
const updateSchema = nameSchema.extend({ id: z.string().uuid("Id inválido") });
const idSchema = z.object({ id: z.string().uuid("Id inválido") });

// ---------------------------------------------------------------------- Marcas

export async function createBrandAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db.select({ id: brands.id }).from(brands).where(eq(brands.name, parsed.data.name));
  if (existing) return { error: "Ya existe una marca con ese nombre" };

  const [row] = await db
    .insert(brands)
    .values({ name: parsed.data.name })
    .returning({ id: brands.id, name: brands.name });

  revalidatePath("/inventario/catalogo");
  revalidatePath("/inventario/sensores");
  return { success: "Marca creada", id: row.id, name: row.name };
}

export async function updateBrandAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = updateSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.name, parsed.data.name), ne(brands.id, parsed.data.id)));
  if (existing) return { error: "Ya existe una marca con ese nombre" };

  await db
    .update(brands)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(brands.id, parsed.data.id));

  revalidatePath("/inventario/catalogo");
  revalidatePath("/inventario/sensores");
  return { success: "Marca actualizada" };
}

export async function deleteBrandAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [{ value: usageCount }] = await db
    .select({ value: count() })
    .from(sensors)
    .where(eq(sensors.brandId, parsed.data.id));
  if (usageCount > 0) return { error: `No se puede eliminar: ${usageCount} sensor(es) usan esta marca` };

  await db.delete(brands).where(eq(brands.id, parsed.data.id));

  revalidatePath("/inventario/catalogo");
  return { success: "Marca eliminada" };
}

// ---------------------------------------------------------------- Tecnologías

export async function createTechnologyAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: technologies.id })
    .from(technologies)
    .where(eq(technologies.name, parsed.data.name));
  if (existing) return { error: "Ya existe una tecnología con ese nombre" };

  const [row] = await db
    .insert(technologies)
    .values({ name: parsed.data.name })
    .returning({ id: technologies.id, name: technologies.name });

  revalidatePath("/inventario/catalogo");
  revalidatePath("/inventario/sensores");
  return { success: "Tecnología creada", id: row.id, name: row.name };
}

export async function updateTechnologyAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = updateSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: technologies.id })
    .from(technologies)
    .where(and(eq(technologies.name, parsed.data.name), ne(technologies.id, parsed.data.id)));
  if (existing) return { error: "Ya existe una tecnología con ese nombre" };

  await db
    .update(technologies)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(technologies.id, parsed.data.id));

  revalidatePath("/inventario/catalogo");
  revalidatePath("/inventario/sensores");
  return { success: "Tecnología actualizada" };
}

export async function deleteTechnologyAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [{ value: usageCount }] = await db
    .select({ value: count() })
    .from(sensors)
    .where(eq(sensors.technologyId, parsed.data.id));
  if (usageCount > 0)
    return { error: `No se puede eliminar: ${usageCount} sensor(es) usan esta tecnología` };

  await db.delete(technologies).where(eq(technologies.id, parsed.data.id));

  revalidatePath("/inventario/catalogo");
  return { success: "Tecnología eliminada" };
}

// ---------------------------------------------------------------- Proveedores

export async function createProviderAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.name, parsed.data.name));
  if (existing) return { error: "Ya existe un proveedor con ese nombre" };

  const [row] = await db
    .insert(providers)
    .values({ name: parsed.data.name })
    .returning({ id: providers.id, name: providers.name });

  revalidatePath("/inventario/catalogo");
  revalidatePath("/inventario/sensores");
  return { success: "Proveedor creado", id: row.id, name: row.name };
}

export async function updateProviderAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = updateSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(and(eq(providers.name, parsed.data.name), ne(providers.id, parsed.data.id)));
  if (existing) return { error: "Ya existe un proveedor con ese nombre" };

  await db
    .update(providers)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(providers.id, parsed.data.id));

  revalidatePath("/inventario/catalogo");
  revalidatePath("/inventario/sensores");
  return { success: "Proveedor actualizado" };
}

export async function deleteProviderAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [{ value: usageCount }] = await db
    .select({ value: count() })
    .from(sensors)
    .where(eq(sensors.providerId, parsed.data.id));
  if (usageCount > 0)
    return { error: `No se puede eliminar: ${usageCount} sensor(es) usan este proveedor` };

  await db.delete(providers).where(eq(providers.id, parsed.data.id));

  revalidatePath("/inventario/catalogo");
  return { success: "Proveedor eliminado" };
}
