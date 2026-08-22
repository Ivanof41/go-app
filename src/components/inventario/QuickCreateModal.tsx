"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { CatalogAction } from "@/components/inventario/CatalogSection";

export function QuickCreateModal({
  title,
  label,
  createAction,
  onCreated,
  onClose,
}: {
  title: string;
  label: string;
  createAction: CatalogAction;
  onCreated: (option: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      const result = await createAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.id && result?.name) onCreated({ id: result.id, name: result.name });
    });
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-base font-semibold text-c24-navy">{title}</h3>
      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="quick-create-name" className="text-sm font-medium text-c24-navy">
          {label}
        </label>
        <Input id="quick-create-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      {error && (
        <p className="mt-2 rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{error}</p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" fullWidth={false} disabled={isPending || !name.trim()} onClick={handleCreate}>
          {isPending ? "Creando…" : "Crear"}
        </Button>
      </div>
    </Modal>
  );
}
