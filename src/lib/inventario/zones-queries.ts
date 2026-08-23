import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sensors, sensorStock, zones } from "@/db/schema";

export async function getZonesWithStock() {
  const allZones = await db.select().from(zones).orderBy(asc(zones.position), asc(zones.name));

  const stockRows = await db
    .select({
      id: sensorStock.id,
      zoneId: sensorStock.zoneId,
      quantity: sensorStock.quantity,
      row: sensorStock.row,
      col: sensorStock.col,
      sensorId: sensors.id,
      sensorName: sensors.name,
      sensorType: sensors.type,
      purchasePrice: sensors.purchasePrice,
      salePrice: sensors.salePrice,
    })
    .from(sensorStock)
    .innerJoin(sensors, eq(sensors.id, sensorStock.sensorId));

  return allZones.map((zone) => ({
    ...zone,
    stock: stockRows.filter((row) => row.zoneId === zone.id),
  }));
}

export async function getSensorOptions() {
  return db
    .select({ id: sensors.id, name: sensors.name, type: sensors.type })
    .from(sensors)
    .orderBy(asc(sensors.name));
}

// Lista liviana para /inventario/zonas/gestionar: no necesita el stock de
// getZonesWithStock(), solo los campos propios de la zona.
export async function listZones() {
  return db
    .select({ id: zones.id, name: zones.name, location: zones.location, rows: zones.rows, cols: zones.cols })
    .from(zones)
    .orderBy(asc(zones.position), asc(zones.name));
}
