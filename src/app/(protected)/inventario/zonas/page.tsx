import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { ZonasPageActions } from "@/components/inventario/ZonasPageActions";
import { StockTabs } from "@/components/inventario/StockTabs";
import { getAccessoryOptions, getSensorOptions, getZonesWithStock } from "@/lib/inventario/zones-queries";
import { buildStockTotals } from "@/lib/inventario/stock-totals";

export default async function ZonasPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ tab }, zones, sensorOptions, accessoryOptions] = await Promise.all([
    searchParams,
    getZonesWithStock(),
    getSensorOptions(),
    getAccessoryOptions(),
  ]);
  const initialTab = tab === "zonas" ? "zonas" : "resumen";

  const allStock = zones.flatMap((z) => z.stock);
  const totalCost = allStock.reduce((sum, s) => sum + ((s.purchasePrice ?? 0) + s.accessoriesCost) * s.quantity, 0);
  const totalSale = allStock.reduce((sum, s) => sum + ((s.salePrice ?? 0) + s.accessoriesSale) * s.quantity, 0);
  const missingPriceCount = allStock.filter(
    (s) => s.purchasePrice === null || s.salePrice === null || s.accessoriesMissingPrice,
  ).length;
  const stockTotals = buildStockTotals(allStock);

  return (
    <div className="px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-c24-navy">Stock</h1>
          <p className="mt-1 text-sm text-c24-text-muted">Cuánto stock hay en cada zona</p>
        </div>
        <ZonasPageActions zones={zones} sensorOptions={sensorOptions} accessoryOptions={accessoryOptions} />
      </div>

      <div className="mt-8">
        <StockTabs
          zones={zones}
          sensorOptions={sensorOptions}
          accessoryOptions={accessoryOptions}
          stockTotals={stockTotals}
          totalCost={totalCost}
          totalSale={totalSale}
          missingPriceCount={missingPriceCount}
          initialTab={initialTab}
        />
      </div>
    </div>
  );
}
