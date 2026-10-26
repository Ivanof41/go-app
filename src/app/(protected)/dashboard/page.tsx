import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Boxes, Euro, PackageCheck, Truck, type LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getDashboardStats } from "@/lib/dashboard/queries";
import { Card } from "@/components/ui/Card";
import { formatEuro } from "@/lib/inventario/format";
import { MontajesMapCard } from "@/components/dashboard/MontajesMapCard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await getDashboardStats();

  const STAT_CARDS: { href: string; label: string; value: string; icon: LucideIcon }[] = [
    { href: "/montajes", label: "Montajes en curso", value: String(stats.montajesEnCurso), icon: Truck },
    { href: "/montajes", label: "Montajes preparados", value: String(stats.montajesPreparados), icon: PackageCheck },
    { href: "/inventario/zonas", label: "Valor total en stock", value: formatEuro(stats.stockValue), icon: Euro },
    { href: "/inventario/zonas", label: "Unidades en stock", value: stats.stockUnits.toLocaleString("es-ES"), icon: Boxes },
    {
      href: "/inventario/sensores",
      label: "Sin precio cargado",
      value: String(stats.missingPriceCount),
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="px-6 py-10">
      <div
        className="relative overflow-hidden rounded-lg px-8 py-10"
        style={{ background: "linear-gradient(160deg, #003c5b 0%, #001f30 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "#6ab5ab" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "#6ab5ab" }}
        />

        <div className="pointer-events-none absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-white/25" />
        <div className="pointer-events-none absolute right-4 bottom-4 h-6 w-6 border-r-2 border-b-2 border-white/25" />

        <span className="pointer-events-none absolute top-5 right-5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-c24-teal opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-c24-teal" />
        </span>

        <div className="relative">
          <h1 className="text-2xl font-semibold text-white">Bienvenido, {user.name}</h1>
          <p className="mt-1 text-sm text-white/70">Este es tu panel de Go!</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAT_CARDS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <MontajesMapCard montajes={stats.mapMontajes} />
    </div>
  );
}

function StatCard({ href, label, value, icon: Icon }: { href: string; label: string; value: string; icon: LucideIcon }) {
  return (
    <Link href={href} className="group">
      <Card className="flex h-32 flex-col justify-between transition group-hover:bg-c24-teal-dark">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-c24-teal">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-xl font-semibold text-white">{value}</p>
          <p className="text-xs text-white/60">{label}</p>
        </div>
      </Card>
    </Link>
  );
}
