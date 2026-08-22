import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, providers, sensors, technologies } from "@/db/schema";

export async function listBrands() {
  return db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name));
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
    .innerJoin(brands, eq(sensors.brandId, brands.id))
    .innerJoin(technologies, eq(sensors.technologyId, technologies.id))
    .innerJoin(providers, eq(sensors.providerId, providers.id))
    .orderBy(asc(sensors.name));
}
