"use client";

import { useActionState, useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { importSensorsAction, type ImportSensorsState } from "@/app/(protected)/inventario/sensores/actions";

export function ImportSensorsModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ImportSensorsState, FormData>(importSensorsAction, undefined);
  const [hasFile, setHasFile] = useState(false);
  const done = state?.created !== undefined;

  return (
    <Modal onClose={onClose} size="lg">
      <h3 className="text-base font-semibold text-c24-navy">Importar sensores desde Excel</h3>

      {!done && (
        // React resetea el form tras la action (el input de archivo queda vacío), así
        // que el botón tiene que volver a deshabilitarse hasta que se elija otro archivo.
        <form action={formAction} onSubmit={() => setHasFile(false)}>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-c24-text-muted">
            <li>Descarga la plantilla y rellena una fila por sensor.</li>
            <li>Solo Nombre y Tipo son obligatorios.</li>
            <li>Sube el archivo. Los sensores con un nombre que ya existe se omiten.</li>
          </ol>

          <a
            href="/api/sensores/plantilla"
            className="mt-4 inline-flex items-center rounded-md border border-c24-border px-3 py-2 text-sm font-medium text-c24-navy transition hover:bg-c24-teal-light"
          >
            <Download className="mr-1.5 h-4 w-4" strokeWidth={1.75} /> Descargar plantilla
          </a>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="import-file" className="text-sm font-medium text-c24-navy">
              Archivo Excel (.xlsx)
            </label>
            <input
              id="import-file"
              type="file"
              name="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setHasFile(!!e.target.files?.length)}
              className="text-sm text-c24-navy file:mr-3 file:rounded-md file:border-0 file:bg-c24-teal-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-c24-navy hover:file:bg-c24-teal-light/70"
            />
          </div>

          {state?.error && (
            <div className="mt-3 rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">
              <p>{state.error}</p>
              {state.rowErrors && state.rowErrors.length > 0 && (
                <ul className="mt-2 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5">
                  {state.rowErrors.map((e, i) => (
                    <li key={i}>
                      Fila {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth={false} disabled={isPending || !hasFile}>
              {isPending ? "Importando…" : "Importar"}
            </Button>
          </div>
        </form>
      )}

      {done && (
        <div>
          <p className="mt-3 rounded-md bg-c24-teal-light px-3 py-2 text-sm text-c24-navy">
            {state.created === 0
              ? "No se importó ningún sensor nuevo."
              : `${state.created} sensor(es) importado(s) correctamente.`}
            {!!state.newCatalogEntries && ` Se crearon ${state.newCatalogEntries} marca(s)/tecnología(s)/proveedor(es) nuevos.`}
          </p>
          {state.skipped && state.skipped.length > 0 && (
            <div className="mt-3 text-sm text-c24-text-muted">
              <p className="font-medium text-c24-navy">Omitidos ({state.skipped.length}):</p>
              <ul className="mt-1 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5">
                {state.skipped.map((s) => (
                  <li key={s.row}>
                    Fila {s.row} — {s.name}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button type="button" fullWidth={false} onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
