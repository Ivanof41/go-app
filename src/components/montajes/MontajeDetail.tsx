"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { clsx } from "@/lib/clsx";
import { statusFor } from "@/lib/montajes/status";
import { undoStartMontajeAction } from "@/app/(protected)/montajes/actions";
import { MontajeItemsList, type MontajeItemRow } from "@/components/montajes/MontajeItemsList";
import { MontajeItemModal } from "@/components/montajes/MontajeItemModal";
import { StartMontajeModal } from "@/components/montajes/StartMontajeModal";

type SensorOption = { id: string; name: string; type: string };
type AccessoryOption = { id: string; name: string; type: string };

function formatMoney(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function MontajeDetail({
  montajeId,
  startedAt,
  items,
  sensorOptions,
  accessoryOptions,
}: {
  montajeId: string;
  startedAt: Date | null;
  items: MontajeItemRow[];
  sensorOptions: SensorOption[];
  accessoryOptions: AccessoryOption[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);
  const [isUndoing, startUndo] = useTransition();

  const installedCount = items.filter((item) => item.installedAt).length;
  const status = statusFor(startedAt, items.length, installedCount);
  const StatusIcon = status.icon;

  const totalCost = items.reduce((sum, item) => sum + (item.sensorPurchasePrice ?? 0) + item.accessoriesCost, 0);
  const totalSale = items.reduce((sum, item) => sum + (item.sensorSalePrice ?? 0) + item.accessoriesSale, 0);

  function handleUndoStart() {
    setUndoError(null);
    startUndo(async () => {
      const formData = new FormData();
      formData.set("id", montajeId);
      const result = await undoStartMontajeAction(undefined, formData);
      if (result?.error) setUndoError(result.error);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-c24-text-muted uppercase">
            Sensores a instalar ({items.length})
          </h2>
          <span className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
            <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
            {status.label}
          </span>
          {status.note && <span className="text-xs text-c24-text-muted">{status.note}</span>}
        </div>

        <div className="flex items-center gap-2">
          {!startedAt && items.length > 0 && (
            <Button type="button" variant="ghost" fullWidth={false} onClick={() => setShowStart(true)}>
              Marcar como iniciado
            </Button>
          )}
          {startedAt && installedCount === 0 && (
            <Button type="button" variant="ghost" fullWidth={false} disabled={isUndoing} onClick={handleUndoStart}>
              {isUndoing ? "Deshaciendo…" : "Deshacer inicio"}
            </Button>
          )}
          {items.length > 0 && (
            <Button type="button" fullWidth={false} onClick={() => setShowAdd(true)}>
              <span className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" strokeWidth={1.75} /> Añadir sensor
              </span>
            </Button>
          )}
        </div>
      </div>

      {undoError && <p className="mt-2 rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{undoError}</p>}

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-6 rounded-md border border-c24-border bg-white px-4 py-3 text-sm">
          <span className="text-c24-text-muted">
            Costo: <span className="font-medium text-c24-navy">{formatMoney(totalCost)}</span>
          </span>
          <span className="text-c24-text-muted">
            Venta: <span className="font-medium text-c24-navy">{formatMoney(totalSale)}</span>
          </span>
          <span className="text-c24-text-muted">
            Beneficio: <span className="font-medium text-c24-navy">{formatMoney(totalSale - totalCost)}</span>
          </span>
        </div>
      )}

      <div className="mt-3">
        {items.length === 0 ? (
          <Card dashed className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-white/60">Todavía no hay sensores añadidos a este montaje.</p>
            <Button type="button" dark fullWidth={false} onClick={() => setShowAdd(true)}>
              <span className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" strokeWidth={1.75} /> Añadir sensor
              </span>
            </Button>
          </Card>
        ) : (
          <MontajeItemsList
            montajeId={montajeId}
            items={items}
            sensorOptions={sensorOptions}
            accessoryOptions={accessoryOptions}
          />
        )}
      </div>

      {showAdd && (
        <MontajeItemModal
          montajeId={montajeId}
          sensorOptions={sensorOptions}
          accessoryOptions={accessoryOptions}
          onSaved={() => setShowAdd(false)}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showStart && (
        <StartMontajeModal
          montajeId={montajeId}
          items={items}
          onDone={() => setShowStart(false)}
          onClose={() => setShowStart(false)}
        />
      )}
    </div>
  );
}
