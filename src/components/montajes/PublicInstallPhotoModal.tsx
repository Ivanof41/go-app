"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { compressPhoto } from "@/lib/montajes/photo";
import { removeInstalledPhotoPublicAction, uploadInstalledPhotoPublicAction } from "@/app/i/actions";
import type { InstallItemRow } from "@/components/montajes/InstallChecklist";

// Mismo componente que InstallPhotoModal, pero para el enlace público del técnico (sin
// sesión): llama a la acción con token en vez de la autenticada, y las fotos van con
// ?token= en la URL para que la ruta que las sirve las deje pasar sin auth().
export function PublicInstallPhotoModal({
  token,
  item,
  onSaved,
  onClose,
}: {
  token: string;
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
      formData.set("token", token);
      formData.set("id", item.id);
      formData.set("photo", compressed, "photo.jpg");
      const result = await uploadInstalledPhotoPublicAction(undefined, formData);
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
      formData.set("token", token);
      formData.set("id", item.id);
      const result = await removeInstalledPhotoPublicAction(undefined, formData);
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/montajes/uploads/${item.id}/instalada?token=${token}`}
                alt=""
                className="h-full w-full object-cover"
              />
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

        {/* Sin capture="environment" a propósito: ese atributo hace que varios
            navegadores móviles abran la cámara directo, sin dar la opción de elegir
            "Archivos"/galería — el técnico tiene que poder elegir una foto que ya sacó
            antes, no solo sacar una nueva en el momento. */}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
