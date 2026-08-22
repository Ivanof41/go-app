"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SensorForm, type SensorFormValues } from "@/components/inventario/SensorForm";
import { getSensorTypeIcon, getSensorTypeLabel } from "@/lib/inventario/sensor-types";
import { deleteSensorAction } from "@/app/(protected)/inventario/sensores/actions";

type Option = { id: string; name: string };
type SensorRow = SensorFormValues & {
  brandName: string;
  technologyName: string;
  providerName: string;
};

export function SensorsTable({
  sensors,
  brands,
  technologies,
  providers,
}: {
  sensors: SensorRow[];
  brands: Option[];
  technologies: Option[];
  providers: Option[];
}) {
  const [modalMode, setModalMode] = useState<"create" | SensorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SensorRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", deleteTarget.id);
      const result = await deleteSensorAction(undefined, formData);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button type="button" fullWidth={false} onClick={() => setModalMode("create")}>
          <Plus className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} /> Nuevo sensor
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-c24-border text-left text-c24-text-muted">
              <th className="py-2 font-medium">Tipo</th>
              <th className="py-2 font-medium">Nombre</th>
              <th className="py-2 font-medium">Marca</th>
              <th className="py-2 font-medium">Tecnología</th>
              <th className="py-2 font-medium">Proveedor</th>
              <th className="py-2 font-medium">P. compra</th>
              <th className="py-2 font-medium">P. venta</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-c24-border">
            {sensors.map((s) => {
              const TypeIcon = getSensorTypeIcon(s.type);
              return (
              <tr key={s.id}>
                <td className="py-2.5">
                  <span
                    title={getSensorTypeLabel(s.type)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-c24-teal-light text-c24-navy"
                  >
                    <TypeIcon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </td>
                <td className="py-2.5 text-c24-navy">{s.name}</td>
                <td className="py-2.5 text-c24-navy">{s.brandName}</td>
                <td className="py-2.5 text-c24-navy">{s.technologyName}</td>
                <td className="py-2.5 text-c24-navy">{s.providerName}</td>
                <td className="py-2.5 text-c24-navy">${s.purchasePrice.toFixed(2)}</td>
                <td className="py-2.5 text-c24-navy">${s.salePrice.toFixed(2)}</td>
                <td className="py-2.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    aria-label="Editar"
                    onClick={() => setModalMode(s)}
                    className="p-1.5 text-c24-text-muted hover:text-c24-navy"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    onClick={() => {
                      setDeleteTarget(s);
                      setDeleteError(null);
                    }}
                    className="p-1.5 text-c24-text-muted hover:text-c24-danger"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sensors.length === 0 && <p className="mt-4 text-sm text-c24-text-muted">Sin sensores todavía.</p>}

      {modalMode && (
        <Modal onClose={() => setModalMode(null)} size="xl">
          <SensorForm
            sensor={modalMode === "create" ? undefined : modalMode}
            title={modalMode === "create" ? "Nuevo sensor" : "Editar sensor"}
            brands={brands}
            technologies={technologies}
            providers={providers}
            onSaved={() => setModalMode(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar sensor"
          description={`¿Eliminar "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
          isPending={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
