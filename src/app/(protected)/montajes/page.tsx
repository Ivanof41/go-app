import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { listMontajes } from "@/lib/montajes/queries";
import { getInstallLinkBaseUrl } from "@/lib/montajes/base-url";
import { MontajesTable } from "@/components/montajes/MontajesTable";

export default async function MontajesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [montajes, installLinkBaseUrl] = await Promise.all([listMontajes(), getInstallLinkBaseUrl()]);

  return (
    <div className="px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-c24-navy">Montajes</h1>
          <p className="mt-1 text-sm text-c24-text-muted">Control de montajes en marcha</p>
        </div>
        <Link
          href="/montajes/nuevo"
          className="flex items-center rounded-md bg-c24-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-c24-teal-dark"
        >
          <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.75} /> Nuevo montaje
        </Link>
      </div>

      <div className="mt-8">
        <MontajesTable montajes={montajes} installLinkBaseUrl={installLinkBaseUrl} />
      </div>
    </div>
  );
}
