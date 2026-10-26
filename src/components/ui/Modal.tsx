"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type ModalProps = {
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "lg" | "xl" | "2xl";
};

const SIZES = {
  sm: "max-w-sm",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-4xl",
} as const;

export function Modal({ onClose, children, size = "sm" }: ModalProps) {
  const mouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      // z-[1100], no z-50: Leaflet pone sus propios controles/panes en z-index hasta
      // 1000 (y el dropdown de resultados de AddressMapPicker sube a 1001) — con z-50 un
      // modal abierto sobre una página que también tiene un mapa (ej. "Añadir sensor"
      // mientras se edita la dirección del montaje) quedaba TAPADO por los controles de
      // zoom y la atribución del mapa en vez de al revés.
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 px-4 py-8"
      onMouseDown={(e) => {
        mouseDownOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (mouseDownOnBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={clsx("max-h-full w-full overflow-y-auto rounded-lg bg-white p-4", SIZES[size])}>
        {children}
      </div>
    </div>
  );
}
