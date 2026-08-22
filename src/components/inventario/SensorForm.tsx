"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EntitySelectField } from "@/components/inventario/EntitySelectField";
import { SENSOR_TYPES, type SensorTypeValue } from "@/lib/inventario/sensor-types";
import { clsx } from "@/lib/clsx";
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
  type: SensorTypeValue;
  brandId: string;
  technologyId: string;
  providerId: string;
  purchasePrice: number;
  salePrice: number;
  notes: string | null;
};

export function SensorForm({
  sensor,
  title,
  brands,
  technologies,
  providers,
  onSaved,
}: {
  sensor?: SensorFormValues;
  title: string;
  brands: Option[];
  technologies: Option[];
  providers: Option[];
  onSaved: () => void;
}) {
  const action = sensor ? updateSensorAction : createSensorAction;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [type, setType] = useState<SensorTypeValue>(sensor?.type ?? "otro");

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  const HeaderIcon = SENSOR_TYPES.find((t) => t.value === type)?.icon ?? SENSOR_TYPES[SENSOR_TYPES.length - 1].icon;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {sensor && <input type="hidden" name="id" defaultValue={sensor.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-c24-teal-light text-c24-navy">
          <HeaderIcon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h3 className="text-base font-semibold text-c24-navy">{title}</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-c24-navy">
          Nombre / modelo
        </label>
        <Input id="name" name="name" defaultValue={sensor?.name} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-c24-navy">Tipo de sensor</span>
        <div className="grid grid-cols-4 gap-2">
          {SENSOR_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              aria-pressed={type === t.value}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-md border px-1.5 py-2 text-center transition",
                type === t.value
                  ? "border-c24-teal bg-c24-teal-light text-c24-navy"
                  : "border-c24-border text-c24-text-muted hover:border-c24-teal/50 hover:text-c24-navy",
              )}
            >
              <t.icon className="h-[18px] w-[18px]" strokeWidth={type === t.value ? 2 : 1.75} />
              <span className="text-[11px] leading-tight font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
      </div>

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
