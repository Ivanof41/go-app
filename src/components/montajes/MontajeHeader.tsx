"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Link2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MontajeForm, type MontajeFormValues } from "@/components/montajes/MontajeForm";
import { InstallLinkModal } from "@/components/montajes/InstallLinkModal";

export function MontajeHeader({
  montaje,
  startedAt,
  installToken,
  installLinkBaseUrl,
  initialEditing = false,
}: {
  montaje: MontajeFormValues;
  startedAt: Date | null;
  installToken: string | null;
  installLinkBaseUrl: string;
  // Para poder llegar directo en modo edición desde un enlace (ej. la fila de la tabla
  // de Montajes con ?edit=1) sin tener que hacer un clic extra en "Editar" acá adentro.
  initialEditing?: boolean;
}) {
  const [editing, setEditing] = useState(initialEditing);
  const [showLinkModal, setShowLinkModal] = useState(false);

  if (editing) {
    return (
      <Card light>
        <MontajeForm montaje={montaje} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">{montaje.clientName}</h1>
          <p className="mt-1 text-sm text-white/70">{montaje.address}</p>
          {montaje.notes && <p className="mt-3 text-sm text-white/80">{montaje.notes}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Sin condición de estado a propósito, a diferencia del enlace del técnico —
              esta ficha se imprime para meter en la caja ANTES de salir, con el montaje
              todavía en Preparado. */}
          <Link
            href={`/montajes/${montaje.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ficha para imprimir"
            className="inline-flex items-center justify-center rounded-md border border-white/20 p-2.5 text-white transition hover:bg-white/10"
          >
            <FileText className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          {/* Solo tiene sentido armar el enlace del técnico una vez que el kit salió de
              la oficina — antes de Iniciado no hay nada que instalar todavía. */}
          {startedAt && (
            <Button
              type="button"
              variant="ghost"
              dark
              fullWidth={false}
              aria-label="Enlace para el técnico"
              onClick={() => setShowLinkModal(true)}
            >
              <Link2 className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          )}
          <Button type="button" variant="ghost" dark fullWidth={false} onClick={() => setEditing(true)}>
            <span className="flex items-center gap-1.5">
              <Pencil className="h-4 w-4" strokeWidth={1.75} /> Editar
            </span>
          </Button>
        </div>
      </div>

      {showLinkModal && (
        <InstallLinkModal
          montajeId={montaje.id}
          installToken={installToken}
          baseUrl={installLinkBaseUrl}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </Card>
  );
}
