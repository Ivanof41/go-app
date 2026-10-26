import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accessories, montajeItemAccessories, montajeItems, montajes, sensors } from "@/db/schema";
import { statusFor } from "@/lib/montajes/status";

export async function listMontajes() {
  const summary = await db
    .select({
      id: montajes.id,
      clientName: montajes.clientName,
      address: montajes.address,
      startedAt: montajes.startedAt,
      installToken: montajes.installToken,
      createdAt: montajes.createdAt,
      itemCount: count(montajeItems.id),
      // count() sobre una columna cuenta solo los valores no nulos — installedCount sale
      // gratis así, sin necesidad de un CASE/filter aparte. El estado (Preparado/Iniciado/
      // Completado) se deriva de startedAt/itemCount/installedCount donde se muestra,
      // nunca se guarda — evita que se desincronice de los ítems reales.
      installedCount: count(montajeItems.installedAt),
    })
    .from(montajes)
    .leftJoin(montajeItems, eq(montajeItems.montajeId, montajes.id))
    .groupBy(montajes.id)
    .orderBy(desc(montajes.createdAt));

  // Precios sueltos, sumados acá en vez de con SUM() en SQL — mismo criterio que
  // getZonesWithStock()/listMontajeItems(): un JOIN con montaje_item_accessories en la
  // misma query de arriba multiplicaría filas de montajeItems por cada accesorio,
  // inflando itemCount/installedCount, y SUM() sobre columnas numeric además vuelve del
  // driver como string, no como number.
  const itemPrices = await db
    .select({ montajeId: montajeItems.montajeId, purchasePrice: sensors.purchasePrice, salePrice: sensors.salePrice })
    .from(montajeItems)
    .innerJoin(sensors, eq(sensors.id, montajeItems.sensorId));

  const accessoryPrices = await db
    .select({
      montajeId: montajeItems.montajeId,
      quantity: montajeItemAccessories.quantity,
      purchasePrice: accessories.purchasePrice,
      salePrice: accessories.salePrice,
    })
    .from(montajeItemAccessories)
    .innerJoin(montajeItems, eq(montajeItems.id, montajeItemAccessories.montajeItemId))
    .innerJoin(accessories, eq(accessories.id, montajeItemAccessories.accessoryId));

  const totalsByMontaje = new Map<string, { cost: number; sale: number }>();
  for (const row of itemPrices) {
    const totals = totalsByMontaje.get(row.montajeId) ?? { cost: 0, sale: 0 };
    totals.cost += row.purchasePrice ?? 0;
    totals.sale += row.salePrice ?? 0;
    totalsByMontaje.set(row.montajeId, totals);
  }
  for (const row of accessoryPrices) {
    const totals = totalsByMontaje.get(row.montajeId) ?? { cost: 0, sale: 0 };
    totals.cost += (row.purchasePrice ?? 0) * row.quantity;
    totals.sale += (row.salePrice ?? 0) * row.quantity;
    totalsByMontaje.set(row.montajeId, totals);
  }

  return summary.map((m) => {
    const totals = totalsByMontaje.get(m.id) ?? { cost: 0, sale: 0 };
    return { ...m, totalCost: totals.cost, totalSale: totals.sale };
  });
}

// Para la tarjeta del dashboard — mismo groupBy que listMontajes() pero sin los dos
// queries de precios (no hacen falta solo para contar por estado), así queda liviana.
export async function getMontajeStatusCounts() {
  const summary = await db
    .select({
      startedAt: montajes.startedAt,
      itemCount: count(montajeItems.id),
      installedCount: count(montajeItems.installedAt),
    })
    .from(montajes)
    .leftJoin(montajeItems, eq(montajeItems.montajeId, montajes.id))
    .groupBy(montajes.id);

  let enCurso = 0;
  let preparados = 0;
  for (const m of summary) {
    const { status } = statusFor(m.startedAt, m.itemCount, m.installedCount);
    if (status === "iniciado") enCurso++;
    else if (status === "preparado") preparados++;
  }
  return { enCurso, preparados };
}

// Para el mapa del dashboard — mismo groupBy liviano que getMontajeStatusCounts(), pero
// además trae lat/lng y descarta los montajes que todavía no tienen ubicación cargada
// (no tiene sentido intentar pintar un pin sin coordenadas).
export async function listMontajesForMap() {
  const summary = await db
    .select({
      id: montajes.id,
      clientName: montajes.clientName,
      address: montajes.address,
      latitude: montajes.latitude,
      longitude: montajes.longitude,
      startedAt: montajes.startedAt,
      itemCount: count(montajeItems.id),
      installedCount: count(montajeItems.installedAt),
    })
    .from(montajes)
    .leftJoin(montajeItems, eq(montajeItems.montajeId, montajes.id))
    .groupBy(montajes.id);

  // numeric(9,6) vuelve como string del driver — Number() explícito, mismo criterio que
  // ya se documentó para precios en otros lados de este archivo.
  return summary
    .filter((m) => m.latitude !== null && m.longitude !== null)
    .map((m) => ({
      id: m.id,
      clientName: m.clientName,
      address: m.address,
      lat: Number(m.latitude),
      lng: Number(m.longitude),
      status: statusFor(m.startedAt, m.itemCount, m.installedCount).status,
    }));
}

