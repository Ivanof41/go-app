"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AddressMapPicker } from "@/components/montajes/AddressMapPicker";
import { createMontajeAction, updateMontajeAction } from "@/app/(protected)/montajes/actions";

export type MontajeFormValues = {
  id: string;
  clientName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
};

export function MontajeForm({
  montaje,
  onSaved,
  onCancel,
}: {
  montaje?: MontajeFormValues;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const action = montaje ? updateMontajeAction : createMontajeAction;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [address, setAddress] = useState(montaje?.address ?? "");
  const [latitude, setLatitude] = useState<number | null>(montaje?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(montaje?.longitude ?? null);

  // Editar no navega (a diferencia de crear, que redirige) — el propio componente que
  // embebe este form en modo edición cierra su vista al ver un guardado exitoso.
  useEffect(() => {
    if (montaje && state?.success) onSaved?.();
  }, [state?.success, montaje, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {montaje && <input type="hidden" name="id" value={montaje.id} />}
      <h3 className="text-base font-semibold text-c24-navy">{montaje ? "Editar montaje" : "Nuevo montaje"}</h3>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="clientName" className="text-sm font-medium text-c24-navy">
          Cliente
        </label>
        <Input id="clientName" name="clientName" defaultValue={montaje?.clientName} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-c24-navy">Dirección</span>
        <AddressMapPicker
          initialPosition={
            montaje?.latitude != null && montaje?.longitude != null ? [montaje.latitude, montaje.longitude] : undefined
          }
          onLocationChange={(lat, lng, label) => {
            setLatitude(lat);
            setLongitude(lng);
            if (label) setAddress(label);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="address" className="text-sm font-medium text-c24-navy">
          Dirección (editable)
        </label>
        <Input id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>

      <input type="hidden" name="latitude" value={latitude ?? ""} />
      <input type="hidden" name="longitude" value={longitude ?? ""} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-c24-navy">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={montaje?.notes ?? ""}
          rows={3}
          className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{state.error}</p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" fullWidth={false} onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button type="submit" fullWidth={!onCancel} disabled={isPending}>
          {isPending ? "Guardando…" : montaje ? "Guardar cambios" : "Crear montaje"}
        </Button>
      </div>
    </form>
  );
}
