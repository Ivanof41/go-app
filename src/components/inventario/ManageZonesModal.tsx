"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  createZoneAction,
  updateZoneAction,
  deleteZoneAction,
} from "@/app/(protected)/inventario/zonas/actions";

type Zone = { id: string; name: string; location: string | null; rows: number; cols: number };

export function ManageZonesModal({ zones, onClose }: { zones: Zone[]; onClose: () => void }) {
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newRows, setNewRows] = useState("3");
  const [newCols, setNewCols] = useState("4");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingLocation, setEditingLocation] = useState("");
  const [editingRows, setEditingRows] = useState("3");
  const [editingCols, setEditingCols] = useState("4");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, startEdit] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleCreate() {
    if (!newName.trim()) return;
    setCreateError(null);
    startCreate(async () => {
      const formData = new FormData();
      formData.set("name", newName.trim());
      formData.set("location", newLocation.trim());
      formData.set("rows", newRows);
      formData.set("cols", newCols);
      const result = await createZoneAction(undefined, formData);
      if (result?.error) {
        setCreateError(result.error);
        return;
      }
      setNewName("");
      setNewLocation("");
      setNewRows("3");
      setNewCols("4");
    });
  }

  function handleSaveEdit(id: string) {
    if (!editingName.trim()) return;
    setEditError(null);
    startEdit(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("name", editingName.trim());
      formData.set("location", editingLocation.trim());
      formData.set("rows", editingRows);
      formData.set("cols", editingCols);
      const result = await updateZoneAction(undefined, formData);
      if (result?.error) {
        setEditError(result.error);
        return;
      }
      setEditingId(null);
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", deleteTarget.id);
      const result = await deleteZoneAction(undefined, formData);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
    });
  }

  return (
    <Modal onClose={onClose} size="xl">
      <h3 className="text-base font-semibold text-c24-navy">Gestionar zonas</h3>

      <div className="mt-4 rounded-md border border-c24-border p-4">
        <h4 className="text-sm font-semibold text-c24-navy">Nueva zona</h4>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-name" className="text-sm font-medium text-c24-navy">
              Nombre
            </label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la zona…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-location" className="text-sm font-medium text-c24-navy">
              Ubicación (opcional)
            </label>
            <Input
              id="new-location"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="ej. Almacén B"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-xs">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-rows" className="text-sm font-medium text-c24-navy">
              Baldas
            </label>
            <Input
              id="new-rows"
              type="number"
              min={1}
              max={12}
              value={newRows}
              onChange={(e) => setNewRows(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-cols" className="text-sm font-medium text-c24-navy">
              Posiciones por balda
            </label>
            <Input
              id="new-cols"
              type="number"
              min={1}
              max={12}
              value={newCols}
              onChange={(e) => setNewCols(e.target.value)}
            />
          </div>
        </div>

        {createError && (
          <p className="mt-3 rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{createError}</p>
        )}

        <div className="mt-3 flex justify-end">
          <Button type="button" fullWidth={false} disabled={isCreating || !newName.trim()} onClick={handleCreate}>
            {isCreating ? "Agregando…" : "Agregar zona"}
          </Button>
        </div>
      </div>

      <h4 className="mt-6 text-sm font-semibold text-c24-navy">Zonas existentes</h4>

      {zones.length === 0 ? (
        <p className="mt-2 text-sm text-c24-text-muted">Sin zonas todavía</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-c24-border text-left text-c24-text-muted">
                <th className="py-2 font-medium">Nombre</th>
                <th className="py-2 font-medium">Ubicación</th>
                <th className="py-2 font-medium">Baldas</th>
                <th className="py-2 font-medium">Posiciones</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-c24-border">
              {zones.map((zone) =>
                editingId === zone.id ? (
                  <tr key={zone.id}>
                    <td className="py-2 pr-2">
                      <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus />
                    </td>
                    <td className="py-2 pr-2">
                      <Input value={editingLocation} onChange={(e) => setEditingLocation(e.target.value)} />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={editingRows}
                        onChange={(e) => setEditingRows(e.target.value)}
                        className="w-16"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={editingCols}
                        onChange={(e) => setEditingCols(e.target.value)}
                        className="w-16"
                      />
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        fullWidth={false}
                        disabled={isEditing}
                        onClick={() => handleSaveEdit(zone.id)}
                      >
                        Guardar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        fullWidth={false}
                        onClick={() => setEditingId(null)}
                        className="ml-2"
                      >
                        Cancelar
                      </Button>
                      {editError && <p className="mt-1 text-sm text-c24-danger">{editError}</p>}
                    </td>
                  </tr>
                ) : (
                  <tr key={zone.id}>
                    <td className="py-2.5 text-c24-navy">{zone.name}</td>
                    <td className="py-2.5 text-c24-navy">{zone.location ?? "—"}</td>
                    <td className="py-2.5 text-c24-navy">{zone.rows}</td>
                    <td className="py-2.5 text-c24-navy">{zone.cols}</td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => {
                          setEditingId(zone.id);
                          setEditingName(zone.name);
                          setEditingLocation(zone.location ?? "");
                          setEditingRows(String(zone.rows));
                          setEditingCols(String(zone.cols));
                          setEditError(null);
                        }}
                        className="p-1.5 text-c24-text-muted hover:text-c24-navy"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => {
                          setDeleteTarget(zone);
                          setDeleteError(null);
                        }}
                        className="p-1.5 text-c24-text-muted hover:text-c24-danger"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar zona"
          description={`¿Eliminar "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
          isPending={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Modal>
  );
}
