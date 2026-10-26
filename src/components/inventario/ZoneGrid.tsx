"use client";

import { useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import { getSensorTypeIcon } from "@/lib/inventario/sensor-types";
import { renameZoneRowAction } from "@/app/(protected)/inventario/zonas/actions";
import { clsx } from "@/lib/clsx";

export type ZoneGridCell = {
  id: string;
  row: number;
  col: number;
  kind: "sensor" | "accessory";
  itemId: string;
  itemName: string;
  itemType: string;
  quantity: number;
};

function rowLabelFor(rowLabels: string[] | null | undefined, row: number) {
  const custom = rowLabels?.[row];
  return custom && custom.trim() ? custom : `Balda ${row + 1}`;
}

export function ZoneGrid({
  zoneId,
  rows,
  cols,
  rowLabels,
  stock,
  onCellClick,
  compact,
  dark,
}: {
  zoneId: string;
  rows: number;
  cols: number;
  rowLabels?: string[] | null;
  stock: ZoneGridCell[];
  onCellClick: (row: number, col: number, current: ZoneGridCell | null) => void;
  compact?: boolean;
  // ZoneGrid vive en dos fondos distintos: la Card oscura de Zonas y el Modal blanco de
  // "Agregar stock" — no alcanza con inferirlo de `compact` (que solo controla tamaño),
  // así que cada llamador dice explícitamente en qué fondo está.
  dark?: boolean;
}) {
  const cellByPosition = new Map(stock.map((s) => [`${s.row}-${s.col}`, s]));

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-2">
            <RowLabel
              zoneId={zoneId}
              row={r}
              label={rowLabels?.[r] ?? ""}
              editable={!compact}
              compact={compact}
              dark={dark}
            />
            <div className="flex gap-2">
              {Array.from({ length: cols }).map((_, c) => {
                const current = cellByPosition.get(`${r}-${c}`) ?? null;
                return (
                  <GridCell
                    key={c}
                    col={c}
                    rowLabel={rowLabelFor(rowLabels, r)}
                    current={current}
                    compact={compact}
                    dark={dark}
                    onClick={() => onCellClick(r, c, current)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RowLabel({
  zoneId,
  row,
  label,
  editable,
  compact,
  dark,
}: {
  zoneId: string;
  row: number;
  label: string;
  editable: boolean;
  compact?: boolean;
  dark?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [, startTransition] = useTransition();
  const display = label.trim() ? label : `Balda ${row + 1}`;
  const widthClass = compact ? "w-16" : "w-24";

  function handleSave() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed === label) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("zoneId", zoneId);
      formData.set("row", String(row));
      formData.set("label", trimmed);
      await renameZoneRowAction(undefined, formData);
    });
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(label);
            setEditing(false);
          }
        }}
        placeholder={`Balda ${row + 1}`}
        maxLength={60}
        className={clsx(
          "shrink-0 rounded-md border border-c24-teal bg-white px-2 py-1 text-sm text-c24-navy outline-none",
          widthClass,
        )}
      />
    );
  }

  if (!editable) {
    return (
      <span className={clsx("shrink-0 truncate text-sm font-medium", dark ? "text-white" : "text-c24-navy", widthClass)}>
        {display}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={clsx(
        "group flex shrink-0 items-center gap-1 text-left text-sm font-medium",
        dark ? "text-white" : "text-c24-navy",
        widthClass,
      )}
    >
      <span className="truncate">{display}</span>
      <Pencil
        className={clsx(
          "h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100",
          dark ? "text-white/50" : "text-c24-text-muted",
        )}
        strokeWidth={1.75}
      />
    </button>
  );
}

function GridCell({
  col,
  rowLabel,
  current,
  compact,
  dark,
  onClick,
}: {
  col: number;
  rowLabel: string;
  current: ZoneGridCell | null;
  compact?: boolean;
  dark?: boolean;
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
            : dark
              ? "border-dashed border-white/20 bg-white/5 text-white/40 hover:border-c24-teal/60 hover:bg-white/10 hover:text-white"
              : "border-dashed border-c24-navy/25 bg-c24-navy/[0.03] text-c24-text-muted hover:border-c24-teal/60 hover:bg-c24-teal-light/50 hover:text-c24-navy",
        )}
      >
        {current &&
          (() => {
            const Icon = getSensorTypeIcon(current.itemType);
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
            {current
              ? `${current.itemName}${current.kind === "accessory" ? " (accesorio)" : ""} — ${current.quantity} uds`
              : `${rowLabel}, posición ${col + 1}`}
          </span>,
          document.body,
        )}
    </>
  );
}
