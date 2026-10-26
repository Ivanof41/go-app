import { auth } from "@/auth";
import { listBrands, listProviders, listTechnologies } from "@/lib/inventario/queries";
import { buildSensorTemplate } from "@/lib/inventario/sensor-import";

// Plantilla Excel para el alta masiva de sensores — generada en cada pedido para que
// los desplegables reflejen los tipos y catálogos actuales (ver sensor-import.ts).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("No autorizado", { status: 401 });

  const [brands, technologies, providers] = await Promise.all([listBrands(), listTechnologies(), listProviders()]);
  const buffer = await buildSensorTemplate({
    brands: brands.map((b) => b.name),
    technologies: technologies.map((t) => t.name),
    providers: providers.map((p) => p.name),
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-sensores.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
