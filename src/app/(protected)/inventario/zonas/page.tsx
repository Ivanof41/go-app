import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";
import { ZoneCard } from "@/components/inventario/ZoneCard";
import { ZonasPageActions } from "@/components/inventario/ZonasPageActions";
import { getSensorOptions, getZonesWithStock } from "@/lib/inventario/zones-queries";
import { formatEuro } from "@/lib/inventario/format";
import { clsx } from "@/lib/clsx";

export default async function ZonasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const zones = await getZonesWithStock();
  const sensorOptions = await getSensorOptions();

  const allStock = zones.flatMap((z) => z.stock);
  const totalCost = allStock.reduce((sum, s) => sum + (s.purchasePrice ?? 0) * s.quantity, 0);
  const totalSale = allStock.reduce((sum, s) => sum + (s.salePrice ?? 0) * s.quantity, 0);
  const totalProfit = totalSale - totalCost;
  const missingPriceCount = allStock.filter((s) => s.purchasePrice === null || s.salePrice === null).length;

  return (
    <div className="px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-c24-navy">Stock</h1>
          <p className="mt-1 text-sm text-c24-text-muted">Cuánto stock de sensores hay en cada zona</p>
        </div>
        <ZonasPageActions zones={zones} sensorOptions={sensorOptions} />
      </div>

      {allStock.length > 0 && (
        <>
          <Card className="mt-8 flex w-fit flex-wrap gap-8">
            <div>
              <p className="text-xs text-c24-text-muted">Costo total</p>
              <p className="text-xl font-semibold text-c24-navy">{formatEuro(totalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-c24-text-muted">Venta total</p>
              <p className="text-xl font-semibold text-c24-navy">{formatEuro(totalSale)}</p>
            </div>
            <div>
              <p className="text-xs text-c24-text-muted">Beneficio estimado</p>
              <p
                className={clsx(
                  "text-xl font-semibold",
                  totalProfit >= 0 ? "text-c24-teal-dark" : "text-c24-danger",
                )}
              >
                {formatEuro(totalProfit)}
              </p>
            </div>
          </Card>
          {missingPriceCount > 0 && (
            <p className="mt-2 text-xs text-c24-text-muted">
              {missingPriceCount} registro(s) de stock no tienen precio de compra/venta definido y no están
              incluidos en estos totales.
            </p>
          )}
        </>
      )}

      {zones.length === 0 ? (
        <Card dashed className="mt-8 flex flex-col items-center gap-1 py-12 text-center">
          <p className="text-sm text-c24-text-muted">Aún no hay zonas creadas</p>
        </Card>
      ) : (
        <div className="mt-8 flex flex-wrap items-start gap-4">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} sensorOptions={sensorOptions} />
          ))}
        </div>
      )}
    </div>
  );
}
