"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AddStockModal } from "@/components/inventario/AddStockModal";
import { removeSensorStockAction } from "@/app/(protected)/inventario/zonas/actions";

type StockRow = { id: string; sensorId: string; sensorName: string; quantity: number };
type Zone = { id: string; name: string; location: string | null; stock: StockRow[] };
type Option = { id: string; name: string };

export function ZoneCard({
  zone,
  sensorOptions,
  zoneOptions,
}: {
  zone: Zone;
  sensorOptions: Option[];
  zoneOptions: Option[];
}) {
  const [editingRow, setEditingRow] = useState<StockRow | null>(null);
  const [removingRow, setRemovingRow] = useState<StockRow | null>(null);
  const [isRemoving, startRemove] = useTransition();

  function handleRemove(row: StockRow) {
    startRemove(async () => {
      const formData = new FormData();
      formData.set("id", row.id);
      await removeSensorStockAction(undefined, formData);
      setRemovingRow(null);
    });
  }

  return (
    <Card title={zone.name} className="flex flex-col gap-3">
      {zone.location && <p className="text-xs text-c24-text-muted">{zone.location}</p>}

      {zone.stock.length === 0 ? (
        <p className="text-sm text-c24-text-muted">Sin stock registrado en esta zona</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {zone.stock.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-c24-navy">{row.sensorName}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-c24-navy">{row.quantity} uds</span>
                <button
                  type="button"
                  aria-label="Ajustar"
                  onClick={() => setEditingRow(row)}
                  className="text-c24-text-muted hover:text-c24-navy"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label="Quitar"
                  disabled={isRemoving && removingRow?.id === row.id}
                  onClick={() => {
                    setRemovingRow(row);
                    handleRemove(row);
                  }}
                  className="text-c24-text-muted hover:text-c24-danger disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {editingRow && (
        <AddStockModal
          sensorOptions={sensorOptions}
          zoneOptions={zoneOptions}
          defaultSensorId={editingRow.sensorId}
          defaultZoneId={zone.id}
          onSaved={() => setEditingRow(null)}
          onClose={() => setEditingRow(null)}
        />
      )}
    </Card>
  );
}
