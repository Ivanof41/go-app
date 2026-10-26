import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accessories, brands, providers, sensors, technologies } from "@/db/schema";

export async function listBrands() {
  return db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name));
}

export async function listAccessories() {
  return db
    .select({
      id: accessories.id,
      name: accessories.name,
      type: accessories.type,
      brandId: accessories.brandId,
      brandName: brands.name,
      purchasePrice: accessories.purchasePrice,
      salePrice: accessories.salePrice,
    })
    .from(accessories)
    .leftJoin(brands, eq(accessories.brandId, brands.id))
    .orderBy(asc(accessories.name));
}

export async function getAccessoryById(id: string) {
  const [row] = await db
    .select({
      id: accessories.id,
      name: accessories.name,
      type: accessories.type,
      brandId: accessories.brandId,
      purchasePrice: accessories.purchasePrice,
      salePrice: accessories.salePrice,
    })
    .from(accessories)
    .where(eq(accessories.id, id));
  return row ?? null;
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
      manualPath: sensors.manualPath,
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
      manualPath: sensors.manualPath,
    })
    .from(sensors)
    .where(eq(sensors.id, id));
  return row ?? null;
}

