import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accessories, brands, providers, sensorAccessories, sensors, technologies } from "@/db/schema";

export async function listBrands() {
  return db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name));
}

export async function listAccessories() {
  return db.select({ id: accessories.id, name: accessories.name }).from(accessories).orderBy(asc(accessories.name));
}

export async function listTechnologies() {
  return db
    .select({ id: technologies.id, name: technologies.name })
    .from(technologies)
    .orderBy(asc(technologies.name));
}

export async function listProviders() {
  return db
    .select({ id: providers.id, name: providers.name })
    .from(providers)
    .orderBy(asc(providers.name));
}

export async function listSensors() {
  return db
    .select({
      id: sensors.id,
      name: sensors.name,
      type: sensors.type,
      brandId: sensors.brandId,
      technologyId: sensors.technologyId,
      providerId: sensors.providerId,
      brandName: brands.name,
      technologyName: technologies.name,
      providerName: providers.name,
      purchasePrice: sensors.purchasePrice,
      salePrice: sensors.salePrice,
      notes: sensors.notes,
    })
    .from(sensors)
    .leftJoin(brands, eq(sensors.brandId, brands.id))
    .leftJoin(technologies, eq(sensors.technologyId, technologies.id))
    .leftJoin(providers, eq(sensors.providerId, providers.id))
    .orderBy(asc(sensors.name));
}

export async function getSensorById(id: string) {
  const [row] = await db
    .select({
      id: sensors.id,
      name: sensors.name,
      type: sensors.type,
      brandId: sensors.brandId,
      technologyId: sensors.technologyId,
      providerId: sensors.providerId,
      purchasePrice: sensors.purchasePrice,
      salePrice: sensors.salePrice,
      notes: sensors.notes,
    })
    .from(sensors)
    .where(eq(sensors.id, id));
  return row ?? null;
}

export async function getSensorAccessories(sensorId: string) {
  return db
    .select({
      accessoryId: sensorAccessories.accessoryId,
      accessoryName: accessories.name,
      quantity: sensorAccessories.quantity,
    })
    .from(sensorAccessories)
    .innerJoin(accessories, eq(accessories.id, sensorAccessories.accessoryId))
    .where(eq(sensorAccessories.sensorId, sensorId))
    .orderBy(asc(accessories.name));
}
