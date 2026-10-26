"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ZoneGrid, type ZoneGridCell } from "@/components/inventario/ZoneGrid";
import { CellStockModal } from "@/components/inventario/CellStockModal";
import { clsx } from "@/lib/clsx";

type ItemOption = { id: string; name: string; type: string };
type Kind = "sensor" | "accessory";
type Zone = { id: string; name: string; rows: number; cols: number; rowLabels: string[] | null; stock: ZoneGridCell[] };

export function AddStockModal({
  sensorOptions,
  accessoryOptions,
  zones,
  onSaved,
  onClose,
}: {
  sensorOptions: ItemOption[];
  accessoryOptions: ItemOption[];
  zones: Zone[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const canSensor = sensorOptions.length > 0;
  const canAccessory = accessoryOptions.length > 0;
  const [kind, setKind] = useState<Kind>(canSensor ? "sensor" : "accessory");
  const optionsForKind = kind === "sensor" ? sensorOptions : accessoryOptions;
  const [itemId, setItemId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [cellError, setCellError] = useState<string | null>(null);
  const [pickedCell, setPickedCell] = useState<{ row: number; col: number } | null>(null);

  const zone = zones.find((z) => z.id === zoneId) ?? null;

  function handleKindChange(next: Kind) {
    setKind(next);
    setItemId("");
  }

  if (pickedCell && zone) {
    return (
      <CellStockModal
        zoneId={zone.id}
        zoneName={zone.name}
        row={pickedCell.row}
        col={pickedCell.col}
        current={null}
        sensorOptions={sensorOptions}
        accessoryOptions={accessoryOptions}
        defaultKind={kind}
        defaultItemId={itemId}
        onSaved={onSaved}
        onClose={onClose}
      />
    );
  }

  if (!canSensor && !canAccessory) {
    return (
      <Modal onClose={onClose}>
        <h3 className="text-base font-semibold text-c24-navy">Agregar stock</h3>
        <p className="mt-3 text-sm text-c24-text-muted">
          Todavía no hay sensores ni accesorios registrados. Crea uno primero en Inventario → Sensores.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
            Cerrar
          </Button>
          <Link
            href="/inventario/sensores"
            className="rounded-md bg-c24-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-c24-teal-dark"
          >
            Ir a Sensores
          </Link>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} size={zone ? "lg" : "sm"}>
      <h3 className="text-base font-semibold text-c24-navy">Agregar stock</h3>

      <div className="mt-4 flex flex-col gap-4">
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
          <label htmlFor="itemId" className="text-sm font-medium text-c24-navy">
            {kind === "sensor" ? "Sensor" : "Accesorio"}
          </label>
          <select
            id="itemId"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            required
            className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {optionsForKind.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="zoneId" className="text-sm font-medium text-c24-navy">
            Zona
          </label>
          <select
            id="zoneId"
            value={zoneId}
            onChange={(e) => {
              setZoneId(e.target.value);
              setCellError(null);
            }}
            required
            className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        {zone && itemId && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-c24-navy">Elige una posición vacía</span>
            <ZoneGrid
              zoneId={zone.id}
              rows={zone.rows}
              cols={zone.cols}
              rowLabels={zone.rowLabels}
              stock={zone.stock}
              compact
              onCellClick={(row, col, current) => {
                if (current) {
                  setCellError(`Esa posición ya la ocupa "${current.itemName}". Elige otra.`);
                  return;
                }
                setCellError(null);
                setPickedCell({ row, col });
              }}
            />
            {cellError && <p className="text-sm text-c24-danger">{cellError}</p>}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
