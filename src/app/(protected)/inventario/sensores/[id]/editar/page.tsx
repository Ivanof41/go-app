import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";
import { SensorForm } from "@/components/inventario/SensorForm";
import {
  getSensorAccessories,
  getSensorById,
  listAccessories,
  listBrands,
  listProviders,
  listTechnologies,
} from "@/lib/inventario/queries";

export default async function EditarSensorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const sensor = await getSensorById(id);
  if (!sensor) redirect("/inventario/sensores");

  const [brands, technologies, providers, accessories, sensorAccessories] = await Promise.all([
    listBrands(),
    listTechnologies(),
    listProviders(),
    listAccessories(),
    getSensorAccessories(id),
  ]);

  return (
    <div className="px-6 py-10">
      <Link
        href="/inventario/sensores"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-c24-text-muted transition hover:text-c24-navy"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Volver a Sensores
      </Link>

      <Card className="mt-4 max-w-3xl">
        <SensorForm
          sensor={sensor}
          title="Editar sensor"
          brands={brands}
          technologies={technologies}
          providers={providers}
          accessories={accessories}
          initialAccessories={sensorAccessories}
        />
      </Card>
    </div>
  );
}
