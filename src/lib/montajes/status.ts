import { CheckCircle2, PackageCheck, Truck, type LucideIcon } from "lucide-react";

export type MontajeStatus = "preparado" | "iniciado" | "completado";

// Se deriva acá, no se guarda en la base — así nunca puede desincronizarse de startedAt/
// los ítems reales. Compartido entre MontajesTable (listado) y MontajeDetail (ficha) para
// que ambos lugares nunca puedan mostrar un estado distinto para el mismo montaje.
export function statusFor(
  startedAt: Date | null,
  itemCount: number,
  installedCount: number,
): { status: MontajeStatus; label: string; className: string; icon: LucideIcon; note?: string } {
  if (!startedAt) {
    return {
      status: "preparado",
      label: "Preparado",
      className: "bg-c24-border text-c24-navy",
      icon: PackageCheck,
      note: itemCount === 0 ? "(sin sensores todavía)" : undefined,
    };
  }
  if (itemCount > 0 && installedCount >= itemCount) {
    return { status: "completado", label: "Completado", className: "bg-c24-teal-light text-c24-teal-dark", icon: CheckCircle2 };
  }
  return { status: "iniciado", label: "Iniciado", className: "bg-amber-100 text-amber-700", icon: Truck };
}
