import { type InputHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy placeholder:text-c24-text-muted/60",
        "outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30",
        className,
      )}
      {...props}
    />
  );
}
