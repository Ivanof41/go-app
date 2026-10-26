import Link from "next/link";
import { clsx } from "@/lib/clsx";

const TABS = [
  { key: "gestion", label: "Gestión" },
  { key: "instalacion", label: "Instalación" },
] as const;

// Se ven como las pestañas de Sensores/Accesorios (SensoresTabs.tsx), pero son rutas
// reales, no estado de cliente — /montajes/[id]/instalacion necesita ser una URL propia
// desde ahora porque la Fase 3 (enlace público por token) va a exponer exactamente esa
// vista sin login, reutilizando el mismo componente y solo cambiando el chequeo de auth.
export function MontajeTabs({ montajeId, active }: { montajeId: string; active: "gestion" | "instalacion" }) {
  return (
    <div className="flex w-fit rounded-md border border-c24-border p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === "gestion" ? `/montajes/${montajeId}` : `/montajes/${montajeId}/instalacion`}
          className={clsx(
            "rounded-md px-4 py-1.5 text-sm font-medium transition",
            active === tab.key ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
