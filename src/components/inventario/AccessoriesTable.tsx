"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ChevronsUpDown, Pencil, Search, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tooltip } from "@/components/ui/Tooltip";
import { getSensorTypeIcon, getSensorTypeLabel } from "@/lib/inventario/sensor-types";
import { formatEuro } from "@/lib/inventario/format";
import { deleteAccessoryAction } from "@/app/(protected)/inventario/sensores/actions";
import { clsx } from "@/lib/clsx";

export type AccessoryRow = {
  id: string;
  name: string;
  type: string;
  brandId: string | null;
  brandName: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
};

type SortKey = "type" | "name" | "brandName" | "purchasePrice" | "salePrice";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "type", label: "Ícono" },
  { key: "name", label: "Nombre" },
  { key: "brandName", label: "Marca" },
  { key: "purchasePrice", label: "P. compra" },
  { key: "salePrice", label: "P. venta" },
];

export function AccessoriesTable({ accessories }: { accessories: AccessoryRow[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<AccessoryRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accessories;
    return accessories.filter((a) =>
      [a.name, a.brandName, getSensorTypeLabel(a.type)].filter(Boolean).some((field) => field!.toLowerCase().includes(q)),
    );
  }, [accessories, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp: number;
      if (sortKey === "type") {
        cmp = getSensorTypeLabel(a.type).localeCompare(getSensorTypeLabel(b.type));
      } else if (sortKey === "purchasePrice" || sortKey === "salePrice") {
        cmp = (a[sortKey] ?? -Infinity) - (b[sortKey] ?? -Infinity);
      } else {
        cmp = (a[sortKey] ?? "").localeCompare(b[sortKey] ?? "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", deleteTarget.id);
      const result = await deleteAccessoryAction(undefined, formData);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div>
      <div className="relative w-64">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-c24-text-muted"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar accesorio…"
          className="w-full rounded-md border border-c24-border bg-white py-2.5 pr-3 pl-9 text-sm text-c24-navy placeholder:text-c24-text-muted/60 outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-c24-border text-left text-c24-text-muted">
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                const SortIcon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
                return (
                  <th key={col.key} className="py-2 font-medium">
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
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-c24-border">
            {sorted.map((a) => {
              const TypeIcon = getSensorTypeIcon(a.type);
              return (
                <tr
                  key={a.id}
                  onClick={() => router.push(`/inventario/sensores/accesorios/${a.id}/editar`)}
                  className="cursor-pointer transition hover:bg-c24-teal-light/50"
                >
                  <td className="py-2.5">
                    <span
                      title={getSensorTypeLabel(a.type)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-c24-navy"
                    >
                      <TypeIcon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  </td>
                  <td className="py-2.5 text-c24-navy">{a.name}</td>
                  <td className="py-2.5 text-c24-navy">{a.brandName ?? "—"}</td>
                  <td className="py-2.5 text-c24-navy">{formatEuro(a.purchasePrice)}</td>
                  <td className="py-2.5 text-c24-navy">{formatEuro(a.salePrice)}</td>
                  <td className="py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Tooltip label="Editar accesorio">
                      <Link
                        href={`/inventario/sensores/accesorios/${a.id}/editar`}
                        aria-label="Editar"
                        className="inline-flex p-1.5 text-c24-text-muted hover:text-c24-navy"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                    </Tooltip>
                    <Tooltip label="Eliminar accesorio">
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => {
                          setDeleteTarget(a);
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
      {accessories.length === 0 && <p className="mt-4 text-sm text-c24-text-muted">Sin accesorios todavía.</p>}
      {accessories.length > 0 && sorted.length === 0 && (
        <p className="mt-4 text-sm text-c24-text-muted">Ningún accesorio coincide con &ldquo;{search}&rdquo;.</p>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar accesorio"
          description={`¿Eliminar "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
          isPending={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
