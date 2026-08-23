"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconSelect } from "@/components/ui/IconSelect";
import { EntitySelectField } from "@/components/inventario/EntitySelectField";
import { QuickCreateModal } from "@/components/inventario/QuickCreateModal";
import { SENSOR_TYPES } from "@/lib/inventario/sensor-types";
import {
  createAccessoryAction,
  createBrandAction,
  createTechnologyAction,
  createProviderAction,
  createSensorAction,
  updateSensorAction,
} from "@/app/(protected)/inventario/sensores/actions";

type Option = { id: string; name: string };
type AccessoryLink = { accessoryId: string; accessoryName: string; quantity: number };

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
};

export function SensorForm({
  sensor,
  title,
  brands,
  technologies,
  providers,
  accessories,
  initialAccessories,
}: {
  sensor?: SensorFormValues;
  title: string;
  brands: Option[];
  technologies: Option[];
  providers: Option[];
  accessories: Option[];
  initialAccessories?: AccessoryLink[];
}) {
  const action = sensor ? updateSensorAction : createSensorAction;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [type, setType] = useState<string>(sensor?.type ?? "otro");

  const [accessoryOptions, setAccessoryOptions] = useState(accessories);
  const [accessoryLinks, setAccessoryLinks] = useState<AccessoryLink[]>(initialAccessories ?? []);
  const [draftAccessoryId, setDraftAccessoryId] = useState("");
  const [draftQuantity, setDraftQuantity] = useState("1");
  const [showCreateAccessory, setShowCreateAccessory] = useState(false);

  const HeaderIcon = SENSOR_TYPES.find((t) => t.value === type)?.icon ?? SENSOR_TYPES[SENSOR_TYPES.length - 1].icon;

  function addAccessoryLink() {
    const option = accessoryOptions.find((a) => a.id === draftAccessoryId);
    if (!option) return;
    const quantity = Math.max(1, parseInt(draftQuantity, 10) || 1);
    setAccessoryLinks((prev) => [
      ...prev.filter((l) => l.accessoryId !== option.id),
      { accessoryId: option.id, accessoryName: option.name, quantity },
    ]);
    setDraftAccessoryId("");
    setDraftQuantity("1");
  }

  function removeAccessoryLink(accessoryId: string) {
    setAccessoryLinks((prev) => prev.filter((l) => l.accessoryId !== accessoryId));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {sensor && <input type="hidden" name="id" defaultValue={sensor.id} />}
      <input type="hidden" name="type" value={type} />
      <input
        type="hidden"
        name="accessoriesJson"
        value={JSON.stringify(accessoryLinks.map(({ accessoryId, quantity }) => ({ accessoryId, quantity })))}
      />

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
        <label htmlFor="type-select" className="text-sm font-medium text-c24-navy">
          Tipo de sensor
        </label>
        <IconSelect id="type-select" options={SENSOR_TYPES} value={type} onChange={setType} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <EntitySelectField
          name="brandId"
          label="Marca"
          initialOptions={brands}
          defaultValue={sensor?.brandId ?? undefined}
          createAction={createBrandAction}
          createModalTitle="Nueva marca"
        />
        <EntitySelectField
          name="technologyId"
          label="Tecnología"
          initialOptions={technologies}
          defaultValue={sensor?.technologyId ?? undefined}
          createAction={createTechnologyAction}
          createModalTitle="Nueva tecnología"
        />
        <EntitySelectField
          name="providerId"
          label="Proveedor"
          initialOptions={providers}
          defaultValue={sensor?.providerId ?? undefined}
          createAction={createProviderAction}
          createModalTitle="Nuevo proveedor"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-c24-navy">Accesorios (opcional)</span>

        {accessoryLinks.length > 0 && (
          <ul className="flex flex-col divide-y divide-c24-border rounded-md border border-c24-border">
            {accessoryLinks.map((link) => (
              <li key={link.accessoryId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="text-c24-navy">
                  {link.accessoryName} <span className="text-c24-text-muted">× {link.quantity}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Quitar ${link.accessoryName}`}
                  onClick={() => removeAccessoryLink(link.accessoryId)}
                  className="text-c24-text-muted hover:text-c24-danger"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <select
            value={draftAccessoryId}
            onChange={(e) => setDraftAccessoryId(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
          >
            <option value="">Selecciona un accesorio…</option>
            {accessoryOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={draftQuantity}
            onChange={(e) => setDraftQuantity(e.target.value)}
            className="w-20 shrink-0 rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
          />
          <button
            type="button"
            onClick={() => setShowCreateAccessory(true)}
            aria-label="Crear accesorio"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-c24-border text-c24-navy transition hover:bg-c24-teal-light"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <Button type="button" fullWidth={false} disabled={!draftAccessoryId} onClick={addAccessoryLink}>
            Agregar
          </Button>
        </div>

        {showCreateAccessory && (
          <QuickCreateModal
            title="Nuevo accesorio"
            label="Nombre"
            createAction={createAccessoryAction}
            onClose={() => setShowCreateAccessory(false)}
            onCreated={(created) => {
              setAccessoryOptions((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
              setDraftAccessoryId(created.id);
              setShowCreateAccessory(false);
            }}
          />
        )}
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

      {state?.error && (
        <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : sensor ? "Guardar cambios" : "Crear sensor"}
      </Button>
    </form>
  );
}
