"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { accessories, brands, providers, sensorAccessories, sensors, sensorStock, technologies } from "@/db/schema";
import { SENSOR_TYPE_VALUES } from "@/lib/inventario/sensor-types";
import { MANUAL_EXT_BY_MIME, MAX_MANUAL_BYTES, SENSOR_MANUALS_DIR } from "@/lib/uploads";
import { MAX_IMPORT_BYTES, parseSensorWorkbook, resolveSensorType } from "@/lib/inventario/sensor-import";

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
const idSchema = z.object({ id: z.string().uuid("Id inválido") });
const updateNameSchema = z.object({
  id: z.string().uuid("Id inválido"),
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(150),
});

// Marca/precios son opcionales en Sensor y Accesorio por igual: nombre + tipo/ícono
// alcanzan para crear cualquiera de los dos, el resto se completa después. Un <select>
// sin elegir nada llega como "" en el FormData, así que se normaliza a null antes de
// validar el formato real (uuid/número).
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const optionalUuid = z.preprocess(emptyToNull, z.string().uuid("Selección inválida").nullable());
const optionalPrice = z.preprocess(
  emptyToNull,
  z.union([z.coerce.number().positive("El precio debe ser mayor a 0"), z.null()]),
);

const accessorySchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(150),
  type: z.enum(SENSOR_TYPE_VALUES, { message: "Selecciona un ícono" }),
  brandId: optionalUuid,
  purchasePrice: optionalPrice,
  salePrice: optionalPrice,
});

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

export async function updateBrandAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = updateNameSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.name, parsed.data.name), ne(brands.id, parsed.data.id)));
  if (existing) return { error: "Ya existe una marca con ese nombre" };

  const [row] = await db
    .update(brands)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(brands.id, parsed.data.id))
    .returning({ id: brands.id, name: brands.name });

  revalidatePath("/inventario/sensores");
  return { success: "Marca actualizada", id: row.id, name: row.name };
}

export async function deleteBrandAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  // Marca es referenciada tanto por Sensor como por Accesorio (ambos con onDelete:
  // "restrict") — hay que contar las dos antes de borrar, o la constraint de Accesorio
  // podría fallar igual aunque no hubiera sensores usando la marca.
  const [[{ value: sensorUsage }], [{ value: accessoryUsage }]] = await Promise.all([
    db.select({ value: count() }).from(sensors).where(eq(sensors.brandId, parsed.data.id)),
    db.select({ value: count() }).from(accessories).where(eq(accessories.brandId, parsed.data.id)),
  ]);
  if (sensorUsage > 0 || accessoryUsage > 0) {
    const parts = [];
    if (sensorUsage > 0) parts.push(`${sensorUsage} sensor(es)`);
    if (accessoryUsage > 0) parts.push(`${accessoryUsage} accesorio(s)`);
    return { error: `No se puede eliminar: usada por ${parts.join(" y ")}` };
  }

  await db.delete(brands).where(eq(brands.id, parsed.data.id));

  revalidatePath("/inventario/sensores");
  return { success: "Marca eliminada" };
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

export async function updateTechnologyAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = updateNameSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: technologies.id })
    .from(technologies)
    .where(and(eq(technologies.name, parsed.data.name), ne(technologies.id, parsed.data.id)));
  if (existing) return { error: "Ya existe una tecnología con ese nombre" };

  const [row] = await db
    .update(technologies)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(technologies.id, parsed.data.id))
    .returning({ id: technologies.id, name: technologies.name });

  revalidatePath("/inventario/sensores");
  return { success: "Tecnología actualizada", id: row.id, name: row.name };
}

export async function deleteTechnologyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [{ value: usageCount }] = await db
    .select({ value: count() })
    .from(sensors)
    .where(eq(sensors.technologyId, parsed.data.id));
  if (usageCount > 0) return { error: `No se puede eliminar: usada por ${usageCount} sensor(es)` };

  await db.delete(technologies).where(eq(technologies.id, parsed.data.id));

  revalidatePath("/inventario/sensores");
  return { success: "Tecnología eliminada" };
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

