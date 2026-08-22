"use client";

import { useEffect, type ReactNode } from "react";
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
      onClick={onClose}
    >
      <div
        className={clsx("w-full rounded-lg bg-white p-4", SIZES[size])}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
