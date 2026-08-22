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
    <Modal onClose={onClose} size="lg">
      <h3 className="text-base font-semibold text-c24-navy">Gestionar zonas</h3>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la zona…" />
        <Input
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="Ubicación (opcional)"
        />
        <Button type="button" fullWidth={false} disabled={isCreating || !newName.trim()} onClick={handleCreate}>
          {isCreating ? "Agregando…" : "Agregar"}
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor="new-rows" className="text-xs font-medium text-c24-text-muted">
          Baldas
        </label>
        <Input
          id="new-rows"
          type="number"
          min={1}
          max={12}
          value={newRows}
          onChange={(e) => setNewRows(e.target.value)}
          className="w-16"
        />
        <label htmlFor="new-cols" className="text-xs font-medium text-c24-text-muted">
          Posiciones por balda
        </label>
        <Input
          id="new-cols"
          type="number"
          min={1}
          max={12}
          value={newCols}
          onChange={(e) => setNewCols(e.target.value)}
          className="w-16"
        />
      </div>
      {createError && (
        <p className="mt-2 rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{createError}</p>
      )}

      {zones.length === 0 && <p className="mt-4 text-sm text-c24-text-muted">Sin zonas todavía</p>}

      <ul className="mt-4 flex flex-col divide-y divide-c24-border">
        {zones.map((zone) => (
          <li key={zone.id} className="flex flex-wrap items-center gap-2 py-2.5">
            {editingId === zone.id ? (
              <>
                <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus />
                <Input value={editingLocation} onChange={(e) => setEditingLocation(e.target.value)} />
                <label htmlFor={`edit-rows-${zone.id}`} className="text-xs font-medium text-c24-text-muted">
                  Baldas
                </label>
                <Input
                  id={`edit-rows-${zone.id}`}
                  type="number"
                  min={1}
                  max={12}
                  value={editingRows}
                  onChange={(e) => setEditingRows(e.target.value)}
                  className="w-16"
                />
                <label htmlFor={`edit-cols-${zone.id}`} className="text-xs font-medium text-c24-text-muted">
                  Posiciones
                </label>
                <Input
                  id={`edit-cols-${zone.id}`}
                  type="number"
                  min={1}
                  max={12}
                  value={editingCols}
                  onChange={(e) => setEditingCols(e.target.value)}
                  className="w-16"
                />
                <Button type="button" fullWidth={false} disabled={isEditing} onClick={() => handleSaveEdit(zone.id)}>
                  Guardar
                </Button>
                <Button type="button" variant="ghost" fullWidth={false} onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
                {editError && <p className="w-full text-sm text-c24-danger">{editError}</p>}
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm text-c24-navy">{zone.name}</p>
                  {zone.location && <p className="text-xs text-c24-text-muted">{zone.location}</p>}
                  <p className="text-xs text-c24-text-muted">
                    {zone.rows} baldas × {zone.cols} posiciones
                  </p>
                </div>
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
              </>
            )}
          </li>
        ))}
      </ul>

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
