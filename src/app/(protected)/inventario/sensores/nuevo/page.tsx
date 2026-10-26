import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";
import { SensorForm } from "@/components/inventario/SensorForm";
import { listBrands, listProviders, listTechnologies } from "@/lib/inventario/queries";

export default async function NuevoSensorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [brands, technologies, providers] = await Promise.all([
    listBrands(),
    listTechnologies(),
    listProviders(),
  ]);

  return (
    <div className="px-6 py-10">
      <Link
        href="/inventario/sensores"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-c24-text-muted transition hover:text-c24-navy"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Volver a Sensores
      </Link>

      <Card className="mt-4" light>
        <SensorForm
          title="Nuevo sensor"
          brands={brands}
          technologies={technologies}
          providers={providers}
        />
      </Card>
    </div>
  );
}