export async function updateProviderAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = updateNameSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(and(eq(providers.name, parsed.data.name), ne(providers.id, parsed.data.id)));
  if (existing) return { error: "Ya existe un proveedor con ese nombre" };

  const [row] = await db
    .update(providers)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(providers.id, parsed.data.id))
    .returning({ id: providers.id, name: providers.name });

  revalidatePath("/inventario/sensores");
  return { success: "Proveedor actualizado", id: row.id, name: row.name };
}

export async function deleteProviderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [{ value: usageCount }] = await db
    .select({ value: count() })
    .from(sensors)
    .where(eq(sensors.providerId, parsed.data.id));
  if (usageCount > 0) return { error: `No se puede eliminar: usado por ${usageCount} sensor(es)` };

  await db.delete(providers).where(eq(providers.id, parsed.data.id));

  revalidatePath("/inventario/sensores");
  return { success: "Proveedor eliminado" };
}

export async function createAccessoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = accessorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    brandId: formData.get("brandId"),
    purchasePrice: formData.get("purchasePrice"),
    salePrice: formData.get("salePrice"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({ id: accessories.id })
    .from(accessories)
    .where(eq(accessories.name, parsed.data.name));
  if (existing) return { error: "Ya existe un accesorio con ese nombre" };

  await db.insert(accessories).values(parsed.data);

  revalidatePath("/inventario/sensores");
  redirect("/inventario/sensores?tab=accesorios");
}

const accessoryUpdateSchema = accessorySchema.extend({ id: z.string().uuid("Id inválido") });

export async function updateAccessoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = accessoryUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    brandId: formData.get("brandId"),
    purchasePrice: formData.get("purchasePrice"),
    salePrice: formData.get("salePrice"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { id, ...values } = parsed.data;

  const [existing] = await db
    .select({ id: accessories.id })
    .from(accessories)
    .where(and(eq(accessories.name, values.name), ne(accessories.id, id)));
  if (existing) return { error: "Ya existe un accesorio con ese nombre" };

  await db
    .update(accessories)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(accessories.id, id));

  revalidatePath("/inventario/sensores");
  redirect("/inventario/sensores?tab=accesorios");
}

export async function deleteAccessoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [{ value: usageCount }] = await db
    .select({ value: count() })
    .from(sensorAccessories)
    .where(eq(sensorAccessories.accessoryId, parsed.data.id));
  if (usageCount > 0) return { error: `No se puede eliminar: usado en ${usageCount} sensor(es)` };

  await db.delete(accessories).where(eq(accessories.id, parsed.data.id));

  revalidatePath("/inventario/sensores");
  return { success: "Accesorio eliminado" };
}

const sensorSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(200),
  type: z.enum(SENSOR_TYPE_VALUES, { message: "Selecciona un tipo de sensor" }),
  brandId: optionalUuid,
  technologyId: optionalUuid,
  providerId: optionalUuid,
  purchasePrice: optionalPrice,
  salePrice: optionalPrice,
  notes: z.string().trim().max(1000).optional(),
});

// Valida y escribe a disco el PDF del campo "manual" de un FormData, si viene uno
// real (formData.get devuelve un File vacío, no null, cuando el input existe pero
// no se tocó — mismo caso ya cubierto en addMontajeItemAction). Devuelve la ruta
// relativa a guardar en manualPath, o un error para cortar la action.
async function saveManualFile(formData: FormData): Promise<{ path?: string; error?: string }> {
  const manual = formData.get("manual");
  if (!(manual instanceof File) || manual.size === 0) return {};
  if (manual.size > MAX_MANUAL_BYTES) return { error: "El manual no puede superar 20 MB" };
  const ext = MANUAL_EXT_BY_MIME[manual.type];
  if (!ext) return { error: "Formato no soportado (solo PDF)" };

  const relativePath = `${randomUUID()}.${ext}`;
  await mkdir(SENSOR_MANUALS_DIR, { recursive: true });
  await writeFile(path.join(SENSOR_MANUALS_DIR, relativePath), Buffer.from(await manual.arrayBuffer()));
  return { path: relativePath };
}

