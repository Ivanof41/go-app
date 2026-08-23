"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { accessories, brands, providers, sensorAccessories, sensors, sensorStock, technologies } from "@/db/schema";
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

export async function createAccessoryAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: accessories.id })
    .from(accessories)
    .where(eq(accessories.name, parsed.data.name));
  if (existing) return { error: "Ya existe un accesorio con ese nombre" };

  const [row] = await db
    .insert(accessories)
    .values({ name: parsed.data.name })
    .returning({ id: accessories.id, name: accessories.name });

  revalidatePath("/inventario/sensores");
  return { success: "Accesorio creado", id: row.id, name: row.name };
}

// Marca/Tecnología/Proveedor/precios son opcionales: solo nombre + tipo son
// obligatorios para crear un sensor. Un <select> sin elegir nada llega como "" en el
// FormData, así que se normaliza a null antes de validar el formato real (uuid/número).
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const optionalUuid = z.preprocess(emptyToNull, z.string().uuid("Selección inválida").nullable());
const optionalPrice = z.preprocess(
  emptyToNull,
  z.union([z.coerce.number().positive("El precio debe ser mayor a 0"), z.null()]),
);

// accessoriesJson: único caso de serialización JSON cliente→servidor en el proyecto —
// una lista de largo variable {accessoryId, quantity} no entra cómodo en FormData plano,
// y esto evita reconstruir un array desde claves indexadas a mano. Excepción deliberada,
// no un patrón a repetir sin necesidad real de una lista variable como esta.
const accessoryLinkSchema = z.object({
  accessoryId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(999),
});
const accessoriesJsonSchema = z.preprocess((v) => {
  if (typeof v !== "string") return [];
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}, z.array(accessoryLinkSchema).max(50));

const sensorSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(200),
  type: z.enum(SENSOR_TYPE_VALUES, { message: "Selecciona un tipo de sensor" }),
  brandId: optionalUuid,
  technologyId: optionalUuid,
  providerId: optionalUuid,
  purchasePrice: optionalPrice,
  salePrice: optionalPrice,
  notes: z.string().trim().max(1000).optional(),
  accessories: accessoriesJsonSchema,
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
    accessories: formData.get("accessoriesJson"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { accessories: accessoryLinks, ...values } = parsed.data;

  await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(sensors)
      .values({ ...values, notes: values.notes ?? null })
      .returning({ id: sensors.id });
    if (accessoryLinks.length > 0) {
      await tx
        .insert(sensorAccessories)
        .values(accessoryLinks.map((a) => ({ sensorId: row.id, accessoryId: a.accessoryId, quantity: a.quantity })));
    }
  });

  revalidatePath("/inventario/sensores");
  redirect("/inventario/sensores");
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
    accessories: formData.get("accessoriesJson"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { id, accessories: accessoryLinks, ...values } = parsed.data;

  // Reemplaza el set entero de accesorios en vez de diffear altas/bajas/cambios de
  // cantidad — la lista es chica (tope 50), así que no vale la pena la complejidad de
  // diffear. Se pierde el id/createdAt propio de cada línea en cada edición; sin
  // impacto hoy porque nada los muestra ni referencia.
  await db.transaction(async (tx) => {
    await tx
      .update(sensors)
      .set({ ...values, notes: values.notes ?? null, updatedAt: new Date() })
      .where(eq(sensors.id, id));
    await tx.delete(sensorAccessories).where(eq(sensorAccessories.sensorId, id));
    if (accessoryLinks.length > 0) {
      await tx
        .insert(sensorAccessories)
        .values(accessoryLinks.map((a) => ({ sensorId: id, accessoryId: a.accessoryId, quantity: a.quantity })));
    }
  });

  revalidatePath("/inventario/sensores");
  redirect("/inventario/sensores");
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
