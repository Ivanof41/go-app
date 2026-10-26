import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getMontajeById, listMontajeItems } from "@/lib/montajes/queries";
import { listAccessories, listSensors } from "@/lib/inventario/queries";
import { getInstallLinkBaseUrl } from "@/lib/montajes/base-url";
import { MontajeHeader } from "@/components/montajes/MontajeHeader";
import { MontajeDetail } from "@/components/montajes/MontajeDetail";
import { MontajeTabs } from "@/components/montajes/MontajeTabs";

export default async function MontajeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { edit } = await searchParams;
  const montaje = await getMontajeById(id);
  if (!montaje) redirect("/montajes");

  const [items, sensorOptions, accessoryOptions, installLinkBaseUrl] = await Promise.all([
    listMontajeItems(id),
    listSensors(),
    listAccessories(),
    getInstallLinkBaseUrl(),
  ]);

  return (
    <div className="px-6 py-10">
      <Link
        href="/montajes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-c24-text-muted transition hover:text-c24-navy"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Volver a Montajes
      </Link>

      <div className="mt-4">
        <MontajeTabs montajeId={montaje.id} active="gestion" />
      </div>

      <div className="mt-4 flex flex-col gap-6">
        <MontajeHeader
          montaje={montaje}
          startedAt={montaje.startedAt}
          installToken={montaje.installToken}
          installLinkBaseUrl={installLinkBaseUrl}
          initialEditing={edit === "1"}
        />

        <MontajeDetail
          montajeId={montaje.id}
          startedAt={montaje.startedAt}
          items={items}
          sensorOptions={sensorOptions}
          accessoryOptions={accessoryOptions}
        />
      </div>
    </div>
  );
}
