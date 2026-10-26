"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconSelect } from "@/components/ui/IconSelect";
import { EntitySelectField } from "@/components/inventario/EntitySelectField";
import { SENSOR_TYPES } from "@/lib/inventario/sensor-types";
import {
  createAccessoryAction,
  updateAccessoryAction,
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
} from "@/app/(protected)/inventario/sensores/actions";

type Option = { id: string; name: string };

export type AccessoryFormValues = {
  id: string;
  name: string;
  type: string;
  brandId: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
};

export function AccessoryForm({
  accessory,
  title,
  brands,
}: {
  accessory?: AccessoryFormValues;
  title: string;
  brands: Option[];
}) {
  const action = accessory ? updateAccessoryAction : createAccessoryAction;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [type, setType] = useState<string>(accessory?.type ?? "otro");

  const HeaderIcon = SENSOR_TYPES.find((t) => t.value === type)?.icon ?? SENSOR_TYPES[SENSOR_TYPES.length - 1].icon;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {accessory && <input type="hidden" name="id" defaultValue={accessory.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-c24-teal-light text-c24-navy">
          <HeaderIcon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h3 className="text-base font-semibold text-c24-navy">{title}</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-c24-navy">
          Nombre
        </label>
        <Input id="name" name="name" defaultValue={accessory?.name} required />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-c24-navy">Ícono</span>
          <IconSelect options={SENSOR_TYPES} value={type} onChange={setType} iconOnly />
        </div>
        <div className="min-w-64 flex-1">
          <EntitySelectField
            name="brandId"
            label="Marca"
            initialOptions={brands}
            defaultValue={accessory?.brandId ?? undefined}
            createAction={createBrandAction}
            createModalTitle="Nueva marca"
            updateAction={updateBrandAction}
            deleteAction={deleteBrandAction}
            manageModalTitle="Gestionar marcas"
            manageNewPlaceholder="Nueva marca…"
            manageEmptyText="Sin marcas todavía."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="purchasePrice" className="text-sm font-medium text-c24-navy">
            Precio compra (€)
          </label>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={accessory?.purchasePrice ?? undefined}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="salePrice" className="text-sm font-medium text-c24-navy">
            Precio venta (€)
          </label>
          <Input
            id="salePrice"
            name="salePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={accessory?.salePrice ?? undefined}
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : accessory ? "Guardar cambios" : "Crear accesorio"}
      </Button>
    </form>
  );
}
