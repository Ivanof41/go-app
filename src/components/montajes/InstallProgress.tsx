export function InstallProgress({ installed, total }: { installed: number; total: number }) {
  const pct = total > 0 ? Math.round((installed / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-c24-navy">Progreso de instalación</span>
        <span className="text-c24-text-muted">
          {installed} / {total} instalados ({pct}%)
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-c24-border">
        <div className="h-full rounded-full bg-c24-teal transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
