"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type ModalProps = {
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "lg";
};

const SIZES = {
  sm: "max-w-sm",
  lg: "max-w-lg",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => {
        mouseDownOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (mouseDownOnBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={clsx("w-full rounded-lg bg-white p-4", SIZES[size])}>{children}</div>
    </div>
  );
}
