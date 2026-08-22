"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands, providers, sensors, sensorStock, technologies } from "@/db/schema";
import { SENSOR_TYPE_VALUES } from "@/lib/inventario/sensor-types";

export type ActionState = { error?: string; success?: string } | undefined;

// Estado enriquecido para las acciones de creación rápida de Marca/Tecnología/Proveedor
// desde el propio formulario de sensor (ver EntitySelectField/QuickCreateModal) — necesitan
// devolver el id/name de la entidad recién creada para seleccionarla sin un fetch adicional.
export type CatalogActionState =
  | { error?: string; success?: string; id?: string; name?: string }
  | undefined;
export type CatalogAction = (
  prev: CatalogActionState,
  formData: FormData,
) => Promise<CatalogActionState>;

const nameSchema = z.object({ name: z.string().trim().min(2, "Mínimo 2 caracteres").max(150) });

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

  revalidatePath("/inventario/sensores");
  return { success: "Marca creada", id: row.id, name: row.name };
}

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

  revalidatePath("/inventario/sensores");
  return { success: "Tecnología creada", id: row.id, name: row.name };
}

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

  revalidatePath("/inventario/sensores");
  return { success: "Proveedor creado", id: row.id, name: row.name };
}

const sensorSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(200),
  type: z.enum(SENSOR_TYPE_VALUES, { message: "Selecciona un tipo de sensor" }),
  brandId: z.string().uuid("Selecciona una marca"),
  technologyId: z.string().uuid("Selecciona una tecnología"),
  providerId: z.string().uuid("Selecciona un proveedor"),
  purchasePrice: z.coerce.number().positive("El precio de compra debe ser mayor a 0"),
  salePrice: z.coerce.number().positive("El precio de venta debe ser mayor a 0"),
  notes: z.string().trim().max(1000).optional(),
});

export async function createSensorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = sensorSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    brandId: formData.get("brandId"),
    technologyId: formData.get("technologyId"),
    providerId: formData.get("providerId"),
    purchasePrice: formData.get("purchasePrice"),
    salePrice: formData.get("salePrice"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await db.insert(sensors).values({ ...parsed.data, notes: parsed.data.notes ?? null });

  revalidatePath("/inventario/sensores");
  return { success: "Sensor creado" };
}

const sensorUpdateSchema = sensorSchema.extend({ id: z.string().uuid("Id inválido") });

export async function updateSensorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = sensorUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    brandId: formData.get("brandId"),
    technologyId: formData.get("technologyId"),
    providerId: formData.get("providerId"),
    purchasePrice: formData.get("purchasePrice"),
    salePrice: formData.get("salePrice"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { id, ...values } = parsed.data;
  await db
    .update(sensors)
    .set({ ...values, notes: values.notes ?? null, updatedAt: new Date() })
    .where(eq(sensors.id, id));

  revalidatePath("/inventario/sensores");
  return { success: "Sensor actualizado" };
}

const idSchema = z.object({ id: z.string().uuid("Id inválido") });

export async function deleteSensorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [{ value: stockCount }] = await db
    .select({ value: count() })
    .from(sensorStock)
    .where(eq(sensorStock.sensorId, parsed.data.id));
  if (stockCount > 0) {
    return { error: `No se puede eliminar: hay stock registrado en ${stockCount} zona(s)` };
  }

  await db.delete(sensors).where(eq(sensors.id, parsed.data.id));

  revalidatePath("/inventario/sensores");
  return { success: "Sensor eliminado" };
}