export async function getMontajeById(id: string) {
  const [row] = await db
    .select({
      id: montajes.id,
      clientName: montajes.clientName,
      address: montajes.address,
      latitude: montajes.latitude,
      longitude: montajes.longitude,
      notes: montajes.notes,
      startedAt: montajes.startedAt,
      installToken: montajes.installToken,
      createdAt: montajes.createdAt,
    })
    .from(montajes)
    .where(eq(montajes.id, id));
  return row ?? null;
}

export async function listMontajeItems(montajeId: string) {
  const items = await db
    .select({
      id: montajeItems.id,
      montajeId: montajeItems.montajeId,
      sensorId: montajeItems.sensorId,
      sensorName: sensors.name,
      sensorType: sensors.type,
      sensorPurchasePrice: sensors.purchasePrice,
      sensorSalePrice: sensors.salePrice,
      sensorManualPath: sensors.manualPath,
      location: montajeItems.location,
      notes: montajeItems.notes,
      photoPath: montajeItems.photoPath,
      installedAt: montajeItems.installedAt,
      installedPhotoPath: montajeItems.installedPhotoPath,
      createdAt: montajeItems.createdAt,
      updatedAt: montajeItems.updatedAt,
    })
    .from(montajeItems)
    .innerJoin(sensors, eq(montajeItems.sensorId, sensors.id))
    .where(eq(montajeItems.montajeId, montajeId))
    .orderBy(asc(montajeItems.createdAt));

  // Segundo query para los accesorios propios de cada ítem — mismo patrón de dos pasos
  // que getZonesWithStock() (un join directo multiplicaría filas de montajeItems por
  // cada accesorio, complicando el resto del select).
  const itemIds = items.map((item) => item.id);
  const accessoryLinks = itemIds.length
    ? await db
        .select({
          montajeItemId: montajeItemAccessories.montajeItemId,
          accessoryId: montajeItemAccessories.accessoryId,
          accessoryName: accessories.name,
          quantity: montajeItemAccessories.quantity,
          purchasePrice: accessories.purchasePrice,
          salePrice: accessories.salePrice,
        })
        .from(montajeItemAccessories)
        .innerJoin(accessories, eq(accessories.id, montajeItemAccessories.accessoryId))
        .where(inArray(montajeItemAccessories.montajeItemId, itemIds))
    : [];

  const accessoriesByItem = new Map<string, typeof accessoryLinks>();
  for (const link of accessoryLinks) {
    const list = accessoriesByItem.get(link.montajeItemId) ?? [];
    list.push(link);
    accessoriesByItem.set(link.montajeItemId, list);
  }

  return items.map((item) => {
    const itemAccessories = accessoriesByItem.get(item.id) ?? [];
    const accessoriesCost = itemAccessories.reduce((sum, a) => sum + (a.purchasePrice ?? 0) * a.quantity, 0);
    const accessoriesSale = itemAccessories.reduce((sum, a) => sum + (a.salePrice ?? 0) * a.quantity, 0);
    return {
      ...item,
      accessories: itemAccessories.map((a) => ({
        id: a.accessoryId,
        name: a.accessoryName,
        quantity: a.quantity,
      })),
      accessoriesCost,
      accessoriesSale,
    };
  });
}

export async function getMontajeItemPhotoPath(itemId: string) {
  const [row] = await db
    .select({ photoPath: montajeItems.photoPath })
    .from(montajeItems)
    .where(eq(montajeItems.id, itemId));
  return row?.photoPath ?? null;
}

export async function getMontajeItemInstalledPhotoPath(itemId: string) {
  const [row] = await db
    .select({ installedPhotoPath: montajeItems.installedPhotoPath })
    .from(montajeItems)
    .where(eq(montajeItems.id, itemId));
  return row?.installedPhotoPath ?? null;
}

// Para el enlace público de instalación (/i/[token]) — sin sesión, así que la única
// manera de encontrar el montaje es por su token.
export async function getMontajeByInstallToken(token: string) {
  const [row] = await db
    .select({
      id: montajes.id,
      clientName: montajes.clientName,
      address: montajes.address,
      startedAt: montajes.startedAt,
    })
    .from(montajes)
    .where(eq(montajes.installToken, token));
  return row ?? null;
}

// Confirma que un ítem realmente pertenece al montaje dueño de ESE token — la usan tanto
// las acciones públicas (src/app/i/actions.ts) como las rutas que sirven las fotos, para
// que un token válido de un montaje no sirva para tocar/ver datos de otro.
export async function isItemAccessibleByToken(itemId: string, token: string): Promise<boolean> {
  const [row] = await db
    .select({ installToken: montajes.installToken })
    .from(montajeItems)
    .innerJoin(montajes, eq(montajes.id, montajeItems.montajeId))
    .where(eq(montajeItems.id, itemId));
  return !!row?.installToken && row.installToken === token;
}

// Igual que isItemAccessibleByToken, pero para el manual de un SENSOR (no es dato de un
// ítem puntual) — el token es válido para verlo si ese montaje realmente incluye ese
// sensor entre sus ítems, así un enlace no sirve para curiosear manuales de sensores que
// no están en ESE montaje.
export async function isSensorAccessibleByToken(sensorId: string, token: string): Promise<boolean> {
  const [row] = await db
    .select({ id: montajeItems.id })
    .from(montajeItems)
    .innerJoin(montajes, eq(montajes.id, montajeItems.montajeId))
    .where(and(eq(montajeItems.sensorId, sensorId), eq(montajes.installToken, token)))
    .limit(1);
  return !!row;
}
