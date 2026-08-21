import { clsx } from "@/lib/clsx";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-14 w-14 text-base",
  lg: "h-24 w-24 text-2xl",
} as const;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL ya redimensionado, no una URL remota
      <img
        src={src}
        alt={name}
        className={clsx("rounded-full object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-full bg-c24-teal font-semibold text-c24-navy",
        SIZES[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
