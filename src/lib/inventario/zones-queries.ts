import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accessories, sensorAccessories, sensors, sensorStock, zones } from "@/db/schema";

export async function getZonesWithStock() {
  const allZones = await db.select().from(zones).orderBy(asc(zones.position), asc(zones.name));

  // Una celda de sensor_stock referencia un sensor O un accesorio (nunca los dos) —
  // por eso los dos leftJoin en vez de un innerJoin como antes, y por eso el mapeo de
  // abajo arma una forma unificada ({kind, itemId, itemName, ...}) en vez de dejar que
  // cada consumidor (ZoneGrid, ZoneCard) tenga que fijarse cuál de los dos vino lleno.
  const stockRows = await db
    .select({
      id: sensorStock.id,
      zoneId: sensorStock.zoneId,
      quantity: sensorStock.quantity,
      row: sensorStock.row,
      col: sensorStock.col,
      sensorId: sensorStock.sensorId,
      accessoryId: sensorStock.accessoryId,
      sensorName: sensors.name,
      sensorType: sensors.type,
      sensorPurchasePrice: sensors.purchasePrice,
      sensorSalePrice: sensors.salePrice,
      accessoryName: accessories.name,
      accessoryType: accessories.type,
      accessoryPurchasePrice: accessories.purchasePrice,
      accessorySalePrice: accessories.salePrice,
    })
    .from(sensorStock)
    .leftJoin(sensors, eq(sensors.id, sensorStock.sensorId))
    .leftJoin(accessories, eq(accessories.id, sensorStock.accessoryId));

  // Costo/venta de cada sensor en stock incluye lo que aportan sus accesorios en pack
  // (precio del accesorio × cantidad del pack) — un sensor "por unidad" cuesta lo suyo
  // más lo de todo lo que lleva enlazado, no solo su propio precio. Esto solo aplica a
  // filas de sensor: un accesorio suelto en una celda no tiene "pack" propio.
  const sensorIds = [...new Set(stockRows.filter((row) => row.sensorId).map((row) => row.sensorId!))];
  const accessoryLinks = sensorIds.length
    ? await db
        .select({
          sensorId: sensorAccessories.sensorId,
          quantity: sensorAccessories.quantity,
          purchasePrice: accessories.purchasePrice,
          salePrice: accessories.salePrice,
        })
        .from(sensorAccessories)
        .innerJoin(accessories, eq(accessories.id, sensorAccessories.accessoryId))
        .where(inArray(sensorAccessories.sensorId, sensorIds))
    : [];

  const accessoryTotalsBySensor = new Map<
    string,
    { cost: number; sale: number; hasMissingPrice: boolean }
  >();
  for (const link of accessoryLinks) {
    const prev = accessoryTotalsBySensor.get(link.sensorId) ?? { cost: 0, sale: 0, hasMissingPrice: false };
    accessoryTotalsBySensor.set(link.sensorId, {
      cost: prev.cost + (link.purchasePrice ?? 0) * link.quantity,
      sale: prev.sale + (link.salePrice ?? 0) * link.quantity,
      hasMissingPrice: prev.hasMissingPrice || link.purchasePrice === null || link.salePrice === null,
    });
  }

  const enrichedStock = stockRows.map((row) => {
    const isSensor = row.sensorId !== null;
    const packTotals = (isSensor && accessoryTotalsBySensor.get(row.sensorId!)) || {
      cost: 0,
      sale: 0,
      hasMissingPrice: false,
    };
    return {
      id: row.id,
      zoneId: row.zoneId,
      quantity: row.quantity,
      row: row.row,
      col: row.col,
      kind: (isSensor ? "sensor" : "accessory") as "sensor" | "accessory",
      itemId: (isSensor ? row.sensorId : row.accessoryId)!,
      itemName: (isSensor ? row.sensorName : row.accessoryName)!,
      itemType: (isSensor ? row.sensorType : row.accessoryType)!,
      purchasePrice: isSensor ? row.sensorPurchasePrice : row.accessoryPurchasePrice,
      salePrice: isSensor ? row.sensorSalePrice : row.accessorySalePrice,
      accessoriesCost: packTotals.cost,
      accessoriesSale: packTotals.sale,
      accessoriesMissingPrice: packTotals.hasMissingPrice,
    };
  });

  return allZones.map((zone) => ({
    ...zone,
    stock: enrichedStock.filter((row) => row.zoneId === zone.id),
  }));
}

export async function getSensorOptions() {
  return db
    .select({ id: sensors.id, name: sensors.name, type: sensors.type })
    .from(sensors)
    .orderBy(asc(sensors.name));
}

export async function getAccessoryOptions() {
  return db
    .select({ id: accessories.id, name: accessories.name, type: accessories.type })
    .from(accessories)
    .orderBy(asc(accessories.name));
}

// Lista liviana para /inventario/zonas/gestionar: no necesita el stock de
// getZonesWithStock(), solo los campos propios de la zona.
export async function listZones() {
  return db
    .select({ id: zones.id, name: zones.name, location: zones.location, rows: zones.rows, cols: zones.cols })
    .from(zones)
    .orderBy(asc(zones.position), asc(zones.name));
}
