"use client";

import dynamic from "next/dynamic";
import { MAP_STATUS_COLOR, type MapMontaje } from "@/components/dashboard/DashboardMontajesMap";

const DashboardMontajesMap = dynamic(() => import("./DashboardMontajesMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-c24-teal-light/60" />,
});

const LEGEND: { status: MapMontaje["status"]; label: string }[] = [
  { status: "preparado", label: "Preparado" },
  { status: "iniciado", label: "Iniciado" },
  { status: "completado", label: "Completado" },
];

// Contenedor propio en vez de <Card> (light): acá el mapa tiene que ocupar casi todo el
// alto de la tarjeta, sin el padding interno fijo de Card — mezclar `p-6` de Card con un
// className que lo pisara habría dependido del orden de las clases en el CSS generado
// por Tailwind, no del orden en el atributo class, así que es más simple armar el marco
// (borde + fondo blanco) a mano y controlar el padding solo en la fila del título.
export function MontajesMapCard({ montajes }: { montajes: MapMontaje[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-c24-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div>
          <h2 className="text-base font-semibold text-c24-navy">Montajes en el mapa</h2>
          <p className="mt-0.5 text-xs text-c24-text-muted">Ubicación y estado de cada montaje con dirección cargada</p>
        </div>
        <div className="flex items-center gap-4">
          {LEGEND.map((l) => (
            <span key={l.status} className="flex items-center gap-1.5 text-xs text-c24-text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: MAP_STATUS_COLOR[l.status] }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {montajes.length === 0 ? (
        <div className="mx-6 mb-6 flex h-72 items-center justify-center rounded-md border border-dashed border-c24-border text-sm text-c24-text-muted">
          Todavía no hay montajes con ubicación cargada.
        </div>
      ) : (
        // La inclinación de 45° ahora es un pitch real de la cámara de MapLibre (ver
        // DashboardMontajesMap), no un transform CSS — por eso ya no hace falta ninguno
        // de los trucos de antes (ventana recortada, wrapperRef, cálculo manual de la
        // posición del hover): MapLibre reproyecta pines y popups solo, en cada frame.
        <div className="h-[520px] w-full">
          <DashboardMontajesMap montajes={montajes} />
        </div>
      )}
    </div>
  );
}
