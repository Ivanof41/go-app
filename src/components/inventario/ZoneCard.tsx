"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ZoneGrid, type ZoneGridCell } from "@/components/inventario/ZoneGrid";
import { CellStockModal } from "@/components/inventario/CellStockModal";
import { formatEuro } from "@/lib/inventario/format";
import { clsx } from "@/lib/clsx";

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

export function ZoneCard({
  zone,
  sensorOptions,
  accessoryOptions,
}: {
  zone: Zone;
  sensorOptions: ItemOption[];
  accessoryOptions: ItemOption[];
}) {
  const [activeCell, setActiveCell] = useState<{ row: number; col: number; current: ZoneGridCell | null } | null>(
    null,
  );

  const totalCost = zone.stock.reduce((sum, s) => sum + ((s.purchasePrice ?? 0) + s.accessoriesCost) * s.quantity, 0);
  const totalSale = zone.stock.reduce((sum, s) => sum + ((s.salePrice ?? 0) + s.accessoriesSale) * s.quantity, 0);
  const profit = totalSale - totalCost;

  return (
    <Card title={zone.name} muted className="flex w-fit flex-col gap-3">
      {zone.location && <p className="text-xs text-white/60">{zone.location}</p>}

      {zone.stock.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/60">
          <span>
            Costo: <span className="font-medium text-white">{formatEuro(totalCost)}</span>
          </span>
          <span>
            Venta: <span className="font-medium text-white">{formatEuro(totalSale)}</span>
          </span>
          <span>
            Beneficio:{" "}
            <span className={clsx("font-medium", profit >= 0 ? "text-c24-teal" : "text-red-400")}>
              {formatEuro(profit)}
            </span>
          </span>
        </div>
      )}

      <ZoneGrid
        zoneId={zone.id}
        rows={zone.rows}
        cols={zone.cols}
        rowLabels={zone.rowLabels}
        stock={zone.stock}
        dark
        onCellClick={(row, col, current) => setActiveCell({ row, col, current })}
      />

      {activeCell && (
        <CellStockModal
          zoneId={zone.id}
          zoneName={zone.name}
          row={activeCell.row}
          col={activeCell.col}
          current={activeCell.current}
          sensorOptions={sensorOptions}
          accessoryOptions={accessoryOptions}
          onSaved={() => setActiveCell(null)}
          onClose={() => setActiveCell(null)}
        />
      )}
    </Card>
  );
}
