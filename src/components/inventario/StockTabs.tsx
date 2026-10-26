"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ZoneCard } from "@/components/inventario/ZoneCard";
import { StockTotalsTable } from "@/components/inventario/StockTotalsTable";
import { formatEuro } from "@/lib/inventario/format";
import { clsx } from "@/lib/clsx";
import type { ZoneGridCell } from "@/components/inventario/ZoneGrid";
import type { StockTotalRow } from "@/lib/inventario/stock-totals";

type StockRow = ZoneGridCell & {
  purchasePrice: number | null;
  salePrice: number | null;
  accessoriesCost: number;
  accessoriesSale: number;
};
type Zone = {
  id: string;
  name: string;
  location: string | null;
  rows: number;
  cols: number;
  rowLabels: string[] | null;
  stock: StockRow[];
};
type ItemOption = { id: string; name: string; type: string };

export function StockTabs({
  zones,
  sensorOptions,
  accessoryOptions,
  stockTotals,
  totalCost,
  totalSale,
  missingPriceCount,
  initialTab,
}: {
  zones: Zone[];
  sensorOptions: ItemOption[];
  accessoryOptions: ItemOption[];
  stockTotals: StockTotalRow[];
  totalCost: number;
  totalSale: number;
  missingPriceCount: number;
  initialTab: "resumen" | "zonas";
}) {
  const [tab, setTab] = useState<"resumen" | "zonas">(initialTab);
  const totalProfit = totalSale - totalCost;
  const hasStock = stockTotals.length > 0;

  return (
    <div>
      <div className="flex w-fit rounded-md border border-c24-border p-1">
        <button
          type="button"
          onClick={() => setTab("resumen")}
          className={clsx(
            "rounded-md px-4 py-1.5 text-sm font-medium transition",
            tab === "resumen" ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
          )}
        >
          Resumen
        </button>
        <button
          type="button"
          onClick={() => setTab("zonas")}
          className={clsx(
            "rounded-md px-4 py-1.5 text-sm font-medium transition",
            tab === "zonas" ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
          )}
        >
          Zonas ({zones.length})
        </button>
      </div>

      <div className="mt-6">
        {tab === "resumen" ? (
          <>
            {hasStock && (
              <>
                <Card className="flex w-fit flex-wrap gap-8">
                  <div>
                    <p className="text-xs text-white/60">Costo total</p>
                    <p className="text-xl font-semibold text-white">{formatEuro(totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Venta total</p>
                    <p className="text-xl font-semibold text-white">{formatEuro(totalSale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Beneficio estimado</p>
                    <p className={clsx("text-xl font-semibold", totalProfit >= 0 ? "text-c24-teal" : "text-red-400")}>
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
            <StockTotalsTable rows={stockTotals} />
          </>
        ) : zones.length === 0 ? (
          <Card dashed className="flex flex-col items-center gap-1 py-12 text-center">
            <p className="text-sm text-white/60">Aún no hay zonas creadas</p>
          </Card>
        ) : (
          <div className="flex flex-wrap items-start gap-4">
            {zones.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} sensorOptions={sensorOptions} accessoryOptions={accessoryOptions} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
