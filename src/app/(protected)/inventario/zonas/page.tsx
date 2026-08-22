import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";
import { ZoneCard } from "@/components/inventario/ZoneCard";
import { ZonasPageActions } from "@/components/inventario/ZonasPageActions";
import { getSensorOptions, getZonesWithStock } from "@/lib/inventario/zones-queries";

export default async function ZonasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const zones = await getZonesWithStock();
  const sensorOptions = await getSensorOptions();

  return (
    <div className="px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-c24-navy">Stock</h1>
          <p className="mt-1 text-sm text-c24-text-muted">Cuánto stock de sensores hay en cada zona</p>
        </div>
        <ZonasPageActions zones={zones} sensorOptions={sensorOptions} />
      </div>

      {zones.length === 0 ? (
        <Card dashed className="mt-8 flex flex-col items-center gap-1 py-12 text-center">
          <p className="text-sm text-c24-text-muted">Aún no hay zonas creadas</p>
        </Card>
      ) : (
        <div className="mt-8 flex flex-wrap items-start gap-4">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} sensorOptions={sensorOptions} />
          ))}
        </div>
      )}
    </div>
  );
}
