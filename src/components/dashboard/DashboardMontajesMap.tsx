"use client";

// maplibre-gl fijado en 4.7.1 (sin ^) a propósito: v5/v6 cargan su worker de parseo de
// tiles vectoriales como módulo ESM vía `new Worker(new URL(...), {type:"module"})`, y
// Turbopack (el bundler de "next dev" en Next 16) no lo resuelve bien — el mapa cargaba
// el estilo y el sprite pero la fuente vectorial ("openmaptiles") se quedaba colgada
// para siempre en isSourceLoaded=false, sin ningún error visible. v4.7.1 usa el
// mecanismo de worker anterior (compatible con más bundlers) y funciona sin problema.
import { useEffect, useRef } from "react";
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import type { MontajeStatus } from "@/lib/montajes/status";

export type MapMontaje = {
  id: string;
  clientName: string;
  address: string;
  lat: number;
  lng: number;
  status: MontajeStatus;
};

// Mismos 3 estados que las tarjetas de MontajesTable, pero en versión de color sólido
// (un pin necesita relleno sólido — el borde transparente que usa "Preparado" en la
// tabla no funciona acá, por eso ese caso usa un gris neutro en su lugar).
export const MAP_STATUS_COLOR: Record<MontajeStatus, string> = {
  preparado: "#64748b",
  iniciado: "#f59e0b",
  completado: "#6ab5ab",
};

const STATUS_LABEL: Record<MontajeStatus, string> = {
  preparado: "Preparado",
  iniciado: "Iniciado",
  completado: "Completado",
};

// OpenFreeMap (gratis, sin API key, pensado específicamente para MapLibre GL) en vez de
// las tiles raster de CARTO que usaba la versión con Leaflet — acá sí tiene sentido un
// estilo vectorial real: MapLibre reproyecta el vector en cada frame, así que un pitch
// (inclinación 3D) queda nítido a cualquier ángulo/zoom, cosa que una tile raster no
// puede (se ve borrosa/pixelada al rotar). "positron" es el más parecido al gris/blanco
// minimalista que ya usábamos.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

function pinElement(status: MontajeStatus, label: string) {
  const wrapper = document.createElement("div");
  wrapper.className = "relative h-[41px] w-[30px] cursor-pointer";
  const color = MAP_STATUS_COLOR[status];
  wrapper.innerHTML = `
    <svg width="30" height="41" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg" class="absolute inset-0">
      <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 23 13 23s13-13.25 13-23C26 5.82 20.18 0 13 0z" fill="${color}" stroke="#003c5b" stroke-width="1.5"/>
      <circle cx="13" cy="13" r="4.5" fill="#003c5b"/>
    </svg>
    <span class="dashboard-map-label absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap">${label}</span>
  `;
  return wrapper;
}

function popupHtml(montaje: MapMontaje) {
  const color = MAP_STATUS_COLOR[montaje.status];
  return `
    <div class="px-0.5 py-0.5">
      <div class="flex items-center gap-1.5">
        <span class="h-2 w-2 rounded-full" style="background:${color}"></span>
        <span class="text-xs font-semibold tracking-wide uppercase" style="color:${color}">${STATUS_LABEL[montaje.status]}</span>
      </div>
      <p class="mt-1.5 text-sm font-semibold text-c24-navy">${montaje.clientName}</p>
      <p class="mt-0.5 text-xs text-c24-text-muted">${montaje.address}</p>
    </div>
  `;
}

export default function DashboardMontajesMap({ montajes }: { montajes: MapMontaje[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  // router.push de la navegación más reciente, en un ref para que los listeners de cada
  // marker (armados una sola vez por lista de montajes) no queden con un router viejo.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialCenter: [number, number] = montajes.length
      ? [montajes[0].lng, montajes[0].lat]
      : [2.9, 39.6];

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: 6,
      pitch: 45,
      // Sin rotar con el botón derecho / dos dedos: en un dashboard de resumen alcanza
      // con inclinar la cámara, girar la brújula solo suma confusión sin aportar nada.
      dragRotate: false,
      touchPitch: false,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-left");

    // MapLibre solo re-mide el canvas cuando cambia el tamaño de la VENTANA (trackResize
    // escucha el resize de window, no el del contenedor) — si el ancho de esta tarjeta
    // cambia por otro motivo (el sidebar se colapsa, la fuente termina de cargar y
    // reacomoda el layout, etc.) el canvas queda con el tamaño viejo, y el mapa termina
    // descentrado con un margen de más a un lado. Un ResizeObserver sobre el propio
    // contenedor cubre esos casos también.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    const markers: Marker[] = [];
    const popups: Popup[] = [];

    map.on("load", () => {
      for (const montaje of montajes) {
        const el = pinElement(montaje.status, montaje.clientName);
        el.addEventListener("click", () => routerRef.current.push(`/montajes/${montaje.id}?edit=1`));

        // Popup propio de MapLibre en vez del truco de posición manual que hacía falta
        // con Leaflet: acá el popup vive en su propia capa DOM sincronizada por MapLibre
        // en cada frame según la proyección de la cámara — siempre sale recto/legible
        // aunque el mapa de fondo esté inclinado en 3D, sin ningún cálculo manual.
        const popup = new Popup({
          closeButton: false,
          closeOnClick: false,
          anchor: "bottom",
          offset: 44,
          className: "dashboard-map-popup",
        }).setHTML(popupHtml(montaje));
        el.addEventListener("mouseenter", () => popup.setLngLat([montaje.lng, montaje.lat]).addTo(map));
        el.addEventListener("mouseleave", () => popup.remove());

        const marker = new Marker({ element: el, anchor: "bottom" }).setLngLat([montaje.lng, montaje.lat]).addTo(map);
        markers.push(marker);
        popups.push(popup);
      }

      if (montajes.length === 1) {
        map.setCenter([montajes[0].lng, montajes[0].lat]);
        map.setZoom(13);
      } else if (montajes.length > 1) {
        const bounds = montajes.reduce(
          (b, m) => b.extend([m.lng, m.lat]),
          new LngLatBounds([montajes[0].lng, montajes[0].lat], [montajes[0].lng, montajes[0].lat]),
        );
        map.fitBounds(bounds, { padding: 60, duration: 0 });
      }
    });

    return () => {
      resizeObserver.disconnect();
      popups.forEach((p) => p.remove());
      markers.forEach((m) => m.remove());
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montajes.map((m) => `${m.id}:${m.lat}:${m.lng}:${m.status}`).join(",")]);

  return <div ref={containerRef} className="h-full w-full" />;
}
