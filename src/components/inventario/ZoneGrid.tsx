"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
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
            return (
              <GridCell
                key={`${r}-${c}`}
                row={r}
                col={c}
                current={current}
                compact={compact}
                onClick={() => onCellClick(r, c, current)}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

function GridCell({
  row,
  col,
  current,
  compact,
  onClick,
}: {
  row: number;
  col: number;
  current: ZoneGridCell | null;
  compact?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleEnter() {
    const box = buttonRef.current?.getBoundingClientRect();
    if (box) setTooltipPos({ top: box.top - 8, left: box.left + box.width / 2 });
    setHovered(true);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        className={clsx(
          "relative flex shrink-0 items-center justify-center rounded-md border-2 transition",
          compact ? "h-10 w-10" : "h-14 w-14",
          current
            ? "border-c24-teal/50 bg-c24-teal-light text-c24-navy hover:border-c24-teal"
            : "border-dashed border-c24-navy/25 bg-c24-navy/[0.03] text-c24-text-muted hover:border-c24-teal/60 hover:bg-c24-teal-light/50 hover:text-c24-navy",
        )}
      >
        {current &&
          (() => {
            const Icon = getSensorTypeIcon(current.sensorType);
            return <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.75} />;
          })()}
        {current && (
          <span className="absolute -right-1.5 -bottom-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-c24-navy px-1 text-[10px] font-semibold text-white">
            {current.quantity}
          </span>
        )}
      </button>

      {tooltipPos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: `translate(-50%, ${hovered ? "-100%" : "-90%"})`,
            }}
            className={clsx(
              "pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-c24-navy px-2.5 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-150",
              hovered ? "opacity-100" : "opacity-0",
            )}
          >
            {current ? `${current.sensorName} — ${current.quantity} uds` : `Balda ${row + 1}, posición ${col + 1}`}
          </span>,
          document.body,
        )}
    </>
  );
}
