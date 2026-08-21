"use client";

import { useEffect, type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type ModalProps = {
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Modal({ onClose, children, className }: ModalProps) {
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
        className={clsx("w-full max-w-sm rounded-lg bg-white p-4", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
