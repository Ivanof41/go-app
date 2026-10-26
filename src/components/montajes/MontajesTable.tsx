"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ChevronsUpDown, FileText, Link2, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tooltip } from "@/components/ui/Tooltip";
import { InstallLinkModal } from "@/components/montajes/InstallLinkModal";
import { clsx } from "@/lib/clsx";
import { deleteMontajeAction } from "@/app/(protected)/montajes/actions";
import { statusFor, type MontajeStatus } from "@/lib/montajes/status";

export type MontajeRow = {
  id: string;
  clientName: string;
  address: string;
  startedAt: Date | null;
  installToken: string | null;
  itemCount: number;
  installedCount: number;
  totalCost: number;
  totalSale: number;
  createdAt: Date;
};

function formatMoney(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

type SortKey = "clientName" | "address" | "status" | "itemCount" | "totalCost" | "totalSale" | "profit" | "createdAt";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "clientName", label: "Cliente" },
  { key: "address", label: "Dirección" },
  { key: "status", label: "Estado" },
  { key: "itemCount", label: "Nº sensores" },
  { key: "totalCost", label: "Costo" },
  { key: "totalSale", label: "Venta" },
  { key: "profit", label: "Beneficio" },
  { key: "createdAt", label: "Creado" },
];

// Orden lógico del flujo, no alfabético — para que ordenar por Estado agrupe de forma
// coherente con el proceso real (Preparado -> Iniciado -> Completado).
const STATUS_ORDER: Record<MontajeStatus, number> = { preparado: 0, iniciado: 1, completado: 2 };

export function MontajesTable({ montajes, installLinkBaseUrl }: { montajes: MontajeRow[]; installLinkBaseUrl: string }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<MontajeRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [linkTarget, setLinkTarget] = useState<MontajeRow | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedMontajes = useMemo(() => {
    const sorted = [...montajes].sort((a, b) => {
      let cmp: number;
      if (sortKey === "status") {
        const statusA = statusFor(a.startedAt, a.itemCount, a.installedCount).status;
        const statusB = statusFor(b.startedAt, b.itemCount, b.installedCount).status;
        cmp = STATUS_ORDER[statusA] - STATUS_ORDER[statusB];
      } else if (sortKey === "itemCount") {
        cmp = a.itemCount - b.itemCount;
      } else if (sortKey === "totalCost") {
        cmp = a.totalCost - b.totalCost;
      } else if (sortKey === "totalSale") {
        cmp = a.totalSale - b.totalSale;
      } else if (sortKey === "profit") {
        cmp = a.totalSale - a.totalCost - (b.totalSale - b.totalCost);
      } else if (sortKey === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        cmp = a[sortKey].localeCompare(b[sortKey]);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [montajes, sortKey, sortDir]);

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", deleteTarget.id);
      const result = await deleteMontajeAction(undefined, formData);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div>
      <div className="-mx-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-c24-border text-left text-c24-text-muted">
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                const SortIcon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
                return (
                  <th key={col.key} className="px-3 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={clsx(
                        "group flex items-center gap-1 transition hover:text-c24-navy",
                        active && "text-c24-navy",
                      )}
                    >
                      {col.label}
                      {/* Opacidad baja cuando la columna no está activa: el ícono de
                          orden siempre visible competía en peso visual con el título,
                          dando sensación de header "descentrado" respecto del dato de
                          abajo aunque el borde izquierdo coincida exactamente. */}
                      <SortIcon
                        className={clsx(
                          "h-3.5 w-3.5 transition-opacity",
                          active ? "opacity-100" : "opacity-40 group-hover:opacity-100",
                        )}
                        strokeWidth={1.75}
                      />
                    </button>
                  </th>
                );
              })}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-c24-border">
            {sortedMontajes.map((m) => {
              const status = statusFor(m.startedAt, m.itemCount, m.installedCount);
              const StatusIcon = status.icon;
              return (
              <tr
                key={m.id}
                onClick={() => router.push(`/montajes/${m.id}?edit=1`)}
                className="cursor-pointer transition hover:bg-c24-teal-light/50"
              >
                <td className="px-3 py-2.5 text-c24-navy">{m.clientName}</td>
                <td className="max-w-[200px] truncate px-3 py-2.5 text-c24-navy" title={m.address}>
                  {m.address}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      status.className,
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    {status.label}
                  </span>
                  {status.note && <span className="ml-1.5 text-xs text-c24-text-muted">{status.note}</span>}
                </td>
                <td className="px-3 py-2.5 text-c24-navy">{m.itemCount}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-c24-navy">{formatMoney(m.totalCost)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-c24-navy">{formatMoney(m.totalSale)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-c24-navy">{formatMoney(m.totalSale - m.totalCost)}</td>
                <td className="px-3 py-2.5 text-c24-navy">{new Date(m.createdAt).toLocaleDateString("es-ES")}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {/* Sin condición de estado, a diferencia del enlace de abajo: la ficha
                      se imprime para meter en la caja ANTES de salir, con el montaje
                      todavía en Preparado. */}
                  <Tooltip label="Ficha para imprimir">
                    <Link
                      href={`/montajes/${m.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Ficha para imprimir"
                      className="inline-flex p-1.5 text-c24-text-muted hover:text-c24-navy"
                    >
                      <FileText className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                  </Tooltip>
                  {/* Igual que en la cabecera de Gestión: solo tiene sentido armar el
                      enlace del técnico una vez que el kit salió de la oficina. */}
                  {m.startedAt && (
                    <Tooltip label="Enlace para el técnico">
                      <button
                        type="button"
                        aria-label="Enlace para el técnico"
                        onClick={() => setLinkTarget(m)}
                        className="inline-flex p-1.5 text-c24-text-muted hover:text-c24-navy"
                      >
                        <Link2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip label="Editar montaje">
                    <Link
                      href={`/montajes/${m.id}?edit=1`}
                      aria-label="Editar montaje"
                      className="inline-flex p-1.5 text-c24-text-muted hover:text-c24-navy"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </Link>
                  </Tooltip>
                  <Tooltip label="Eliminar montaje">
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => {
                        setDeleteTarget(m);
                        setDeleteError(null);
                      }}
                      className="inline-flex p-1.5 text-c24-text-muted hover:text-c24-danger"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </Tooltip>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {montajes.length === 0 && <p className="mt-4 text-sm text-c24-text-muted">Sin montajes todavía.</p>}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar montaje"
          description={`¿Eliminar el montaje de "${deleteTarget.clientName}"? Esta acción no se puede deshacer.`}
          isPending={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {linkTarget && (
        <InstallLinkModal
          montajeId={linkTarget.id}
          installToken={linkTarget.installToken}
          baseUrl={installLinkBaseUrl}
          onClose={() => setLinkTarget(null)}
        />
      )}
    </div>
  );
}
