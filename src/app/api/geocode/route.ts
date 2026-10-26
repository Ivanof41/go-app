import { auth } from "@/auth";

type NominatimResult = { display_name: string; lat: string; lon: string };

// Proxy propio en vez de llamar a Nominatim directo desde el navegador: su política de
// uso exige un User-Agent identificador y desaconseja llamadas sin control desde
// cliente. El User-Agent es un identificador de la app, nunca el email del usuario
// logueado — no tiene sentido mandarle eso a un tercero en cada tecla de búsqueda.
const NOMINATIM_HEADERS = {
  "User-Agent": process.env.NOMINATIM_USER_AGENT ?? "go-app/1.0 (+https://connect24.io)",
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "No autorizado" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const lat = params.get("lat");
  const lng = params.get("lng");

  // Geocodificación inversa: se usa cuando el usuario arrastra o hace clic en el pin
  // del mapa — la dirección de texto tiene que seguir a la posición real del pin, no
  // solo lat/lng, o el técnico vería una dirección desactualizada respecto a dónde
  // quedó marcado el punto.
  if (lat && lng) {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
    url.searchParams.set("format", "jsonv2");

    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return Response.json({ error: "Error al obtener la dirección" }, { status: 502 });

    const data = (await res.json()) as { display_name?: string };
    return Response.json({ label: data.display_name ?? null });
  }

  const q = params.get("q")?.trim();
  if (!q || q.length < 3) return Response.json({ results: [] });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "es");

  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return Response.json({ error: "Error al buscar la dirección" }, { status: 502 });

  const data = (await res.json()) as NominatimResult[];
  return Response.json({
    results: data.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) })),
  });
}
