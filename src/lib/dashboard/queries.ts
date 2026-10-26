import { getZonesWithStock } from "@/lib/inventario/zones-queries";
import { listSensors, listAccessories } from "@/lib/inventario/queries";
import { getMontajeStatusCounts, listMontajesForMap } from "@/lib/montajes/queries";

export async function getDashboardStats() {
  const [{ enCurso, preparados }, zones, sensors, accessories, mapMontajes] = await Promise.all([
    getMontajeStatusCounts(),
    getZonesWithStock(),
    listSensors(),
    listAccessories(),
    listMontajesForMap(),
  ]);

  // Mismo cálculo que la pestaña Resumen de /inventario/zonas (incluye el costo de los
  // accesorios en pack de cada sensor) — así el número de esta tarjeta coincide exacto
  // con el de esa página en vez de ser "parecido".
  const allStock = zones.flatMap((z) => z.stock);
  const stockValue = allStock.reduce((sum, s) => sum + ((s.purchasePrice ?? 0) + s.accessoriesCost) * s.quantity, 0);
  const stockUnits = allStock.reduce((sum, s) => sum + s.quantity, 0);

  // A nivel de catálogo (no de celda de stock): cuántos sensores/accesorios dados de
  // alta todavía no tienen cargado un precio, sin importar si están o no en alguna zona.
  const missingPriceCount =
    sensors.filter((s) => s.purchasePrice === null || s.salePrice === null).length +
    accessories.filter((a) => a.purchasePrice === null || a.salePrice === null).length;

  return {
    montajesEnCurso: enCurso,
    montajesPreparados: preparados,
    stockValue,
    stockUnits,
    missingPriceCount,
    mapMontajes,
  };
}
