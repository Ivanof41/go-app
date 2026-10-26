"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { getSensorTypeIcon, getSensorTypeLabel } from "@/lib/inventario/sensor-types";
import { formatEuro } from "@/lib/inventario/format";
import { clsx } from "@/lib/clsx";
import type { StockTotalRow } from "@/lib/inventario/stock-totals";

type SortKey = "type" | "itemName" | "kind" | "quantity" | "zoneCount" | "purchasePrice" | "salePrice";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "type", label: "Tipo" },
  { key: "itemName", label: "Nombre" },
  { key: "kind", label: "Clase" },
  { key: "quantity", label: "Cantidad total" },
  { key: "zoneCount", label: "Zonas" },
  { key: "purchasePrice", label: "P. compra" },
  { key: "salePrice", label: "P. venta" },
];

export function StockTotalsTable({ rows }: { rows: StockTotalRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("itemName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      let cmp: number;
      if (sortKey === "type") {
        cmp = getSensorTypeLabel(a.itemType).localeCompare(getSensorTypeLabel(b.itemType));
      } else if (sortKey === "kind") {
        cmp = a.kind.localeCompare(b.kind);
      } else if (sortKey === "quantity" || sortKey === "zoneCount") {
        cmp = a[sortKey] - b[sortKey];
      } else if (sortKey === "purchasePrice" || sortKey === "salePrice") {
        cmp = (a[sortKey] ?? -Infinity) - (b[sortKey] ?? -Infinity);
      } else {
        cmp = a.itemName.localeCompare(b.itemName);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, sortKey, sortDir]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xs font-semibold tracking-wide text-c24-text-muted uppercase">
        Total por sensor/accesorio (todas las zonas)
      </h2>
      <div className="-mx-3 mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-c24-border text-left text-c24-text-muted">
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                const SortIcon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
                return (
                  <th key={col.key} className="px-3 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={clsx(
                        "group flex items-center gap-1 transition hover:text-c24-navy",
                        active && "text-c24-navy",
                      )}
                    >
                      {col.label}
                      <SortIcon
                        className={clsx(
                          "h-3.5 w-3.5 transition-opacity",
                          active ? "opacity-100" : "opacity-40 group-hover:opacity-100",
                        )}
                        strokeWidth={1.75}
                      />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-c24-border">
            {sortedRows.map((row) => {
              const Icon = getSensorTypeIcon(row.itemType);
              return (
                <tr key={`${row.kind}-${row.itemId}`} className="transition hover:bg-c24-teal-light/50">
                  <td className="px-3 py-2.5">
                    <span
                      title={getSensorTypeLabel(row.itemType)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-c24-navy"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-c24-navy">{row.itemName}</td>
                  <td className="px-3 py-2.5 text-c24-navy">{row.kind === "sensor" ? "Sensor" : "Accesorio"}</td>
                  <td className="px-3 py-2.5 text-c24-navy">{row.quantity}</td>
                  <td className="px-3 py-2.5 text-c24-navy">{row.zoneCount}</td>
                  <td className="px-3 py-2.5 text-c24-navy">{formatEuro(row.purchasePrice)}</td>
                  <td className="px-3 py-2.5 text-c24-navy">{formatEuro(row.salePrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
