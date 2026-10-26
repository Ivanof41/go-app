"use client";

import { useState, useTransition } from "react";
import { Camera, Check, FileText } from "lucide-react";
import { clsx } from "@/lib/clsx";
import { getSensorTypeIcon } from "@/lib/inventario/sensor-types";
import { setMontajeItemInstalledAction } from "@/app/(protected)/montajes/actions";
import { InstallPhotoModal } from "@/components/montajes/InstallPhotoModal";
import { groupItemsBySensor } from "@/lib/montajes/group-items";

export type InstallItemRow = {
  id: string;
  sensorId: string;
  sensorName: string;
  sensorType: string;
  sensorManualPath: string | null;
  location: string;
  notes: string | null;
  photoPath: string | null;
  installedAt: Date | null;
  installedPhotoPath: string | null;
  updatedAt: Date;
};

export function InstallChecklist({ items }: { items: InstallItemRow[] }) {
  const [photoTarget, setPhotoTarget] = useState<InstallItemRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(item: InstallItemRow) {
    setPendingId(item.id);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", item.id);
      formData.set("installed", item.installedAt ? "0" : "1");
      await setMontajeItemInstalledAction(undefined, formData);
      setPendingId(null);
    });
  }

  const groups = groupItemsBySensor(items);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const GroupIcon = getSensorTypeIcon(group.sensorType);
        const installedCount = group.items.filter((item) => item.installedAt).length;
        return (
          <div key={group.sensorId}>
            <div className="mb-2 flex items-center gap-1.5">
              <GroupIcon className="h-4 w-4 shrink-0 text-c24-navy" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold text-c24-navy">{group.sensorName}</h3>
              {group.items[0].sensorManualPath && (
                <a
                  href={`/api/sensores/manual/${group.sensorId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-c24-teal-dark hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" strokeWidth={1.75} /> Ver manual
                </a>
              )}
              <span className="ml-auto text-xs text-c24-text-muted">
                {installedCount}/{group.items.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const installed = !!item.installedAt;
                return (
                  <div
                    key={item.id}
                    className={clsx(
                      "flex gap-3 rounded-md border p-3 transition",
                      installed ? "border-c24-teal bg-c24-teal-light/30" : "border-c24-border",
                    )}
                  >
                    <div className="aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md bg-c24-teal-light">
                      {/* aspect-[4/3], no un cuadrado (mismo motivo que en MontajeItemsList): la
                          foto ya viene recortada a 4:3 desde el editor, un cuadrado la recortaría
                          una segunda vez y podría cortar justo el sujeto que el usuario centró.
                          next/image tampoco sirve acá: su optimizador no manda las cookies de
                          sesión, así que auth() lo rechaza. */}
                      {item.photoPath && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/montajes/uploads/${item.id}?v=${new Date(item.updatedAt).getTime()}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div>
                        <p className="truncate text-sm font-medium text-c24-navy" title={item.location}>
                          {item.location}
                        </p>
                        {item.notes && (
                          <p className="mt-0.5 truncate text-xs text-c24-text-muted italic" title={item.notes}>
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(item)}
                          disabled={isPending && pendingId === item.id}
                          className={clsx(
                            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-60",
                            installed
                              ? "bg-c24-teal text-c24-navy hover:bg-c24-teal-dark hover:text-white"
                              : "border border-c24-border text-c24-navy hover:bg-c24-teal-light",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          {installed ? "Instalado" : "Marcar instalado"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPhotoTarget(item)}
                          className="flex items-center gap-1 text-xs font-medium text-c24-teal-dark hover:underline"
                        >
                          <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {item.installedPhotoPath ? "Ver/cambiar foto" : "Añadir foto"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {photoTarget && (
        <InstallPhotoModal
          item={photoTarget}
          onSaved={() => setPhotoTarget(null)}
          onClose={() => setPhotoTarget(null)}
        />
      )}
    </div>
  );
}
