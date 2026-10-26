import { type HTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  dashed?: boolean;
  // Mismo tono más claro que ya usa `dashed` (bg-c24-navy/70) pero con borde sólido —
  // separado de `dashed` porque el punteado implica "todavía no hay nada acá" (estado
  // vacío/placeholder), y una ZoneCard con contenido real no es eso.
  muted?: boolean;
  // Los formularios de Sensor/Accesorio (nuevo y editar) se prefieren claros en vez del
  // navy oscuro por defecto del resto de la app — es la única excepción hoy.
  light?: boolean;
};

export function Card({ title, dashed, muted, light, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-6",
        dashed && "border-dashed",
        light
          ? "border-c24-border bg-white"
          : dashed || muted
            ? "border-white/15 bg-c24-navy/70"
            : "border-white/10 bg-c24-navy",
        className,
      )}
      {...props}
    >
      {title && (
        <h2 className={clsx("mb-4 text-base font-semibold", light ? "text-c24-navy" : "text-white")}>{title}</h2>
      )}
      {children}
    </div>
  );
}
