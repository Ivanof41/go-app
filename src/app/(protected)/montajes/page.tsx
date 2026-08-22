import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";

export default async function MontajesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-semibold text-c24-navy">Montajes</h1>
      <p className="mt-1 text-sm text-c24-text-muted">Control de montajes en marcha</p>

      <Card dashed className="mt-8 flex flex-col items-center gap-1 py-16 text-center">
        <p className="text-sm text-c24-text-muted">Próximamente</p>
      </Card>
    </div>
  );
}
