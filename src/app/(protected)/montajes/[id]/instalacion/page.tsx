import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getMontajeById, listMontajeItems } from "@/lib/montajes/queries";
import { Card } from "@/components/ui/Card";
import { MontajeTabs } from "@/components/montajes/MontajeTabs";
import { InstallProgress } from "@/components/montajes/InstallProgress";
import { InstallChecklist } from "@/components/montajes/InstallChecklist";

export default async function MontajeInstalacionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const montaje = await getMontajeById(id);
  if (!montaje) redirect("/montajes");

  const items = await listMontajeItems(id);
  const installedCount = items.filter((item) => item.installedAt).length;

  return (
    <div className="px-6 py-10">
      <Link
        href="/montajes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-c24-text-muted transition hover:text-c24-navy"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Volver a Montajes
      </Link>

      <div className="mt-4">
        <MontajeTabs montajeId={montaje.id} active="instalacion" />
      </div>

      <div className="mt-4 flex flex-col gap-6">
        <Card>
          <h1 className="text-lg font-semibold text-white">{montaje.clientName}</h1>
          <p className="mt-1 text-sm text-white/70">{montaje.address}</p>
        </Card>

        {!montaje.startedAt ? (
          <Card dashed className="flex flex-col items-center gap-1 py-12 text-center">
            <p className="text-sm text-white/60">
              Todavía no se inició este montaje. Márcalo como iniciado desde la pestaña Gestión antes de instalar.
            </p>
          </Card>
        ) : (
          <>
            {items.length > 0 && <InstallProgress installed={installedCount} total={items.length} />}

            {items.length === 0 ? (
              <Card dashed className="flex flex-col items-center gap-1 py-12 text-center">
                <p className="text-sm text-white/60">
                  Todavía no hay sensores añadidos. Agrégalos primero desde la pestaña Gestión.
                </p>
              </Card>
            ) : (
              <InstallChecklist items={items} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
