"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SensorForm, type SensorFormValues } from "@/components/inventario/SensorForm";
import { getSensorTypeIcon, getSensorTypeLabel } from "@/lib/inventario/sensor-types";
import { formatEuro } from "@/lib/inventario/format";
import { deleteSensorAction } from "@/app/(protected)/inventario/sensores/actions";
import { clsx } from "@/lib/clsx";

type Option = { id: string; name: string };
type SensorRow = SensorFormValues & {
  brandName: string | null;
  technologyName: string | null;
  providerName: string | null;
};

type SortKey = "type" | "name" | "brandName" | "technologyName" | "providerName" | "purchasePrice" | "salePrice";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "type", label: "Tipo" },
  { key: "name", label: "Nombre" },
  { key: "brandName", label: "Marca" },
  { key: "technologyName", label: "Tecnología" },
  { key: "providerName", label: "Proveedor" },
  { key: "purchasePrice", label: "P. compra" },
  { key: "salePrice", label: "P. venta" },
];

export function SensorsTable({
  sensors,
  brands,
  technologies,
  providers,
}: {
  sensors: SensorRow[];
  brands: Option[];
  technologies: Option[];
  providers: Option[];
}) {
  const [modalMode, setModalMode] = useState<"create" | SensorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SensorRow | null>(null);
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

  const filteredSensors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sensors;
    return sensors.filter((s) =>
      [s.name, s.brandName, s.technologyName, s.providerName, getSensorTypeLabel(s.type)]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [sensors, search]);

  const sortedSensors = useMemo(() => {
    const sorted = [...filteredSensors].sort((a, b) => {
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
    return sorted;
  }, [filteredSensors, sortKey, sortDir]);

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", deleteTarget.id);
      const result = await deleteSensorAction(undefined, formData);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-c24-text-muted"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sensor…"
            className="w-full rounded-md border border-c24-border bg-white py-2.5 pr-3 pl-9 text-sm text-c24-navy placeholder:text-c24-text-muted/60 outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
          />
        </div>
        <Button type="button" fullWidth={false} onClick={() => setModalMode("create")}>
          <Plus className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} /> Nuevo sensor
        </Button>
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
                        "flex items-center gap-1 transition hover:text-c24-navy",
                        active && "text-c24-navy",
                      )}
                    >
                      {col.label}
                      <SortIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </th>
                );
              })}
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-c24-border">
            {sortedSensors.map((s) => {
              const TypeIcon = getSensorTypeIcon(s.type);
              return (
                <tr key={s.id} className="transition hover:bg-white">
                  <td className="py-2.5">
                    <span
                      title={getSensorTypeLabel(s.type)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-c24-teal-light text-c24-navy"
                    >
                      <TypeIcon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  </td>
                  <td className="py-2.5 text-c24-navy">{s.name}</td>
                  <td className="py-2.5 text-c24-navy">{s.brandName ?? "—"}</td>
                  <td className="py-2.5 text-c24-navy">{s.technologyName ?? "—"}</td>
                  <td className="py-2.5 text-c24-navy">{s.providerName ?? "—"}</td>
                  <td className="py-2.5 text-c24-navy">{formatEuro(s.purchasePrice)}</td>
                  <td className="py-2.5 text-c24-navy">{formatEuro(s.salePrice)}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => setModalMode(s)}
                      className="p-1.5 text-c24-text-muted hover:text-c24-navy"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => {
                        setDeleteTarget(s);
                        setDeleteError(null);
                      }}
                      className="p-1.5 text-c24-text-muted hover:text-c24-danger"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sensors.length === 0 && <p className="mt-4 text-sm text-c24-text-muted">Sin sensores todavía.</p>}
      {sensors.length > 0 && sortedSensors.length === 0 && (
        <p className="mt-4 text-sm text-c24-text-muted">Ningún sensor coincide con &ldquo;{search}&rdquo;.</p>
      )}

      {modalMode && (
        <Modal onClose={() => setModalMode(null)} size="xl">
          <SensorForm
            sensor={modalMode === "create" ? undefined : modalMode}
            title={modalMode === "create" ? "Nuevo sensor" : "Editar sensor"}
            brands={brands}
            technologies={technologies}
            providers={providers}
            onSaved={() => setModalMode(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar sensor"
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
