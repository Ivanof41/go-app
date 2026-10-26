"use client";

import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { QuickCreateModal } from "@/components/inventario/QuickCreateModal";
import { ManageCatalogModal } from "@/components/inventario/ManageCatalogModal";
import type { ActionState, CatalogAction } from "@/app/(protected)/inventario/sensores/actions";

type Option = { id: string; name: string };

export function EntitySelectField({
  name,
  label,
  initialOptions,
  defaultValue,
  createAction,
  createModalTitle,
  updateAction,
  deleteAction,
  manageModalTitle,
  manageNewPlaceholder,
  manageEmptyText,
}: {
  name: string;
  label: string;
  initialOptions: Option[];
  defaultValue?: string;
  createAction: CatalogAction;
  createModalTitle: string;
  updateAction: CatalogAction;
  deleteAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  manageModalTitle: string;
  manageNewPlaceholder: string;
  manageEmptyText: string;
}) {
  const [options, setOptions] = useState(initialOptions);
  const [selected, setSelected] = useState(defaultValue ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const [showManage, setShowManage] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-c24-navy">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          id={name}
          name={name}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
        >
          <option value="">Sin especificar</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label={`Crear ${label.toLowerCase()}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-c24-border text-c24-navy transition hover:bg-c24-teal-light"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => setShowManage(true)}
          aria-label={`Gestionar ${label.toLowerCase()}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-c24-border text-c24-navy transition hover:bg-c24-teal-light"
        >
          <Settings2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {showCreate && (
        <QuickCreateModal
          title={createModalTitle}
          label={label}
          createAction={createAction}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setOptions((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
            setSelected(created.id);
            setShowCreate(false);
          }}
        />
      )}

      {showManage && (
        <ManageCatalogModal
          title={manageModalTitle}
          entityLabel={label.toLowerCase()}
          newPlaceholder={manageNewPlaceholder}
          emptyText={manageEmptyText}
          options={options}
          createAction={createAction}
          updateAction={updateAction}
          deleteAction={deleteAction}
          onClose={() => setShowManage(false)}
          onChange={(next) => {
            setOptions(next);
            setSelected((prev) => (next.some((o) => o.id === prev) ? prev : ""));
          }}
        />
      )}
    </div>
  );
}
