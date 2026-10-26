import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";
import { AccessoryForm } from "@/components/inventario/AccessoryForm";
import { listBrands } from "@/lib/inventario/queries";

export default async function NuevoAccesorioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const brands = await listBrands();

  return (
    <div className="px-6 py-10">
      <Link
        href="/inventario/sensores?tab=accesorios"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-c24-text-muted transition hover:text-c24-navy"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Volver a Sensores
      </Link>

      <Card className="mt-4" light>
        <AccessoryForm title="Nuevo accesorio" brands={brands} />
      </Card>
    </div>
  );
}
