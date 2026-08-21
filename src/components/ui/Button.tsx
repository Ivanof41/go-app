import { type ButtonHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "accent";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "w-full rounded-md px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-c24-navy text-white hover:bg-c24-teal-dark",
        variant === "ghost" &&
          "border border-c24-border text-c24-navy hover:bg-c24-teal-light",
        variant === "accent" &&
          "bg-c24-teal text-c24-navy hover:bg-c24-teal-dark hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