async function removeManualFile(manualPath: string) {
  await rm(path.join(SENSOR_MANUALS_DIR, manualPath), { force: true }).catch((err) => {
    console.error("No se pudo borrar el manual", manualPath, err);
  });
}

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

  const manual = await saveManualFile(formData);
  if (manual.error) return { error: manual.error };

  await db.insert(sensors).values({ ...parsed.data, notes: parsed.data.notes ?? null, manualPath: manual.path ?? null });

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
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { id, ...values } = parsed.data;

  const [existing] = await db.select({ manualPath: sensors.manualPath }).from(sensors).where(eq(sensors.id, id));
  const manual = await saveManualFile(formData);
  if (manual.error) return { error: manual.error };

  let manualPath = existing?.manualPath ?? null;
  if (manual.path) {
    if (existing?.manualPath) await removeManualFile(existing.manualPath);
    manualPath = manual.path;
  } else if (formData.get("removeManual") === "1" && existing?.manualPath) {
    await removeManualFile(existing.manualPath);
    manualPath = null;
  }

  await db
    .update(sensors)
    .set({ ...values, notes: values.notes ?? null, manualPath, updatedAt: new Date() })
    .where(eq(sensors.id, id));

  revalidatePath("/inventario/sensores");
  redirect("/inventario/sensores");
}

export type ImportSensorsState =
  | {
      error?: string;
      rowErrors?: { row: number; message: string }[];
      created?: number;
      skipped?: { row: number; name: string; reason: string }[];
      newCatalogEntries?: number;
    }
  | undefined;

const importRowSchema = sensorSchema.omit({ brandId: true, technologyId: true, providerId: true }).extend({
  brand: z.string().max(150, "Marca: máximo 150 caracteres"),
  technology: z.string().max(150, "Tecnología: máximo 150 caracteres"),
  provider: z.string().max(150, "Proveedor: máximo 150 caracteres"),
});

// En Excel la gente escribe "45,90", "45.90 €" o deja un número real — se normaliza a
// algo que z.coerce.number entienda antes de validar. Si queda algo raro (ej. "abc"),
// lo rechaza el schema con su mensaje de siempre.
function normalizePrice(value: string) {
  const cleaned = value.replace(/€/g, "").replace(/\s/g, "");
  return cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
}

