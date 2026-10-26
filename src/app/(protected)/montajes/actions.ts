"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  accessories,
  montajeItemAccessories,
  montajeItems,
  montajes,
  montajeStockMovements,
  sensorStock,
  sensors,
} from "@/db/schema";
import { MAX_PHOTO_BYTES, MONTAJES_UPLOADS_DIR, PHOTO_EXT_BY_MIME } from "@/lib/uploads";
import { deductStock, restoreStock, type StockItemKind } from "@/lib/inventario/stock-movements";
import { removeInstalledPhotoCore, setItemInstalledCore, uploadInstalledPhotoCore } from "@/lib/montajes/install-core";

export type ActionState =
  | {
      error?: string;
      success?: string;
      warnings?: string[];
      stockSummary?: { name: string; deducted: number; remaining: number }[];
      // Token del enlace público de instalación — solo lo devuelven ensureInstallLinkAction
      // y regenerateInstallLinkAction, separado de `success` porque ese campo es un
      // mensaje para mostrar, no un dato para usar.
      token?: string;
    }
  | undefined;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type AccessoryLine = { accessoryId: string; quantity: number };
type StockMovementRow = { zoneId: string; sensorId: string | null; accessoryId: string | null; quantity: number };
type StockSummaryEntry = { kind: StockItemKind; id: string; name: string; deducted: number };

const idSchema = z.object({ id: z.string().uuid("Id inválido") });

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
// z.null() va primero en el union a propósito: z.coerce.number() convierte `null` a
// `0` (Number(null) === 0 en JS), que pasa el rango -90..90/-180..180 sin problema — si
// z.null() fuera el segundo miembro, un montaje sin ubicación elegida en el mapa se
// guardaría como (0,0) en vez de sin ubicación. zod prueba las alternativas del union en
// orden y devuelve la primera que valida, así que poniendo z.null() primero, un `null`
// real nunca llega a pasar por el coerce.
const optionalLatitude = z.preprocess(emptyToNull, z.union([z.null(), z.coerce.number().min(-90).max(90)]));
const optionalLongitude = z.preprocess(emptyToNull, z.union([z.null(), z.coerce.number().min(-180).max(180)]));

const montajeSchema = z.object({
  clientName: z.string().trim().min(2, "Mínimo 2 caracteres").max(200),
  address: z.string().trim().min(3, "La dirección es obligatoria").max(500),
  latitude: optionalLatitude,
  longitude: optionalLongitude,
  notes: z.string().trim().max(1000).optional(),
});

