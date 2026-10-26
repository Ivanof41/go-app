"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getSensorTypeIcon } from "@/lib/inventario/sensor-types";
import { deleteMontajeItemAction } from "@/app/(protected)/montajes/actions";
import { MontajeItemModal } from "@/components/montajes/MontajeItemModal";
import { groupItemsBySensor } from "@/lib/montajes/group-items";

type SensorOption = { id: string; name: string; type: string };
type AccessoryOption = { id: string; name: string; type: string };

export type MontajeItemRow = {
  id: string;
  sensorId: string;
  sensorName: string;
  sensorType: string;
  sensorPurchasePrice: number | null;
  sensorSalePrice: number | null;
  location: string;
  notes: string | null;
  photoPath: string | null;
  installedAt: Date | null;
  updatedAt: Date;
  accessories: { id: string; name: string; quantity: number }[];
  accessoriesCost: number;
  accessoriesSale: number;
};

export function MontajeItemsList({
  montajeId,
  items,
  sensorOptions,
  accessoryOptions,
}: {
  montajeId: string;
  items: MontajeItemRow[];
  sensorOptions: SensorOption[];
  accessoryOptions: AccessoryOption[];
}) {
  const [editTarget, setEditTarget] = useState<MontajeItemRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MontajeItemRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", deleteTarget.id);
      const result = await deleteMontajeItemAction(undefined, formData);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
    });
  }

  // Agrupado por sensor (mismo tipo/modelo puede tener muchos puntos de instalación
  // distintos, ej. "Sensor Temperatura con Vaina" en 20 máquinas) — el nombre del
  // sensor pasa a ser el título de la sección, así cada tarjeta puede mostrar de una
  // el dato que de verdad distingue a cada punto: la ubicación.
  const groups = groupItemsBySensor(items);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const GroupIcon = getSensorTypeIcon(group.sensorType);
        return (
          <div key={group.sensorId}>
            <div className="mb-2 flex items-center gap-1.5">
              <GroupIcon className="h-4 w-4 shrink-0 text-c24-navy" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold text-c24-navy">{group.sensorName}</h3>
              <span className="ml-auto text-xs text-c24-text-muted">
                {group.items.length} {group.items.length === 1 ? "sensor" : "sensores"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-md border border-c24-border p-3">
                  <div className="aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md bg-c24-teal-light">
                    {/* aspect-[4/3], no h-16 w-16: la foto ya se recorta a 4:3 en el editor
                        (PhotoAnnotationModal) — mostrarla en un cuadrado la recortaba una
                        segunda vez con object-cover, y esa segunda pasada no sabe qué parte de
                        la foto el usuario centró a propósito, así que a veces cortaba justo el
                        sujeto de la foto.
                        next/image tampoco sirve acá: su optimizador hace el fetch desde el
                        propio servidor (sin las cookies de sesión del navegador), así que el
                        auth() de la ruta de uploads siempre lo rechazaría. Un <img> normal deja
                        que el navegador pida la imagen directo, con cookies — mismo motivo por
                        el que Avatar.tsx tampoco usa next/image. */}
                    {item.photoPath && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        // El query param con updatedAt fuerza al navegador a pedir de nuevo la
                        // imagen cuando se reemplaza la foto de un ítem existente — la URL sin
                        // esto queda idéntica entre ediciones (mismo itemId), así que React
                        // nunca tocaría el atributo src y el navegador no tendría motivo para
                        // volver a pedirla, sin importar el Cache-Control de la ruta.
                        src={`/api/montajes/uploads/${item.id}?v=${new Date(item.updatedAt).getTime()}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="truncate text-sm font-medium text-c24-navy" title={item.location}>
                        {item.location}
                      </p>
                      {item.notes && (
                        <p className="mt-0.5 truncate text-xs text-c24-text-muted italic" title={item.notes}>
                          {item.notes}
                        </p>
                      )}
                      {item.accessories.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-c24-text-muted">
                          + {item.accessories.map((a) => `${a.quantity}× ${a.name}`).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end gap-1 self-end">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => setEditTarget(item)}
                        className="p-1 text-c24-text-muted hover:text-c24-navy"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => {
                          setDeleteTarget(item);
                          setDeleteError(null);
                        }}
                        className="p-1 text-c24-text-muted hover:text-c24-danger"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {editTarget && (
        <MontajeItemModal
          montajeId={montajeId}
          item={editTarget}
          sensorOptions={sensorOptions}
          accessoryOptions={accessoryOptions}
          onSaved={() => setEditTarget(null)}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar sensor del montaje"
          description={`¿Eliminar "${deleteTarget.sensorName}" (${deleteTarget.location})? Esta acción no se puede deshacer.`}
          isPending={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
