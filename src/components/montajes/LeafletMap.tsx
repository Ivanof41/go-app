"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Ícono propio en vez de L.Icon.Default: el default de Leaflet referencia PNGs con rutas
// relativas al paquete que casi siempre se rompen con bundlers (Turbopack incluido) — un
// SVG inline como divIcon evita el problema entero, sin assets que cablear.
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 23 13 23s13-13.25 13-23C26 5.82 20.18 0 13 0z" fill="#6ab5ab" stroke="#003c5b" stroke-width="1.5"/>
    <circle cx="13" cy="13" r="4.5" fill="#003c5b"/>
  </svg>`,
  iconSize: [26, 36],
  iconAnchor: [13, 36],
});

function RecenterOnChange({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
}

function ClickToPlace({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMap({
  center,
  zoom,
  marker,
  onMarkerChange,
}: {
  center: [number, number];
  zoom: number;
  marker: [number, number] | null;
  onMarkerChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-64 w-full rounded-md">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {marker && (
        <Marker
          position={marker}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const pos = e.target.getLatLng();
              onMarkerChange(pos.lat, pos.lng);
            },
          }}
        />
      )}
      <ClickToPlace onPlace={onMarkerChange} />
      <RecenterOnChange center={center} zoom={zoom} />
    </MapContainer>
  );
}
