"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { compressPhoto } from "@/lib/montajes/photo";
import { removeInstalledPhotoAction, uploadInstalledPhotoAction } from "@/app/(protected)/montajes/actions";
import type { InstallItemRow } from "@/components/montajes/InstallChecklist";

export function InstallPhotoModal({
  item,
  onSaved,
  onClose,
}: {
  item: InstallItemRow;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  function handleSubmit() {
    if (!file) {
      setError("Selecciona una foto");
      return;
    }
    setError(null);
    startTransition(async () => {
      const compressed = await compressPhoto(file);
      const formData = new FormData();
      formData.set("id", item.id);
      formData.set("photo", compressed, "photo.jpg");
      const result = await uploadInstalledPhotoAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  function handleRemove() {
    setError(null);
    startRemove(async () => {
      const formData = new FormData();
      formData.set("id", item.id);
      const result = await removeInstalledPhotoAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-base font-semibold text-c24-navy">Foto de instalación</h3>
      <p className="mt-1 text-sm text-c24-text-muted">
        {item.sensorName} — {item.location}
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {item.installedPhotoPath && !file && (
          <div className="flex items-end gap-3">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-md bg-c24-teal-light">
              {/* no-store en la ruta que sirve esto — un <img> recién montado siempre pide
                  de nuevo, no hace falta cache-busting acá. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/montajes/uploads/${item.id}/instalada`} alt="" className="h-full w-full object-cover" />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-sm font-medium text-c24-danger hover:underline disabled:opacity-60"
            >
              {isRemoving ? "Quitando…" : "Quitar foto"}
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-c24-navy file:mr-3 file:rounded-md file:border-0 file:bg-c24-teal-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-c24-navy hover:file:bg-c24-teal-light/70"
        />

        {error && <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" fullWidth={false} disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
