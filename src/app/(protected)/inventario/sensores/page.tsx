import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { SensorsTable } from "@/components/inventario/SensorsTable";
import { listBrands, listProviders, listSensors, listTechnologies } from "@/lib/inventario/queries";

export default async function SensoresPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [sensors, brands, technologies, providers] = await Promise.all([
    listSensors(),
    listBrands(),
    listTechnologies(),
    listProviders(),
  ]);

  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-semibold text-c24-navy">Sensores</h1>
      <p className="mt-1 text-sm text-c24-text-muted">Catálogo de Sensores</p>

      <div className="mt-8">
        <SensorsTable sensors={sensors} brands={brands} technologies={technologies} providers={providers} />
      </div>
    </div>
  );
}