// Alta masiva desde la plantilla Excel (ver src/lib/inventario/sensor-import.ts).
// Todo o nada: si una sola fila es inválida no se escribe nada y se devuelven todos
// los errores juntos, para que el usuario corrija el archivo de una vez y lo vuelva a
// subir — una importación a medias deja al usuario sin saber qué filas entraron.
// Un sensor con el mismo nombre (sin distinguir mayúsculas) que uno existente o que
// otra fila anterior del archivo se omite en vez de fallar: así resubir el mismo
// archivo tras añadirle filas no duplica lo ya importado.
export async function importSensorsAction(_prev: ImportSensorsState, formData: FormData): Promise<ImportSensorsState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecciona un archivo Excel" };
  if (file.size > MAX_IMPORT_BYTES) return { error: "El archivo no puede superar 5 MB" };
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { error: "Formato no soportado (solo .xlsx)" };

  const parsedFile = await parseSensorWorkbook(await file.arrayBuffer());
  if ("error" in parsedFile) return { error: parsedFile.error };

  const [existingSensors, existingBrands, existingTechnologies, existingProviders] = await Promise.all([
    db.select({ name: sensors.name }).from(sensors),
    db.select({ id: brands.id, name: brands.name }).from(brands),
    db.select({ id: technologies.id, name: technologies.name }).from(technologies),
    db.select({ id: providers.id, name: providers.name }).from(providers),
  ]);

  const key = (s: string) => s.trim().toLowerCase();
  const seenNames = new Map<string, number | null>(existingSensors.map((s) => [key(s.name), null]));

  const rowErrors: { row: number; message: string }[] = [];
  const skipped: { row: number; name: string; reason: string }[] = [];
  const valid: { row: number; data: z.infer<typeof importRowSchema> }[] = [];

  for (const raw of parsedFile.rows) {
    const type = raw.type ? resolveSensorType(raw.type) : null;
    if (raw.type && !type) {
      rowErrors.push({ row: raw.rowNumber, message: `Tipo «${raw.type}» no reconocido` });
      continue;
    }
    const result = importRowSchema.safeParse({
      name: raw.name,
      type: type ?? undefined,
      brand: raw.brand,
      technology: raw.technology,
      provider: raw.provider,
      purchasePrice: normalizePrice(raw.purchasePrice),
      salePrice: normalizePrice(raw.salePrice),
      notes: raw.notes || undefined,
    });
    if (!result.success) {
      rowErrors.push({ row: raw.rowNumber, message: result.error.issues[0]?.message ?? "Datos inválidos" });
      continue;
    }

    for (const [label, value] of [
      ["Marca", result.data.brand],
      ["Tecnología", result.data.technology],
      ["Proveedor", result.data.provider],
    ] as const) {
      if (value && value.length < 2) rowErrors.push({ row: raw.rowNumber, message: `${label}: mínimo 2 caracteres` });
    }

    const nameKey = key(result.data.name);
    if (seenNames.has(nameKey)) {
      const firstRow = seenNames.get(nameKey);
      skipped.push({
        row: raw.rowNumber,
        name: result.data.name,
        reason: firstRow ? `repetido en la fila ${firstRow}` : "ya existe en la app",
      });
      continue;
    }
    seenNames.set(nameKey, raw.rowNumber);
    valid.push({ row: raw.rowNumber, data: result.data });
  }

  if (rowErrors.length > 0) return { error: "Hay filas con errores. No se importó nada.", rowErrors };
  if (valid.length === 0) return { created: 0, skipped };

  let newCatalogEntries = 0;
  await db.transaction(async (tx) => {
    // Marca/Tecnología/Proveedor se buscan por nombre sin distinguir mayúsculas y se
    // crean si faltan — mismo resultado que el "crear al vuelo" del formulario.
    async function resolveCatalog(
      table: typeof brands | typeof technologies | typeof providers,
      existing: { id: string; name: string }[],
      names: string[],
    ) {
      const ids = new Map(existing.map((e) => [key(e.name), e.id]));
      for (const name of names) {
        if (!name || ids.has(key(name))) continue;
        const [row] = await tx.insert(table).values({ name }).returning({ id: table.id });
        ids.set(key(name), row.id);
        newCatalogEntries++;
      }
      return (name: string) => (name ? (ids.get(key(name)) ?? null) : null);
    }

    const brandId = await resolveCatalog(brands, existingBrands, valid.map((v) => v.data.brand));
    const technologyId = await resolveCatalog(technologies, existingTechnologies, valid.map((v) => v.data.technology));
    const providerId = await resolveCatalog(providers, existingProviders, valid.map((v) => v.data.provider));

    await tx.insert(sensors).values(
      valid.map(({ data }) => ({
        name: data.name,
        type: data.type,
        brandId: brandId(data.brand),
        technologyId: technologyId(data.technology),
        providerId: providerId(data.provider),
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        notes: data.notes ?? null,
      })),
    );
  });

  revalidatePath("/inventario/sensores");
  return { created: valid.length, skipped, newCatalogEntries };
}

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

  const [existing] = await db
    .select({ manualPath: sensors.manualPath })
    .from(sensors)
    .where(eq(sensors.id, parsed.data.id));

  await db.delete(sensors).where(eq(sensors.id, parsed.data.id));
  if (existing?.manualPath) await removeManualFile(existing.manualPath);

  revalidatePath("/inventario/sensores");
  return { success: "Sensor eliminado" };
}
