"use client";

import { useActionState, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconSelect } from "@/components/ui/IconSelect";
import { EntitySelectField } from "@/components/inventario/EntitySelectField";
import { SENSOR_TYPES } from "@/lib/inventario/sensor-types";
import {
  createBrandAction,
  createTechnologyAction,
  createProviderAction,
  createSensorAction,
  updateSensorAction,
  updateBrandAction,
  deleteBrandAction,
  updateTechnologyAction,
  deleteTechnologyAction,
  updateProviderAction,
  deleteProviderAction,
} from "@/app/(protected)/inventario/sensores/actions";

type Option = { id: string; name: string };

export type SensorFormValues = {
  id: string;
  name: string;
  // string (no SensorTypeValue): la lista de íconos en sensor-types.ts puede crecer o
  // perder valores, y un sensor viejo puede conservar un "type" que ya no está en la lista.
  type: string;
  brandId: string | null;
  technologyId: string | null;
  providerId: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  notes: string | null;
  manualPath: string | null;
};

export function SensorForm({
  sensor,
  title,
  brands,
  technologies,
  providers,
}: {
  sensor?: SensorFormValues;
  title: string;
  brands: Option[];
  technologies: Option[];
  providers: Option[];
}) {
  const action = sensor ? updateSensorAction : createSensorAction;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [type, setType] = useState<string>(sensor?.type ?? "otro");

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
        <IconSelect options={SENSOR_TYPES} value={type} onChange={setType} iconOnly />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <EntitySelectField
          name="brandId"
          label="Marca"
          initialOptions={brands}
          defaultValue={sensor?.brandId ?? undefined}
          createAction={createBrandAction}
          createModalTitle="Nueva marca"
          updateAction={updateBrandAction}
          deleteAction={deleteBrandAction}
          manageModalTitle="Gestionar marcas"
          manageNewPlaceholder="Nueva marca…"
          manageEmptyText="Sin marcas todavía."
        />
        <EntitySelectField
          name="technologyId"
          label="Tecnología"
          initialOptions={technologies}
          defaultValue={sensor?.technologyId ?? undefined}
          createAction={createTechnologyAction}
          createModalTitle="Nueva tecnología"
          updateAction={updateTechnologyAction}
          deleteAction={deleteTechnologyAction}
          manageModalTitle="Gestionar tecnologías"
          manageNewPlaceholder="Nueva tecnología…"
          manageEmptyText="Sin tecnologías todavía."
        />
        <EntitySelectField
          name="providerId"
          label="Proveedor"
          initialOptions={providers}
          defaultValue={sensor?.providerId ?? undefined}
          createAction={createProviderAction}
          createModalTitle="Nuevo proveedor"
          updateAction={updateProviderAction}
          deleteAction={deleteProviderAction}
          manageModalTitle="Gestionar proveedores"
          manageNewPlaceholder="Nuevo proveedor…"
          manageEmptyText="Sin proveedores todavía."
        />
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
            defaultValue={sensor?.purchasePrice ?? undefined}
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
            defaultValue={sensor?.salePrice ?? undefined}
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="manual" className="text-sm font-medium text-c24-navy">
          Manual de instalación (PDF, opcional)
        </label>
        {sensor?.manualPath && (
          <div className="flex items-center gap-4 text-sm text-c24-navy">
            <a
              href={`/api/sensores/manual/${sensor.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-c24-teal-dark hover:underline"
            >
              <FileText className="h-4 w-4" strokeWidth={1.75} /> Ver manual actual
            </a>
            <label className="inline-flex items-center gap-1.5 text-c24-text-muted">
              <input type="checkbox" name="removeManual" value="1" className="accent-c24-teal" />
              Eliminar manual
            </label>
          </div>
        )}
        <input
          id="manual"
          type="file"
          name="manual"
          accept="application/pdf"
          className="text-sm text-c24-navy file:mr-3 file:rounded-md file:border-0 file:bg-c24-teal-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-c24-navy hover:file:bg-c24-teal-light/70"
        />
        <p className="text-xs text-c24-text-muted">Máx. 20 MB. Sube un PDF nuevo para reemplazar el actual.</p>
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
