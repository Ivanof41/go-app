"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { clsx } from "@/lib/clsx";

type IconOption = { value: string; label: string; icon: LucideIcon };

// Modo iconOnly: se usa para clasificar por tipo/ícono (Sensor, Accesorio), donde el
// nombre es ruido y el ícono solo, con tooltip, alcanza. Es una franja de íconos siempre
// visible (sin desplegable) — con ~20 opciones fijas no vale la pena esconderlas detrás
// de un click, se ven y se eligen de una. Para elegir UNA instancia entre varias (ej. el
// selector de sensor de CellStockModal) el nombre es la única forma de distinguirlas, así
// que ese caso deja iconOnly en false (default) y conserva el desplegable con etiqueta.
export function IconSelect({
  id,
  options,
  value,
  onChange,
  iconOnly,
}: {
  id?: string;
  options: readonly IconOption[];
  value: string;
  onChange: (value: string) => void;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <div id={id} className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.label}
            aria-label={o.label}
            onClick={() => onChange(o.value)}
            className={clsx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition",
              o.value === value
                ? "border-c24-teal bg-c24-teal-light text-c24-navy"
                : "border-c24-border text-c24-navy hover:bg-c24-teal-light/60",
            )}
          >
            <o.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={o.value === value ? 2 : 1.75} />
          </button>
        ))}
      </div>
    );
  }

  return <LabeledIconSelect id={id} options={options} value={value} onChange={onChange} />;
}

function LabeledIconSelect({
  id,
  options,
  value,
  onChange,
}: {
  id?: string;
  options: readonly IconOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[options.length - 1];

  useEffect(() => {
    if (!open) return;

    function onDocMouseDown(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node) || panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScroll(e: Event) {
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const box = triggerRef.current?.getBoundingClientRect();
    if (box) setPosition({ top: box.bottom + 6, left: box.left, width: box.width });
    setOpen(true);
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-2.5 rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
      >
        <selected.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left">{selected.label}</span>
        <ChevronDown
          className={clsx("h-4 w-4 shrink-0 text-c24-text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: position.top, left: position.left, width: position.width }}
            className="fixed z-50 max-h-72 overflow-y-auto rounded-md border border-c24-border bg-white py-1 shadow-lg"
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition",
                  o.value === value
                    ? "bg-c24-teal-light font-medium text-c24-navy"
                    : "text-c24-navy hover:bg-c24-teal-light/60",
                )}
              >
                <o.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={o.value === value ? 2 : 1.75} />
                {o.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
