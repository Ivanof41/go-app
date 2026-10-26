"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconSelect } from "@/components/ui/IconSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getSensorTypeIcon } from "@/lib/inventario/sensor-types";
import { clsx } from "@/lib/clsx";
import {
  removeSensorStockAction,
  upsertSensorStockAction,
} from "@/app/(protected)/inventario/zonas/actions";
import type { ZoneGridCell } from "@/components/inventario/ZoneGrid";

type ItemOption = { id: string; name: string; type: string };
type Kind = "sensor" | "accessory";

export function CellStockModal({
  zoneId,
  zoneName,
  row,
  col,
  current,
  sensorOptions,
  accessoryOptions,
  defaultKind,
  defaultItemId,
  onSaved,
  onClose,
}: {
  zoneId: string;
  zoneName: string;
  row: number;
  col: number;
  current: ZoneGridCell | null;
  sensorOptions: ItemOption[];
  accessoryOptions: ItemOption[];
  defaultKind?: Kind;
  defaultItemId?: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(upsertSensorStockAction, undefined);
  const [mode, setMode] = useState<"delta" | "absolute">("delta");
  const canSensor = sensorOptions.length > 0;
  const canAccessory = accessoryOptions.length > 0;
  const [kind, setKind] = useState<Kind>(defaultKind ?? (canSensor ? "sensor" : "accessory"));
  const optionsForKind = kind === "sensor" ? sensorOptions : accessoryOptions;
  const [itemId, setItemId] = useState(defaultItemId ?? optionsForKind[0]?.id ?? "");
  const [showRemove, setShowRemove] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isRemoving, startRemove] = useTransition();

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  function handleKindChange(next: Kind) {
    setKind(next);
    const opts = next === "sensor" ? sensorOptions : accessoryOptions;
    setItemId(opts[0]?.id ?? "");
  }

  function handleRemove() {
    if (!current) return;
    setRemoveError(null);
    startRemove(async () => {
      const formData = new FormData();
      formData.set("id", current.id);
      const result = await removeSensorStockAction(undefined, formData);
      if (result?.error) {
        setRemoveError(result.error);
        return;
      }
      onSaved();
    });
  }

  const iconOptionsForKind = optionsForKind.map((o) => ({
    value: o.id,
    label: o.name,
    icon: getSensorTypeIcon(o.type),
  }));

  if (!canSensor && !canAccessory && !current) {
    return (
      <Modal onClose={onClose}>
        <h3 className="text-base font-semibold text-c24-navy">
          {zoneName} — Balda {row + 1}, posición {col + 1}
        </h3>
        <p className="mt-3 text-sm text-c24-text-muted">
          Todavía no hay sensores ni accesorios registrados. Crea uno primero en Inventario → Sensores.
        </p>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-base font-semibold text-c24-navy">
        {zoneName} — Balda {row + 1}, posición {col + 1}
      </h3>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="zoneId" value={zoneId} />
        <input type="hidden" name="row" value={row} />
        <input type="hidden" name="col" value={col} />
        <input type="hidden" name="mode" value={current ? mode : "absolute"} />

        {current ? (
          <>
            <input type="hidden" name={current.kind === "sensor" ? "sensorId" : "accessoryId"} value={current.itemId} />
            <div className="flex items-center gap-2.5 rounded-md border border-c24-border bg-c24-teal-light/40 px-3 py-2.5">
              {(() => {
                const Icon = getSensorTypeIcon(current.itemType);
                return <Icon className="h-[18px] w-[18px] shrink-0 text-c24-navy" strokeWidth={1.75} />;
              })()}
              <span className="text-sm font-medium text-c24-navy">
                {current.itemName}
                {current.kind === "accessory" && (
                  <span className="ml-1.5 text-xs font-normal text-c24-text-muted">(accesorio)</span>
                )}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-c24-navy">Modo</span>
              <div className="flex rounded-md border border-c24-border p-1">
                <button
                  type="button"
                  onClick={() => setMode("delta")}
                  className={clsx(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    mode === "delta" ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
                  )}
                >
                  Sumar/restar
                </button>
                <button
                  type="button"
                  onClick={() => setMode("absolute")}
                  className={clsx(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    mode === "absolute" ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
                  )}
                >
                  Fijar cantidad exacta
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="text-sm font-medium text-c24-navy">
                {mode === "delta" ? "Cantidad (+/-)" : "Cantidad total"}
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="1"
                min={mode === "absolute" ? 0 : undefined}
                placeholder={mode === "delta" ? "ej. 5 o -3" : "ej. 15"}
                required
              />
            </div>
          </>
        ) : (
          <>
            <input type="hidden" name={kind === "sensor" ? "sensorId" : "accessoryId"} value={itemId} />

            {canSensor && canAccessory && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-c24-navy">Tipo</span>
                <div className="flex rounded-md border border-c24-border p-1">
                  <button
                    type="button"
                    onClick={() => handleKindChange("sensor")}
                    className={clsx(
                      "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                      kind === "sensor" ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
                    )}
                  >
                    Sensor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKindChange("accessory")}
                    className={clsx(
                      "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                      kind === "accessory" ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
                    )}
                  >
                    Accesorio
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cell-item" className="text-sm font-medium text-c24-navy">
                {kind === "sensor" ? "Sensor" : "Accesorio"}
              </label>
              <IconSelect id="cell-item" options={iconOptionsForKind} value={itemId} onChange={setItemId} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="text-sm font-medium text-c24-navy">
                Cantidad inicial
              </label>
              <Input id="amount" name="amount" type="number" step="1" min={0} placeholder="ej. 5" required />
            </div>
          </>
        )}

        {state?.error && (
          <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{state.error}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          {current ? (
            <button
              type="button"
              onClick={() => setShowRemove(true)}
              className="text-sm font-medium text-c24-danger hover:underline"
            >
              Quitar de esta posición
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth={false} disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </form>

      {showRemove && (
        <ConfirmDialog
          title="Quitar stock de esta posición"
          description={`¿Quitar "${current?.itemName}" de la balda ${row + 1}, posición ${col + 1}?`}
          isPending={isRemoving}
          error={removeError}
          onConfirm={handleRemove}
          onClose={() => setShowRemove(false)}
        />
      )}
    </Modal>
  );
}
