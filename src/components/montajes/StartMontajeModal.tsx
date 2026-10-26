"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { startMontajeAction } from "@/app/(protected)/montajes/actions";
import type { MontajeItemRow } from "@/components/montajes/MontajeItemsList";

type StartResult = {
  warnings?: string[];
  stockSummary?: { name: string; deducted: number; remaining: number }[];
};

export function StartMontajeModal({
  montajeId,
  items,
  onDone,
  onClose,
}: {
  montajeId: string;
  items: MontajeItemRow[];
  onDone: () => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StartResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Agregado por nombre solo para la vista previa — el descuento real en el servidor va
  // línea por línea con su montajeItemId (ver deductAndRecordForItem en actions.ts).
  const sensorCounts = new Map<string, number>();
  for (const item of items) sensorCounts.set(item.sensorName, (sensorCounts.get(item.sensorName) ?? 0) + 1);
  const accessoryCounts = new Map<string, number>();
  for (const item of items) {
    for (const a of item.accessories) accessoryCounts.set(a.name, (accessoryCounts.get(a.name) ?? 0) + a.quantity);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("montajeId", montajeId);
      const response = await startMontajeAction(undefined, formData);
      if (response?.error) {
        setError(response.error);
        return;
      }
      // Siempre se detiene a mostrar qué quedó de stock antes de cerrar — no solo cuando
      // hay avisos de falta de stock, para que "tenías 16, ahora quedan 13" se vea sí o sí
      // y no haya que ir a Stock a revisarlo aparte.
      setResult({ warnings: response?.warnings, stockSummary: response?.stockSummary });
    });
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-base font-semibold text-c24-navy">Marcar como iniciado</h3>
      <p className="mt-1 text-sm text-c24-text-muted">
        Se descontará del inventario lo que se va a preparar para este montaje.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <div className="rounded-md border border-c24-border bg-white p-3">
          <p className="text-xs font-semibold tracking-wide text-c24-text-muted uppercase">
            {result ? "Se descontó" : "Se descontará"}
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-c24-navy">
            {result?.stockSummary ? (
              result.stockSummary.map((s, i) => (
                <li key={i}>
                  {s.deducted}× {s.name} — quedan {s.remaining}
                </li>
              ))
            ) : (
              <>
                {[...sensorCounts.entries()].map(([name, qty]) => (
                  <li key={`sensor-${name}`}>
                    {qty}× {name}
                  </li>
                ))}
                {[...accessoryCounts.entries()].map(([name, qty]) => (
                  <li key={`accessory-${name}`}>
                    {qty}× {name}
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>

        {result?.warnings && result.warnings.length > 0 && (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="font-medium">Avisos:</p>
            <ul className="mt-1 list-disc pl-4">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        {error && <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" fullWidth={false} onClick={result ? onDone : onClose} disabled={isPending}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && (
            <Button type="button" fullWidth={false} disabled={isPending} onClick={handleConfirm}>
              {isPending ? "Iniciando…" : "Confirmar inicio"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
