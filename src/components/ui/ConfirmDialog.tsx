"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  isPending,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <h3 className="text-base font-semibold text-c24-navy">{title}</h3>
      {description && <p className="mt-2 text-sm text-c24-text-muted">{description}</p>}
      {error && (
        <p className="mt-3 rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{error}</p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" fullWidth={false} onClick={onClose} disabled={isPending}>
          {cancelLabel}
        </Button>
        <Button type="button" variant="danger" fullWidth={false} onClick={onConfirm} disabled={isPending}>
          {isPending ? "Eliminando…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
