import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 py-10">
      <h1 className="text-2xl font-semibold text-c24-navy">Bienvenido, {user.name}</h1>
      <p className="mt-1 text-sm text-c24-text-muted">Este es tu panel de Go!.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard title="Inventario" />
        <PlaceholderCard title="Montajes" />
      </div>
    </div>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <Card dashed className="flex h-32 flex-col justify-between">
      <span className="text-sm font-medium text-c24-navy">{title}</span>
      <span className="text-xs text-c24-text-muted">Próximamente</span>
    </Card>
  );
}
