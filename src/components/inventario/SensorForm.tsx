"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EntitySelectField } from "@/components/inventario/EntitySelectField";
import {
  createBrandAction,
  createTechnologyAction,
  createProviderAction,
  createSensorAction,
  updateSensorAction,
} from "@/app/(protected)/inventario/sensores/actions";

type Option = { id: string; name: string };

export type SensorFormValues = {
  id: string;
  name: string;
  brandId: string;
  technologyId: string;
  providerId: string;
  purchasePrice: number;
  salePrice: number;
  notes: string | null;
};

export function SensorForm({
  sensor,
  brands,
  technologies,
  providers,
  onSaved,
}: {
  sensor?: SensorFormValues;
  brands: Option[];
  technologies: Option[];
  providers: Option[];
  onSaved: () => void;
}) {
  const action = sensor ? updateSensorAction : createSensorAction;
  const [state, formAction, isPending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {sensor && <input type="hidden" name="id" defaultValue={sensor.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-c24-navy">
          Nombre / modelo
        </label>
        <Input id="name" name="name" defaultValue={sensor?.name} required />
      </div>

      <EntitySelectField
        name="brandId"
        label="Marca"
        initialOptions={brands}
        defaultValue={sensor?.brandId}
        createAction={createBrandAction}
        createModalTitle="Nueva marca"
      />
      <EntitySelectField
        name="technologyId"
        label="Tecnología"
        initialOptions={technologies}
        defaultValue={sensor?.technologyId}
        createAction={createTechnologyAction}
        createModalTitle="Nueva tecnología"
      />
      <EntitySelectField
        name="providerId"
        label="Proveedor"
        initialOptions={providers}
        defaultValue={sensor?.providerId}
        createAction={createProviderAction}
        createModalTitle="Nuevo proveedor"
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="purchasePrice" className="text-sm font-medium text-c24-navy">
            Precio compra
          </label>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={sensor?.purchasePrice}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="salePrice" className="text-sm font-medium text-c24-navy">
            Precio venta
          </label>
          <Input
            id="salePrice"
            name="salePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={sensor?.salePrice}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-c24-navy">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={sensor?.notes ?? ""}
          rows={3}
          className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : sensor ? "Guardar cambios" : "Crear sensor"}
      </Button>
    </form>
  );
}
