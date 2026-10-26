"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ActionState, CatalogAction } from "@/app/(protected)/inventario/sensores/actions";

type Option = { id: string; name: string };

export function ManageCatalogModal({
  title,
  entityLabel,
  newPlaceholder,
  emptyText,
  options,
  createAction,
  updateAction,
  deleteAction,
  onClose,
  onChange,
}: {
  title: string;
  entityLabel: string;
  newPlaceholder: string;
  emptyText: string;
  options: Option[];
  createAction: CatalogAction;
  updateAction: CatalogAction;
  deleteAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onClose: () => void;
  onChange: (options: Option[]) => void;
}) {
  const [items, setItems] = useState(options);

  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, startEdit] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<Option | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleCreate() {
    if (!newName.trim()) return;
    setCreateError(null);
    startCreate(async () => {
      const formData = new FormData();
      formData.set("name", newName.trim());
      const result = await createAction(undefined, formData);
      if (result?.error) {
        setCreateError(result.error);
        return;
      }
      if (result?.id && result?.name) {
        const next = [...items, { id: result.id, name: result.name }].sort((a, b) => a.name.localeCompare(b.name));
        setItems(next);
        onChange(next);
      }
      setNewName("");
    });
  }

  function handleSaveEdit(id: string) {
    if (!editingName.trim()) return;
    setEditError(null);
    startEdit(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("name", editingName.trim());
      const result = await updateAction(undefined, formData);
      if (result?.error) {
        setEditError(result.error);
        return;
      }
      const next = items
        .map((o) => (o.id === id ? { ...o, name: editingName.trim() } : o))
        .sort((a, b) => a.name.localeCompare(b.name));
      setItems(next);
      onChange(next);
      setEditingId(null);
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startDelete(async () => {
      const formData = new FormData();
      formData.set("id", deleteTarget.id);
      const result = await deleteAction(undefined, formData);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      const next = items.filter((o) => o.id !== deleteTarget.id);
      setItems(next);
      onChange(next);
      setDeleteTarget(null);
    });
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-base font-semibold text-c24-navy">{title}</h3>

      <div className="mt-4 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={newPlaceholder}
          autoFocus
        />
        <Button type="button" fullWidth={false} disabled={isCreating || !newName.trim()} onClick={handleCreate}>
          {isCreating ? "Agregando…" : "Agregar"}
        </Button>
      </div>
      {createError && <p className="mt-2 text-sm text-c24-danger">{createError}</p>}

      <div className="mt-4 max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-c24-text-muted">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-c24-border rounded-md border border-c24-border">
            {items.map((item) =>
              editingId === item.id ? (
                <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                    className="flex-1"
                  />
                  <Button type="button" fullWidth={false} disabled={isEditing} onClick={() => handleSaveEdit(item.id)}>
                    Guardar
                  </Button>
                  <Button type="button" variant="ghost" fullWidth={false} onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </li>
              ) : (
                <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="text-c24-navy">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Editar ${item.name}`}
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                        setEditError(null);
                      }}
                      className="p-1.5 text-c24-text-muted hover:text-c24-navy"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar ${item.name}`}
                      onClick={() => {
                        setDeleteTarget(item);
                        setDeleteError(null);
                      }}
                      className="p-1.5 text-c24-text-muted hover:text-c24-danger"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
        {editError && <p className="mt-2 text-sm text-c24-danger">{editError}</p>}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Eliminar ${entityLabel}`}
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
