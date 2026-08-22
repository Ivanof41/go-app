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
});

export async function createZoneAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión expirada" };

  const parsed = zoneSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db.select({ id: zones.id }).from(zones).where(eq(zones.name, parsed.data.name));
  if (existing) return { error: "Ya existe una zona con ese nombre" };

  const [{ total }] = await db.select({ total: count() }).from(zones);

  await db.insert(zones).values({
    name: parsed.data.name,
    location: parsed.data.location || null,
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
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const [existing] = await db.select({ id: zones.id }).from(zones).where(eq(zones.name, parsed.data.name));
  if (existing && existing.id !== parsed.data.id) return { error: "Ya existe una zona con ese nombre" };

  await db
    .update(zones)
    .set({ name: parsed.data.name, location: parsed.data.location || null, updatedAt: new Date() })
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
    mode: formData.get("mode"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { sensorId, zoneId, mode, amount } = parsed.data;

  if (mode === "absolute" && amount < 0) return { error: "La cantidad no puede ser negativa" };
  if (mode === "delta" && amount === 0) return { error: "Ingresa una cantidad distinta de 0" };

  const [current] = await db
    .select({ quantity: sensorStock.quantity })
    .from(sensorStock)
    .where(and(eq(sensorStock.sensorId, sensorId), eq(sensorStock.zoneId, zoneId)));

  if (mode === "delta") {
    const resulting = (current?.quantity ?? 0) + amount;
    if (resulting < 0) {
      return { error: `No hay suficiente stock: quedarían ${resulting} unidades` };
    }
  }

  await db
    .insert(sensorStock)
    .values({
      sensorId,
      zoneId,
      quantity: mode === "absolute" ? amount : Math.max(amount, 0),
    })
    .onConflictDoUpdate({
      target: [sensorStock.sensorId, sensorStock.zoneId],
      set: {
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
