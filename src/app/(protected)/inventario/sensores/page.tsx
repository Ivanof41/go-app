import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { SensoresTabs } from "@/components/inventario/SensoresTabs";
import { listAccessories, listSensors } from "@/lib/inventario/queries";

export default async function SensoresPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ tab }, sensors, accessories] = await Promise.all([searchParams, listSensors(), listAccessories()]);
  const initialTab = tab === "accesorios" ? "accesorios" : "sensores";

  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-semibold text-c24-navy">Sensores</h1>
      <p className="mt-1 text-sm text-c24-text-muted">Catálogo de Sensores</p>

      <div className="mt-8">
        <SensoresTabs sensors={sensors} accessories={accessories} initialTab={initialTab} />
      </div>
    </div>
  );
}
