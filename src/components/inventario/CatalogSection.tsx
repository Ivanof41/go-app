"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { CatalogActionState } from "@/app/(protected)/inventario/catalogo/actions";

export type CatalogItem = { id: string; name: string };
export type CatalogAction = (
  prev: CatalogActionState,
  formData: FormData,
) => Promise<CatalogActionState>;

export function CatalogSection({
  items,
  createAction,
  updateAction,
  deleteAction,
  singularLabel,
  addPlaceholder,
  emptyLabel,
}: {
  items: CatalogItem[];
  createAction: CatalogAction;
  updateAction: CatalogAction;
  deleteAction: CatalogAction;
  singularLabel: string;
  addPlaceholder: string;
  emptyLabel: string;
}) {
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, startEdit] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
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
      setDeleteTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={addPlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button type="button" fullWidth={false} disabled={isCreating || !newName.trim()} onClick={handleCreate}>
          {isCreating ? "Agregando…" : "Agregar"}
        </Button>
      </div>
      {createError && (
        <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{createError}</p>
      )}

      {items.length === 0 && <p className="text-sm text-c24-text-muted">{emptyLabel}</p>}

      <ul className="flex flex-col divide-y divide-c24-border">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-2 py-2.5">
            {editingId === item.id ? (
              <>
                <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus />
                <Button type="button" fullWidth={false} disabled={isEditing} onClick={() => handleSaveEdit(item.id)}>
                  Guardar
                </Button>
                <Button type="button" variant="ghost" fullWidth={false} onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
                {editError && <p className="w-full text-sm text-c24-danger">{editError}</p>}
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-c24-navy">{item.name}</span>
                <button
                  type="button"
                  aria-label="Editar"
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
                  aria-label="Eliminar"
                  onClick={() => {
                    setDeleteTarget(item);
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

      {deleteTarget && (
        <ConfirmDialog
          title={`Eliminar ${singularLabel}`}
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