export async function createMontajeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = montajeSchema.safeParse({
    clientName: formData.get("clientName"),
    address: formData.get("address"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [row] = await db
    .insert(montajes)
    .values({ ...parsed.data, notes: parsed.data.notes ?? null })
    .returning({ id: montajes.id });

  revalidatePath("/montajes");
  redirect(`/montajes/${row.id}`);
}

const montajeUpdateSchema = montajeSchema.extend({ id: z.string().uuid("Id inválido") });

export async function updateMontajeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = montajeUpdateSchema.safeParse({
    id: formData.get("id"),
    clientName: formData.get("clientName"),
    address: formData.get("address"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { id, ...values } = parsed.data;
  await db
    .update(montajes)
    .set({ ...values, notes: values.notes ?? null, updatedAt: new Date() })
    .where(eq(montajes.id, id));

  // Sin redirect a propósito: esto se usa embebido en /montajes/[id] (edición inline,
  // no una página aparte) — el propio componente cierra el modo edición al ver
  // state.success, distinto del alta que sí navega.
  revalidatePath(`/montajes/${id}`);
  revalidatePath("/montajes");
  return { success: "Montaje actualizado" };
}

// Restaura el stock de un conjunto de movimientos ya leídos (no los borra — eso lo hace
// cada llamador, según si además necesita insertar movimientos nuevos o no). Nunca
// bloquea: si una zona quedó sin celdas libres desde que se descontó, junta la
// advertencia en vez de perder el ajuste en silencio.
async function restoreMovementRows(tx: Tx, movements: StockMovementRow[], warnings: string[]) {
  for (const m of movements) {
    const kind: StockItemKind = m.sensorId ? "sensor" : "accessory";
    const refId = (m.sensorId ?? m.accessoryId)!;
    const { warning } = await restoreStock(tx, m.zoneId, kind, refId, m.quantity);
    if (warning) warnings.push(warning);
  }
}

// Restaura y borra TODOS los movimientos de un ítem — usado antes de borrar el ítem, o
// antes de re-descontar tras editarlo (reemplaza el set completo en vez de diferenciar
// línea por línea, mismo criterio que ya usa el proyecto para sensor_accessories).
async function restoreAndClearItemMovements(tx: Tx, montajeItemId: string, warnings: string[]) {
  const movements = await tx
    .select({
      zoneId: montajeStockMovements.zoneId,
      sensorId: montajeStockMovements.sensorId,
      accessoryId: montajeStockMovements.accessoryId,
      quantity: montajeStockMovements.quantity,
    })
    .from(montajeStockMovements)
    .where(eq(montajeStockMovements.montajeItemId, montajeItemId));
  await restoreMovementRows(tx, movements, warnings);
  await tx.delete(montajeStockMovements).where(eq(montajeStockMovements.montajeItemId, montajeItemId));
}

// Descuenta 1× el sensor del ítem y cada línea de accesorios, registrando un movimiento
// por línea (y por zona realmente tocada, ver deductStock) con su montajeItemId — nunca
// agrupado entre ítems distintos aunque compartan sensor (así se puede deshacer con
// precisión el borrado/edición de UN solo ítem, sin tocar el stock de sus hermanos).
// Nunca bloquea ni deja stock negativo — junta advertencias legibles si algo se quedó
// corto. No recibe zona: al usuario no le interesa desde qué estantería sale cada cosa.
function addToSummary(summary: Map<string, StockSummaryEntry> | undefined, kind: StockItemKind, id: string, name: string, deducted: number) {
  if (!summary || deducted <= 0) return;
  const key = `${kind}:${id}`;
  const entry = summary.get(key) ?? { kind, id, name, deducted: 0 };
  entry.deducted += deducted;
  summary.set(key, entry);
}

async function deductAndRecordForItem(
  tx: Tx,
  args: { montajeId: string; montajeItemId: string; sensorId: string; accessories: AccessoryLine[] },
  warnings: string[],
  // Opcional: solo startMontajeAction lo usa, para poder avisar cuánto quedó de cada
  // sensor/accesorio tocado — addMontajeItemAction/updateMontajeItemAction no lo
  // necesitan y siguen llamando esta función igual que antes.
  summary?: Map<string, StockSummaryEntry>,
) {
  const [sensorRow] = await tx.select({ name: sensors.name }).from(sensors).where(eq(sensors.id, args.sensorId));
  const sensorDeductions = await deductStock(tx, "sensor", args.sensorId, 1);
  const sensorTotal = sensorDeductions.reduce((sum, d) => sum + d.quantity, 0);
  for (const d of sensorDeductions) {
    await tx.insert(montajeStockMovements).values({
      montajeId: args.montajeId,
      montajeItemId: args.montajeItemId,
      zoneId: d.zoneId,
      sensorId: args.sensorId,
      quantity: d.quantity,
    });
  }
  addToSummary(summary, "sensor", args.sensorId, sensorRow?.name ?? "sensor", sensorTotal);
  if (sensorTotal < 1) {
    warnings.push(`Sin stock de "${sensorRow?.name ?? "sensor"}" — quedó en 0.`);
  }

  for (const line of args.accessories) {
    const [accessoryRow] = await tx
      .select({ name: accessories.name })
      .from(accessories)
      .where(eq(accessories.id, line.accessoryId));
    const deductions = await deductStock(tx, "accessory", line.accessoryId, line.quantity);
    const total = deductions.reduce((sum, d) => sum + d.quantity, 0);
    for (const d of deductions) {
      await tx.insert(montajeStockMovements).values({
        montajeId: args.montajeId,
        montajeItemId: args.montajeItemId,
        zoneId: d.zoneId,
        accessoryId: line.accessoryId,
        quantity: d.quantity,
      });
    }
    addToSummary(summary, "accessory", line.accessoryId, accessoryRow?.name ?? "accesorio", total);
    if (total < line.quantity) {
      warnings.push(`Solo había ${total} de ${line.quantity} de "${accessoryRow?.name ?? "accesorio"}" — quedó en 0.`);
    }
  }
}

const startMontajeSchema = z.object({
  montajeId: z.string().uuid("Id de montaje inválido"),
});

// Evento único: se descuenta el modelo de sensor/accesorio de donde haya stock, sin
// pedir elegir zona — no por sensor instalado en campo (eso solo se sigue marcando en
// Instalación). El usuario confirmó que siempre prepara el kit en la oficina sabiendo
// que hay stock, así que el "piso en cero" de deductStock es un resguardo, no el camino
// esperado, y de qué estantería salió cada cosa no le importa.
export async function startMontajeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = startMontajeSchema.safeParse({
    montajeId: formData.get("montajeId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [montaje] = await db
    .select({ startedAt: montajes.startedAt })
    .from(montajes)
    .where(eq(montajes.id, parsed.data.montajeId));
  if (!montaje) return { error: "Montaje no encontrado" };
  if (montaje.startedAt) return { error: "Este montaje ya se inició" };

  const items = await db
    .select({ id: montajeItems.id, sensorId: montajeItems.sensorId })
    .from(montajeItems)
    .where(eq(montajeItems.montajeId, parsed.data.montajeId));
  if (items.length === 0) return { error: "Añade al menos un sensor antes de iniciar" };

  const itemIds = items.map((item) => item.id);
  const accessoryLinks = await db
    .select({
      montajeItemId: montajeItemAccessories.montajeItemId,
      accessoryId: montajeItemAccessories.accessoryId,
      quantity: montajeItemAccessories.quantity,
    })
    .from(montajeItemAccessories)
    .where(inArray(montajeItemAccessories.montajeItemId, itemIds));
  const accessoriesByItem = new Map<string, AccessoryLine[]>();
  for (const link of accessoryLinks) {
    const list = accessoriesByItem.get(link.montajeItemId) ?? [];
    list.push({ accessoryId: link.accessoryId, quantity: link.quantity });
    accessoriesByItem.set(link.montajeItemId, list);
  }

  const warnings: string[] = [];
  const summary = new Map<string, StockSummaryEntry>();
  await db.transaction(async (tx) => {
    for (const item of items) {
      await deductAndRecordForItem(
        tx,
        {
          montajeId: parsed.data.montajeId,
          montajeItemId: item.id,
          sensorId: item.sensorId,
          accessories: accessoriesByItem.get(item.id) ?? [],
        },
        warnings,
        summary,
      );
    }
    await tx
      .update(montajes)
      .set({ startedAt: new Date(), updatedAt: new Date() })
      .where(eq(montajes.id, parsed.data.montajeId));
  });

  // Ya con el descuento confirmado, se consulta cuánto queda en total (sumando todas las
  // zonas) de cada sensor/accesorio tocado — para poder avisar "tenías X, ahora quedan Y"
  // en vez de que el usuario tenga que ir a revisar Stock por su cuenta.
  const stockSummary: { name: string; deducted: number; remaining: number }[] = [];
  for (const entry of summary.values()) {
    const column = entry.kind === "sensor" ? sensorStock.sensorId : sensorStock.accessoryId;
    const rows = await db.select({ quantity: sensorStock.quantity }).from(sensorStock).where(eq(column, entry.id));
    const remaining = rows.reduce((sum, row) => sum + row.quantity, 0);
    stockSummary.push({ name: entry.name, deducted: entry.deducted, remaining });
  }

  revalidatePath(`/montajes/${parsed.data.montajeId}`);
  revalidatePath("/montajes");
  return { success: "Montaje iniciado", warnings: warnings.length ? warnings : undefined, stockSummary };
}

// Solo se puede deshacer mientras nada se marcó instalado en campo todavía — una vez que
// el instalador empezó a tildar el checklist, desandar el inicio dejaría el stock
// restaurado pero sensores ya "instalados" sin haber salido nunca de la oficina.
export async function undoStartMontajeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [montaje] = await db
    .select({ startedAt: montajes.startedAt })
    .from(montajes)
    .where(eq(montajes.id, parsed.data.id));
  if (!montaje) return { error: "Montaje no encontrado" };
  if (!montaje.startedAt) return { error: "Este montaje no se ha iniciado" };

  const [{ installedCount }] = await db
    .select({ installedCount: count(montajeItems.installedAt) })
    .from(montajeItems)
    .where(eq(montajeItems.montajeId, parsed.data.id));
  if (installedCount > 0) {
    return { error: "No se puede deshacer: ya hay sensores marcados como instalados en Instalación" };
  }

  const warnings: string[] = [];
  await db.transaction(async (tx) => {
    const movements = await tx
      .select({
        zoneId: montajeStockMovements.zoneId,
        sensorId: montajeStockMovements.sensorId,
        accessoryId: montajeStockMovements.accessoryId,
        quantity: montajeStockMovements.quantity,
      })
      .from(montajeStockMovements)
      .where(eq(montajeStockMovements.montajeId, parsed.data.id));
    await restoreMovementRows(tx, movements, warnings);
    await tx.delete(montajeStockMovements).where(eq(montajeStockMovements.montajeId, parsed.data.id));
    await tx
      .update(montajes)
      .set({ startedAt: null, updatedAt: new Date() })
      .where(eq(montajes.id, parsed.data.id));
  });

  revalidatePath(`/montajes/${parsed.data.id}`);
  revalidatePath("/montajes");
  return { success: "Inicio deshecho, stock restaurado", warnings: warnings.length ? warnings : undefined };
}

export async function deleteMontajeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  // Si el montaje ya había iniciado, restaura todo su stock ANTES de borrar — el cascade
  // en montaje_stock_movements barrería las filas sin devolver nada si no lo hacemos acá.
  const warnings: string[] = [];
  await db.transaction(async (tx) => {
    const movements = await tx
      .select({
        zoneId: montajeStockMovements.zoneId,
        sensorId: montajeStockMovements.sensorId,
        accessoryId: montajeStockMovements.accessoryId,
        quantity: montajeStockMovements.quantity,
      })
      .from(montajeStockMovements)
      .where(eq(montajeStockMovements.montajeId, parsed.data.id));
    await restoreMovementRows(tx, movements, warnings);
    await tx.delete(montajes).where(eq(montajes.id, parsed.data.id));
  });

  // El cascade en montaje_items borra las filas, no los archivos — la carpeta de fotos
  // en disco se limpia acá aparte, best-effort (no bloquea el borrado si falla).
  await rm(path.join(MONTAJES_UPLOADS_DIR, parsed.data.id), { recursive: true, force: true }).catch((err) => {
    console.error("No se pudo borrar la carpeta de uploads del montaje", parsed.data.id, err);
  });

  revalidatePath("/montajes");
  return { success: "Montaje eliminado", warnings: warnings.length ? warnings : undefined };
}

// El cliente manda las líneas de accesorios como JSON en un input oculto (mismo patrón
// ya documentado en el proyecto como excepción deliberada para listas de largo
// variable). Se mergean cantidades duplicadas del mismo accesorio acá — el índice único
// (montajeItemId, accessoryId) rechazaría un insert con el mismo accessoryId dos veces.
const accessoryLineSchema = z.object({
  accessoryId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(9999),
});
const accessoriesJsonSchema = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return [];
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}, z.array(accessoryLineSchema).max(50));

function mergeAccessoryLines(lines: AccessoryLine[]): AccessoryLine[] {
  const merged = new Map<string, number>();
  for (const line of lines) merged.set(line.accessoryId, (merged.get(line.accessoryId) ?? 0) + line.quantity);
  return [...merged.entries()].map(([accessoryId, quantity]) => ({ accessoryId, quantity }));
}

// Un renglón de textarea por ubicación en vez de "ubicación + cantidad": así cada
// sensor del lote nace con su nombre real (ej. "Daikin 1 - Impulsión", "Daikin 1 -
// Retorno") en vez de un número autogenerado sobre el mismo texto que había que
// renombrar a mano después uno por uno.
const addItemSchema = z.object({
  montajeId: z.string().uuid("Id de montaje inválido"),
  sensorId: z.string().uuid("Selecciona un sensor"),
  locationsText: z
    .string()
    .transform((text) =>
      text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().min(2, "Cada ubicación necesita al menos 2 caracteres").max(200))
        .min(1, "Escribe al menos una ubicación")
        .max(50, "Máximo 50 ubicaciones de una vez"),
    ),
  notes: z.string().trim().max(1000).optional(),
  accessories: accessoriesJsonSchema,
});

export async function addMontajeItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = addItemSchema.safeParse({
    montajeId: formData.get("montajeId"),
    sensorId: formData.get("sensorId"),
    locationsText: formData.get("locationsText"),
    notes: formData.get("notes") || undefined,
    accessories: formData.get("accessoriesJson"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  // La foto es opcional: se puede añadir un sensor y sacarle la foto de dónde va más
  // tarde, editando el ítem. Con más de una ubicación el cliente ni siquiera manda una —
  // pedir N recortes/marcados seguidos en la misma alta sería tedioso, así que cada ítem
  // se crea sin foto y se le agrega la suya propia después, editándolo desde la lista.
  const photo = formData.get("photo");
  let ext: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return { error: "La imagen no puede superar 10 MB" };
    ext = PHOTO_EXT_BY_MIME[photo.type];
    if (!ext) return { error: "Formato de imagen no soportado (usa JPG, PNG o WebP)" };
  }

  const [montaje] = await db
    .select({ startedAt: montajes.startedAt })
    .from(montajes)
    .where(eq(montajes.id, parsed.data.montajeId));
  if (!montaje) return { error: "Montaje no encontrado" };

  const locations = parsed.data.locationsText;
  const itemIds = locations.map(() => randomUUID());

  // La foto (si la hay) es siempre para el primer y único ítem cuando hay una sola
  // ubicación — con más de una nunca llega ninguna, ver comentario arriba.
  const relativePath = ext ? `${parsed.data.montajeId}/${itemIds[0]}.${ext}` : null;
  if (relativePath && photo instanceof File) {
    await mkdir(path.join(MONTAJES_UPLOADS_DIR, parsed.data.montajeId), { recursive: true });
    await writeFile(path.join(MONTAJES_UPLOADS_DIR, relativePath), Buffer.from(await photo.arrayBuffer()));
  }

  const accessoryLines = mergeAccessoryLines(parsed.data.accessories);
  const warnings: string[] = [];
  await db.transaction(async (tx) => {
    for (const [index, itemId] of itemIds.entries()) {
      await tx.insert(montajeItems).values({
        id: itemId,
        montajeId: parsed.data.montajeId,
        sensorId: parsed.data.sensorId,
        location: locations[index],
        notes: parsed.data.notes ?? null,
        photoPath: index === 0 ? relativePath : null,
      });

      if (accessoryLines.length > 0) {
        await tx.insert(montajeItemAccessories).values(
          accessoryLines.map((line) => ({ montajeItemId: itemId, accessoryId: line.accessoryId, quantity: line.quantity })),
        );
      }

      // Montaje ya iniciado: cualquier alta posterior ajusta el stock automáticamente,
      // sin volver a preguntar de dónde sale — cada unidad del lote descuenta la suya
      // por separado.
      if (montaje.startedAt) {
        await deductAndRecordForItem(
          tx,
          {
            montajeId: parsed.data.montajeId,
            montajeItemId: itemId,
            sensorId: parsed.data.sensorId,
            accessories: accessoryLines,
          },
          warnings,
        );
      }
    }
  });

  revalidatePath(`/montajes/${parsed.data.montajeId}`);
  revalidatePath("/montajes");
  return {
    success: itemIds.length > 1 ? `${itemIds.length} sensores añadidos` : "Sensor añadido",
    warnings: warnings.length ? warnings : undefined,
  };
}

const updateItemSchema = z.object({
  id: z.string().uuid("Id inválido"),
  sensorId: z.string().uuid("Selecciona un sensor"),
  location: z.string().trim().min(2, "Mínimo 2 caracteres").max(200),
  notes: z.string().trim().max(1000).optional(),
  accessories: accessoriesJsonSchema,
});

export async function updateMontajeItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = updateItemSchema.safeParse({
    id: formData.get("id"),
    sensorId: formData.get("sensorId"),
    location: formData.get("location"),
    notes: formData.get("notes") || undefined,
    accessories: formData.get("accessoriesJson"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db
    .select({
      montajeId: montajeItems.montajeId,
      photoPath: montajeItems.photoPath,
      startedAt: montajes.startedAt,
    })
    .from(montajeItems)
    .innerJoin(montajes, eq(montajes.id, montajeItems.montajeId))
    .where(eq(montajeItems.id, parsed.data.id));
  if (!existing) return { error: "Ítem no encontrado" };

  // La foto es opcional al editar (a diferencia de crear) — si no se elige una nueva,
  // se conserva la que ya tenía.
  const photo = formData.get("photo");
  let photoPath = existing.photoPath;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return { error: "La imagen no puede superar 10 MB" };
    const ext = PHOTO_EXT_BY_MIME[photo.type];
    if (!ext) return { error: "Formato de imagen no soportado (usa JPG, PNG o WebP)" };

    const relativePath = `${existing.montajeId}/${parsed.data.id}.${ext}`;
    await mkdir(path.join(MONTAJES_UPLOADS_DIR, existing.montajeId), { recursive: true });
    await writeFile(path.join(MONTAJES_UPLOADS_DIR, relativePath), Buffer.from(await photo.arrayBuffer()));
    if (existing.photoPath && existing.photoPath !== relativePath) {
      await rm(path.join(MONTAJES_UPLOADS_DIR, existing.photoPath), { force: true }).catch((err) => {
        console.error("No se pudo borrar la foto anterior", existing.photoPath, err);
      });
    }
    photoPath = relativePath;
  }

  const accessoryLines = mergeAccessoryLines(parsed.data.accessories);
  const warnings: string[] = [];
  await db.transaction(async (tx) => {
    await tx
      .update(montajeItems)
      .set({
        sensorId: parsed.data.sensorId,
        location: parsed.data.location,
        notes: parsed.data.notes ?? null,
        photoPath,
        updatedAt: new Date(),
      })
      .where(eq(montajeItems.id, parsed.data.id));

    // Reemplaza el set completo de accesorios en vez de diferenciar línea por línea.
    await tx.delete(montajeItemAccessories).where(eq(montajeItemAccessories.montajeItemId, parsed.data.id));
    if (accessoryLines.length > 0) {
      await tx.insert(montajeItemAccessories).values(
        accessoryLines.map((line) => ({ montajeItemId: parsed.data.id, accessoryId: line.accessoryId, quantity: line.quantity })),
      );
    }

    // Montaje ya iniciado: restaura lo que este ítem tenía descontado y vuelve a
    // descontar con los datos ya actualizados (sensor y/o accesorios pudieron cambiar).
    if (existing.startedAt) {
      await restoreAndClearItemMovements(tx, parsed.data.id, warnings);
      await deductAndRecordForItem(
        tx,
        {
          montajeId: existing.montajeId,
          montajeItemId: parsed.data.id,
          sensorId: parsed.data.sensorId,
          accessories: accessoryLines,
        },
        warnings,
      );
    }
  });

  revalidatePath(`/montajes/${existing.montajeId}`);
  revalidatePath("/montajes");
  return { success: "Sensor actualizado", warnings: warnings.length ? warnings : undefined };
}

export async function deleteMontajeItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const warnings: string[] = [];
  const row = await db.transaction(async (tx) => {
    // Restaura y limpia lo que este ítem tenía descontado (no-op si el montaje nunca
    // inició — no hay movimientos que restaurar) ANTES de borrarlo.
    await restoreAndClearItemMovements(tx, parsed.data.id, warnings);
    const [deleted] = await tx
      .delete(montajeItems)
      .where(eq(montajeItems.id, parsed.data.id))
      .returning({
        montajeId: montajeItems.montajeId,
        photoPath: montajeItems.photoPath,
        installedPhotoPath: montajeItems.installedPhotoPath,
      });
    return deleted;
  });

  for (const photoPath of [row?.photoPath, row?.installedPhotoPath]) {
    if (!photoPath) continue;
    await rm(path.join(MONTAJES_UPLOADS_DIR, photoPath), { force: true }).catch((err) => {
      console.error("No se pudo borrar el archivo de foto", photoPath, err);
    });
  }
  if (row?.montajeId) {
    revalidatePath(`/montajes/${row.montajeId}`);
    revalidatePath("/montajes");
  }

  return { success: "Sensor eliminado del montaje", warnings: warnings.length ? warnings : undefined };
}

const setInstalledSchema = z.object({
  id: z.string().uuid("Id inválido"),
  installed: z.enum(["1", "0"]),
});

// Toggle simple, sin modal — instalado/no instalado tiene que poder marcarse con un
// solo clic, sin fricción, ya que la foto (lo único que sí amerita un modal) es
// deliberadamente opcional y va aparte (ver uploadInstalledPhotoAction). La lógica de
// negocio vive en install-core.ts, compartida con la acción pública del enlace del
// técnico (ver src/app/i/actions.ts) — acá solo se valida la sesión.
export async function setMontajeItemInstalledAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = setInstalledSchema.safeParse({
    id: formData.get("id"),
    installed: formData.get("installed"),
  });
  if (!parsed.success) return { error: "Datos inválidos" };

  return setItemInstalledCore(parsed.data.id, parsed.data.installed === "1");
}

export async function uploadInstalledPhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const photo = formData.get("photo");
  if (!(photo instanceof File)) return { error: "Selecciona una foto" };

  return uploadInstalledPhotoCore(parsed.data.id, photo);
}

