import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { ZonesManager } from "@/components/inventario/ZonesManager";
import { listZones } from "@/lib/inventario/zones-queries";

export default async function GestionarZonasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const zones = await listZones();

  return (
    <div className="px-6 py-10">
      <Link
        href="/inventario/zonas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-c24-text-muted transition hover:text-c24-navy"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Volver a Stock
      </Link>

      <div className="mt-4">
        <ZonesManager zones={zones} />
      </div>
    </div>
  );
}
