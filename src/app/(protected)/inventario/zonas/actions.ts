"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { zones, sensorStock } from "@/db/schema";

export type ActionState = { error?: string; success?: string } | undefined;

// --- Zonas ---

const zoneSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(120),
  location: z.string().trim().max(255).optional().or(z.literal("")),
  rows: z.coerce.number().int().min(1, "Mínimo 1 balda").max(12, "Máximo 12 baldas"),
  cols: z.coerce.number().int().min(1, "Mínimo 1 posición").max(12, "Máximo 12 posiciones"),
});

export async function createZoneAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = zoneSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    rows: formData.get("rows"),
    cols: formData.get("cols"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db.select({ id: zones.id }).from(zones).where(eq(zones.name, parsed.data.name));
  if (existing) return { error: "Ya existe una zona con ese nombre" };

  const [{ total }] = await db.select({ total: count() }).from(zones);

  await db.insert(zones).values({
    name: parsed.data.name,
    location: parsed.data.location || null,
    rows: parsed.data.rows,
    cols: parsed.data.cols,
    position: total,
  });

  revalidatePath("/inventario/zonas");
  return { success: "Zona creada" };
}

const editZoneSchema = zoneSchema.extend({ id: z.string().uuid("Id inválido") });

export async function updateZoneAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = editZoneSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    location: formData.get("location"),
    rows: formData.get("rows"),
    cols: formData.get("cols"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db.select({ id: zones.id }).from(zones).where(eq(zones.name, parsed.data.name));
  if (existing && existing.id !== parsed.data.id) return { error: "Ya existe una zona con ese nombre" };

  const [{ maxRow, maxCol }] = await db
    .select({ maxRow: sql<number | null>`max(${sensorStock.row})`, maxCol: sql<number | null>`max(${sensorStock.col})` })
    .from(sensorStock)
    .where(eq(sensorStock.zoneId, parsed.data.id));
  if (maxRow !== null && (maxRow >= parsed.data.rows || maxCol! >= parsed.data.cols)) {
    return {
      error: `No se puede reducir la estantería: hay stock en la balda ${maxRow + 1}, posición ${maxCol! + 1}. Quita ese stock primero.`,
    };
  }

  await db
    .update(zones)
    .set({
      name: parsed.data.name,
      location: parsed.data.location || null,
      rows: parsed.data.rows,
      cols: parsed.data.cols,
      updatedAt: new Date(),
    })
    .where(eq(zones.id, parsed.data.id));

  revalidatePath("/inventario/zonas");
  return { success: "Zona actualizada" };
}

const idSchema = z.object({ id: z.string().uuid("Id inválido") });

export async function deleteZoneAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Id inválido" };

  const [{ total }] = await db
    .select({ total: count() })
    .from(sensorStock)
    .where(eq(sensorStock.zoneId, parsed.data.id));
  if (total > 0) {
    return { error: `No puedes eliminar esta zona: tiene stock de ${total} sensor(es) asociado(s)` };
  }

  await db.delete(zones).where(eq(zones.id, parsed.data.id));
  revalidatePath("/inventario/zonas");
  return { success: "Zona eliminada" };
}

// --- Stock ---

const stockSchema = z.object({
  sensorId: z.string().uuid("Selecciona un sensor"),
  zoneId: z.string().uuid("Selecciona una zona"),
  row: z.coerce.number().int().min(0),
  col: z.coerce.number().int().min(0),
  mode: z.enum(["delta", "absolute"]),
  amount: z.coerce.number().int(),
});

export async function upsertSensorStockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = stockSchema.safeParse({
    sensorId: formData.get("sensorId"),
    zoneId: formData.get("zoneId"),
    row: formData.get("row"),
    col: formData.get("col"),
    mode: formData.get("mode"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { sensorId, zoneId, row, col, mode, amount } = parsed.data;

  const [zone] = await db.select({ rows: zones.rows, cols: zones.cols }).from(zones).where(eq(zones.id, zoneId));
  if (!zone) return { error: "Zona inválida" };
  if (row >= zone.rows || col >= zone.cols) return { error: "Esa posición ya no existe en esta zona" };

  const [current] = await db
    .select({ quantity: sensorStock.quantity })
    .from(sensorStock)
    .where(and(eq(sensorStock.zoneId, zoneId), eq(sensorStock.row, row), eq(sensorStock.col, col)));

  // Celda vacía: no hay cantidad previa contra la que aplicar un delta, así que la
  // cantidad ingresada es directamente el total inicial (sea cual sea el "mode").
  if (!current) {
    if (amount < 0) return { error: "La cantidad no puede ser negativa" };
  } else {
    if (mode === "absolute" && amount < 0) return { error: "La cantidad no puede ser negativa" };
    if (mode === "delta" && amount === 0) return { error: "Ingresa una cantidad distinta de 0" };
    if (mode === "delta" && current.quantity + amount < 0) {
      return { error: `No hay suficiente stock: quedarían ${current.quantity + amount} unidades` };
    }
  }

  await db
    .insert(sensorStock)
    .values({ sensorId, zoneId, row, col, quantity: current ? Math.max(amount, 0) : amount })
    .onConflictDoUpdate({
      target: [sensorStock.zoneId, sensorStock.row, sensorStock.col],
      set: {
        sensorId,
        quantity: mode === "absolute" ? amount : sql`${sensorStock.quantity} + ${amount}`,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/inventario/zonas");
  return { success: "Stock actualizado" };
}

export async function removeSensorStockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Datos inválidos" };

  await db.delete(sensorStock).where(eq(sensorStock.id, parsed.data.id));
  revalidatePath("/inventario/zonas");
  return { success: "Registro de stock eliminado" };
}