export async function removeInstalledPhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  return removeInstalledPhotoCore(parsed.data.id);
}

// Genera el token la primera vez que se pide (si ya existe uno, lo devuelve tal cual —
// idempotente, para que abrir el panel del enlace repetidas veces no invalide uno que el
// técnico ya tiene guardado). Para invalidar uno filtrado o viejo está
// regenerateInstallLinkAction aparte, que sí siempre pisa el token anterior.
export async function ensureInstallLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [montaje] = await db
    .select({ startedAt: montajes.startedAt, installToken: montajes.installToken })
    .from(montajes)
    .where(eq(montajes.id, parsed.data.id));
  if (!montaje) return { error: "Montaje no encontrado" };
  if (!montaje.startedAt) return { error: "Este montaje todavía no se inició" };

  const token = montaje.installToken ?? randomUUID();
  if (!montaje.installToken) {
    await db.update(montajes).set({ installToken: token }).where(eq(montajes.id, parsed.data.id));
  }

  revalidatePath(`/montajes/${parsed.data.id}`);
  return { token };
}

export async function regenerateInstallLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const token = randomUUID();
  await db.update(montajes).set({ installToken: token }).where(eq(montajes.id, parsed.data.id));

  revalidatePath(`/montajes/${parsed.data.id}`);
  return { token };
}
