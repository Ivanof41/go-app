import { type ButtonHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "accent" | "danger";
  fullWidth?: boolean;
  // Para botones que viven dentro de una Card oscura — mismo criterio que la prop
  // `variant` de Input: "primary"/"ghost" asumen fondo claro (navy sobre blanco, borde
  // navy sobre blanco) y se leen mal sobre una Card navy. "accent"/"danger" ya tienen
  // fondo sólido propio y se ven bien en cualquier fondo, así que no cambian con `dark`.
  dark?: boolean;
};

export function Button({ variant = "primary", fullWidth = true, dark, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-md px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth && "w-full",
        variant === "primary" &&
          (dark
            ? "bg-c24-teal text-c24-navy hover:bg-c24-teal-dark hover:text-white"
            : "bg-c24-navy text-white hover:bg-c24-teal-dark"),
        variant === "ghost" &&
          (dark
            ? "border border-white/20 text-white hover:bg-white/10"
            : "border border-c24-border text-c24-navy hover:bg-c24-teal-light"),
        variant === "accent" &&
          "bg-c24-teal text-c24-navy hover:bg-c24-teal-dark hover:text-white",
        variant === "danger" &&
          "bg-c24-danger text-white hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}
