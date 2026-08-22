"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ZoneGrid, type ZoneGridCell } from "@/components/inventario/ZoneGrid";
import { CellStockModal } from "@/components/inventario/CellStockModal";

type Zone = { id: string; name: string; location: string | null; rows: number; cols: number; stock: ZoneGridCell[] };
type SensorOption = { id: string; name: string; type: string };

export function ZoneCard({ zone, sensorOptions }: { zone: Zone; sensorOptions: SensorOption[] }) {
  const [activeCell, setActiveCell] = useState<{ row: number; col: number; current: ZoneGridCell | null } | null>(
    null,
  );

  return (
    <Card title={zone.name} className="flex w-fit flex-col gap-3">
      {zone.location && <p className="text-xs text-c24-text-muted">{zone.location}</p>}

      <ZoneGrid
        rows={zone.rows}
        cols={zone.cols}
        stock={zone.stock}
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
          onSaved={() => setActiveCell(null)}
          onClose={() => setActiveCell(null)}
        />
      )}
    </Card>
  );
}
