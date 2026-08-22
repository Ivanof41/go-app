"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clsx } from "@/lib/clsx";
import { upsertSensorStockAction } from "@/app/(protected)/inventario/zonas/actions";

type Option = { id: string; name: string };

export function AddStockModal({
  sensorOptions,
  zoneOptions,
  defaultSensorId,
  defaultZoneId,
  onSaved,
  onClose,
}: {
  sensorOptions: Option[];
  zoneOptions: Option[];
  defaultSensorId?: string;
  defaultZoneId?: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(upsertSensorStockAction, undefined);
  const [mode, setMode] = useState<"delta" | "absolute">("delta");

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  if (sensorOptions.length === 0) {
    return (
      <Modal onClose={onClose}>
        <h3 className="text-base font-semibold text-c24-navy">Agregar stock</h3>
        <p className="mt-3 text-sm text-c24-text-muted">
          Todavía no hay sensores registrados. Crea uno primero en Inventario → Sensores.
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
    <Modal onClose={onClose}>
      <h3 className="text-base font-semibold text-c24-navy">Agregar stock</h3>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="mode" value={mode} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sensorId" className="text-sm font-medium text-c24-navy">
            Sensor
          </label>
          <select
            id="sensorId"
            name="sensorId"
            defaultValue={defaultSensorId ?? ""}
            required
            className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {sensorOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
            name="zoneId"
            defaultValue={defaultZoneId ?? ""}
            required
            className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {zoneOptions.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
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

        {state?.error && (
          <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{state.error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth={false} disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
