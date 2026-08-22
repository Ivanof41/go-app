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
      sensorId: sensors.id,
      sensorName: sensors.name,
    })
    .from(sensorStock)
    .innerJoin(sensors, eq(sensors.id, sensorStock.sensorId));

  return allZones.map((zone) => ({
    ...zone,
    stock: stockRows.filter((row) => row.zoneId === zone.id),
  }));
}

export async function getSensorOptions() {
  return db.select({ id: sensors.id, name: sensors.name }).from(sensors).orderBy(asc(sensors.name));
}
