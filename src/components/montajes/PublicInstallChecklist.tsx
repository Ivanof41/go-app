"use client";

import { useState, useTransition } from "react";
import { Camera, Check, FileText } from "lucide-react";
import { clsx } from "@/lib/clsx";
import { getSensorTypeIcon } from "@/lib/inventario/sensor-types";
import { setMontajeItemInstalledPublicAction } from "@/app/i/actions";
import { PublicInstallPhotoModal } from "@/components/montajes/PublicInstallPhotoModal";
import type { InstallItemRow } from "@/components/montajes/InstallChecklist";
import { groupItemsBySensor } from "@/lib/montajes/group-items";

// Mismo componente que InstallChecklist, pero para el enlace público del técnico (sin
// sesión) — llama a las acciones con token en vez de las autenticadas. Separado a
// propósito de InstallChecklist en vez de una única versión con un flag "isPublic": así
// nunca hay una rama de código que decida en runtime si la mutación es pública o
// privada, cada componente solo sabe llamar a SU acción.
//
// Una sola columna, no la grilla comprimida de InstallChecklist: esta página la ve el
// técnico desde el celular en el sitio de la instalación, no alguien comparando muchos
// ítems a la vez en un monitor — cada sensor necesita su propio espacio (nombre
// completo, observaciones, foto grande) en vez de competir por lugar con sus vecinos.
export function PublicInstallChecklist({ token, items }: { token: string; items: InstallItemRow[] }) {
  const [photoTarget, setPhotoTarget] = useState<InstallItemRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(item: InstallItemRow) {
    setPendingId(item.id);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("token", token);
      formData.set("id", item.id);
      formData.set("installed", item.installedAt ? "0" : "1");
      await setMontajeItemInstalledPublicAction(undefined, formData);
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
          <div key={group.sensorId} className="flex flex-col gap-4">
            {/* Encabezado de sección por sensor (nombre/modelo + cuántos van instalados
                de ese tipo) — el técnico puede tener 20 del mismo modelo en distintas
                máquinas, así que cada tarjeta de abajo ya no repite este nombre: muestra
                directo el punto específico (location). */}
            <div className="flex items-center gap-1.5 border-b border-c24-border pb-2">
              <GroupIcon className="h-5 w-5 shrink-0 text-c24-navy" strokeWidth={1.75} />
              <h2 className="text-base font-semibold text-c24-navy">{group.sensorName}</h2>
              <span className="ml-auto text-xs font-medium text-c24-text-muted">
                {installedCount}/{group.items.length}
              </span>
            </div>
            {/* Manual del sensor, si tiene uno cargado — mismo criterio que la ruta que
                lo sirve: acá sin sesión, así que el token va en la URL. */}
            {group.items[0].sensorManualPath && (
              <a
                href={`/api/sensores/manual/${group.sensorId}?token=${token}`}
                target="_blank"
                rel="noreferrer"
                className="-mt-2 inline-flex items-center gap-1.5 self-start text-sm font-medium text-c24-teal-dark hover:underline"
              >
                <FileText className="h-4 w-4" strokeWidth={1.75} /> Ver manual de instalación
              </a>
            )}

            {group.items.map((item) => {
              const installed = !!item.installedAt;
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "rounded-lg border p-4 shadow-sm transition sm:p-5",
                    installed ? "border-c24-teal bg-c24-teal-light/20" : "border-c24-border bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold text-c24-navy">{item.location}</p>
                    {installed && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-c24-teal px-2 py-0.5 text-xs font-medium text-c24-navy">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                        Instalado
                      </span>
                    )}
                  </div>

                  <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-md bg-c24-teal-light">
                    {item.photoPath && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/montajes/uploads/${item.id}?v=${new Date(item.updatedAt).getTime()}&token=${token}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {item.notes && (
                    <div className="mt-3 rounded-md bg-c24-teal-light/40 px-3 py-2">
                      <p className="text-xs font-semibold tracking-wide text-c24-text-muted uppercase">
                        Observaciones
                      </p>
                      <p className="mt-0.5 text-sm text-c24-navy">{item.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      disabled={isPending && pendingId === item.id}
                      className={clsx(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition disabled:opacity-60",
                        installed
                          ? "bg-c24-teal text-c24-navy hover:bg-c24-teal-dark hover:text-white"
                          : "border border-c24-border text-c24-navy hover:bg-c24-teal-light",
                      )}
                    >
                      <Check className="h-4 w-4" strokeWidth={2} />
                      {installed ? "Instalado" : "Marcar instalado"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPhotoTarget(item)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-c24-border px-3 py-2.5 text-sm font-medium text-c24-navy transition hover:bg-c24-teal-light"
                    >
                      <Camera className="h-4 w-4" strokeWidth={1.75} />
                      {item.installedPhotoPath ? "Ver/cambiar foto" : "Añadir foto"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {photoTarget && (
        <PublicInstallPhotoModal
          token={token}
          item={photoTarget}
          onSaved={() => setPhotoTarget(null)}
          onClose={() => setPhotoTarget(null)}
        />
      )}
    </div>
  );
}
