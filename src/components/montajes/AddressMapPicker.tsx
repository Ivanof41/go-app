"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin, Search } from "lucide-react";

// ssr:false tiene que estar en el import dinámico, no en un useEffect adentro del
// componente: Leaflet toca `window` al evaluar el módulo, no solo al renderizar.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-md bg-c24-teal-light/60" />,
});

const MADRID: [number, number] = [40.4168, -3.7038];

type GeocodeResult = { label: string; lat: number; lng: number };

export function AddressMapPicker({
  initialPosition,
  onLocationChange,
}: {
  initialPosition?: [number, number] | null;
  onLocationChange: (lat: number, lng: number, label?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [marker, setMarker] = useState<[number, number] | null>(initialPosition ?? null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `results` no se limpia sincrónicamente al achicar la búsqueda: se deriva en el
  // render (visibleResults) a partir de query.length, así el efecto solo hace lo que
  // corresponde a un efecto — llamar a un sistema externo (fetch) y guardar su respuesta.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) return;

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const visibleResults = query.trim().length >= 3 ? results : [];

  function handlePick(result: GeocodeResult) {
    setMarker([result.lat, result.lng]);
    setResults([]);
    setQuery(result.label);
    onLocationChange(result.lat, result.lng, result.label);
  }

  // Al arrastrar o hacer clic en el pin, la dirección de texto tiene que seguir a la
  // nueva posición (geocodificación inversa) — si no, queda desactualizada respecto a
  // dónde quedó marcado el punto real, que es justo lo que el usuario está ajustando.
  function handleMarkerChange(lat: number, lng: number) {
    setMarker([lat, lng]);
    onLocationChange(lat, lng);
    setIsSearching(true);
    fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.label) {
          setQuery(data.label);
          onLocationChange(lat, lng, data.label);
        }
      })
      .finally(() => setIsSearching(false));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-c24-text-muted"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar dirección en el mapa…"
          className="w-full rounded-md border border-c24-border bg-white py-2.5 pr-3 pl-9 text-sm text-c24-navy placeholder:text-c24-text-muted/60 outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
        />
        {isSearching && (
          <Loader2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-c24-text-muted"
            strokeWidth={1.75}
          />
        )}

        {visibleResults.length > 0 && (
          // z-index alto a propósito: los controles internos de Leaflet (zoom, etc.)
          // usan z-index de hasta 1000 — con un z-index bajo el mapa (que está debajo en
          // el DOM pero no dentro de este contenedor) tapaba el desplegable igual.
          <ul className="absolute z-[1001] mt-1 w-full overflow-hidden rounded-md border border-c24-border bg-white shadow-lg">
            {visibleResults.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handlePick(r)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-c24-navy transition hover:bg-c24-teal-light"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-c24-text-muted" strokeWidth={1.75} />
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <LeafletMap center={marker ?? MADRID} zoom={marker ? 16 : 6} marker={marker} onMarkerChange={handleMarkerChange} />
      {/* Este componente solo se usa dentro de MontajeForm, que es una Card clara (misma
          excepción que Sensor/Accesorio) — mismo criterio que EntitySelectField/IconSelect:
          sin contexto oscuro que preservar. */}
      <p className="text-xs text-c24-text-muted">Busca una dirección o haz clic/arrastra el pin para ajustarla.</p>
    </div>
  );
}
