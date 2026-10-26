"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ensureInstallLinkAction, regenerateInstallLinkAction } from "@/app/(protected)/montajes/actions";

export function InstallLinkModal({
  montajeId,
  installToken,
  baseUrl,
  onClose,
}: {
  montajeId: string;
  installToken: string | null;
  baseUrl: string;
  onClose: () => void;
}) {
  const [token, setToken] = useState(installToken);
  const [copied, setCopied] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const url = token ? `${baseUrl}/i/${token}` : null;

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar — copiá el enlace de arriba a mano.");
    }
  }

  // Un solo botón para el caso normal: genera el enlace si todavía no existe (o
  // devuelve el que ya había — ensureInstallLinkAction es idempotente) y lo copia en el
  // mismo click, sin un paso "Generar" y otro "Copiar" aparte.
  function handleGenerateAndCopy() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", montajeId);
      const result = await ensureInstallLinkAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.token) {
        setToken(result.token);
        await copyToClipboard(`${baseUrl}/i/${result.token}`);
      }
    });
  }

  function handleRegenerate() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", montajeId);
      const result = await regenerateInstallLinkAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.token) {
        setToken(result.token);
        await copyToClipboard(`${baseUrl}/i/${result.token}`);
      }
      setConfirmingRegenerate(false);
    });
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-base font-semibold text-c24-navy">Enlace para el técnico</h3>
      <p className="mt-1 text-sm text-c24-text-muted">
        Mandaselo por WhatsApp — desde ahí puede marcar los sensores instalados y subir fotos, sin necesitar cuenta.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {url && (
          <p className="rounded-md border border-c24-border bg-white px-3 py-2 text-sm break-all text-c24-navy">
            {url}
          </p>
        )}

        {error && <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{error}</p>}

        <Button type="button" disabled={isPending} onClick={handleGenerateAndCopy}>
          {isPending ? "Generando…" : copied ? "¡Copiado!" : token ? "Copiar enlace" : "Generar y copiar enlace"}
        </Button>

        {token &&
          (confirmingRegenerate ? (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p>El enlace anterior deja de funcionar. ¿Regenerar de todas formas?</p>
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth={false}
                  disabled={isPending}
                  onClick={() => setConfirmingRegenerate(false)}
                >
                  Cancelar
                </Button>
                <Button type="button" variant="danger" fullWidth={false} disabled={isPending} onClick={handleRegenerate}>
                  Regenerar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingRegenerate(true)}
              className="self-start text-xs font-medium text-c24-text-muted underline hover:text-c24-navy"
            >
              Regenerar enlace (invalida el actual)
            </button>
          ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
