"use client";

import { getSensorTypeIcon } from "@/lib/inventario/sensor-types";
import { clsx } from "@/lib/clsx";

export type ZoneGridCell = {
  id: string;
  row: number;
  col: number;
  sensorId: string;
  sensorName: string;
  sensorType: string;
  quantity: number;
};

export function ZoneGrid({
  rows,
  cols,
  stock,
  onCellClick,
  compact,
}: {
  rows: number;
  cols: number;
  stock: ZoneGridCell[];
  onCellClick: (row: number, col: number, current: ZoneGridCell | null) => void;
  compact?: boolean;
}) {
  const cellByPosition = new Map(stock.map((s) => [`${s.row}-${s.col}`, s]));

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const current = cellByPosition.get(`${r}-${c}`) ?? null;
            const Icon = current ? getSensorTypeIcon(current.sensorType) : null;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                title={
                  current
                    ? `${current.sensorName} — ${current.quantity} uds`
                    : `Balda ${r + 1}, posición ${c + 1}`
                }
                onClick={() => onCellClick(r, c, current)}
                className={clsx(
                  "relative flex shrink-0 items-center justify-center rounded-md border transition",
                  compact ? "h-10 w-10" : "h-14 w-14",
                  current
                    ? "border-c24-border bg-c24-teal-light/60 text-c24-navy hover:bg-c24-teal-light"
                    : "border-dashed border-c24-border/70 text-c24-text-muted hover:border-c24-teal/50 hover:text-c24-navy",
                )}
              >
                {Icon && <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.75} />}
                {current && (
                  <span className="absolute -right-1.5 -bottom-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-c24-navy px-1 text-[10px] font-semibold text-white">
                    {current.quantity}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
