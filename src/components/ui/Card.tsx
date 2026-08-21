import { type HTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  dashed?: boolean;
};

export function Card({ title, dashed, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-6",
        dashed ? "border-dashed border-c24-border bg-white/60" : "border-c24-border bg-white",
        className,
      )}
      {...props}
    >
      {title && <h2 className="mb-4 text-base font-semibold text-c24-navy">{title}</h2>}
      {children}
    </div>
  );
}
