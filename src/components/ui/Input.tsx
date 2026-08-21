import { type InputHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: "light" | "dark";
};

export function Input({ variant = "light", className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        "w-full rounded-md px-3 py-2.5 text-sm outline-none transition",
        variant === "light" &&
          "border border-c24-border bg-white text-c24-navy placeholder:text-c24-text-muted/60 focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30",
        variant === "dark" &&
          "border border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/40",
        className,
      )}
      {...props}
    />
  );
}
