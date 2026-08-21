import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 py-10">
      <div
        className="relative overflow-hidden rounded-lg px-8 py-10"
        style={{ background: "linear-gradient(160deg, #003c5b 0%, #001f30 100%)" }}
      >
        <div
          className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "#6ab5ab" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "#6ab5ab" }}
        />

        <div className="relative">
          <h1 className="text-2xl font-semibold text-white">Bienvenido, {user.name}</h1>
          <p className="mt-1 text-sm text-white/70">Este es tu panel de Go!</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
