"use client";

import { useState, useTransition } from "react";
import { Ban, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconSelect } from "@/components/ui/IconSelect";
import { PhotoAnnotationModal } from "@/components/montajes/PhotoAnnotationModal";
import { getSensorTypeIcon } from "@/lib/inventario/sensor-types";
import { compressPhoto } from "@/lib/montajes/photo";
import { addMontajeItemAction, updateMontajeItemAction } from "@/app/(protected)/montajes/actions";

type SensorOption = { id: string; name: string; type: string };
type AccessoryOption = { id: string; name: string; type: string };
type AccessoryLine = { accessoryId: string; quantity: number };

export type MontajeItemFormValues = {
  id: string;
  sensorId: string;
  location: string;
  notes: string | null;
  photoPath: string | null;
  accessories: { id: string; name: string; quantity: number }[];
};

export function MontajeItemModal({
  montajeId,
  item,
  sensorOptions,
  accessoryOptions,
  onSaved,
  onClose,
}: {
  montajeId: string;
  item?: MontajeItemFormValues;
  sensorOptions: SensorOption[];
  accessoryOptions: AccessoryOption[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const [sensorId, setSensorId] = useState(item?.sensorId ?? sensorOptions[0]?.id ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [locationsText, setLocationsText] = useState("");
  // Modo alterno para cuando todavía no se sabe dónde va cada sensor (ej. "necesito 20 de
  // estos, ya los voy a nombrar en obra") — en vez de escribir cada ubicación, se pide
  // solo la cantidad y cada uno nace con un nombre provisorio para renombrar después.
  const [pendingMode, setPendingMode] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState("1");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [accessoryLines, setAccessoryLines] = useState<AccessoryLine[]>(
    item?.accessories.map((a) => ({ accessoryId: a.id, quantity: a.quantity })) ?? [],
  );
  const [newAccessoryId, setNewAccessoryId] = useState("");
  const [newAccessoryQty, setNewAccessoryQty] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [annotatedBlob, setAnnotatedBlob] = useState<Blob | null>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [isLoadingExistingPhoto, setIsLoadingExistingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const iconOptions = sensorOptions.map((o) => ({
    value: o.id,
    label: o.name,
    icon: getSensorTypeIcon(o.type),
  }));
  // Opción "ninguno" primero, para que el desplegable no arranque mostrando ya elegido
  // el primer accesorio de la lista — eso hacía parecer que ya estaba cargado, aunque en
  // realidad no se agrega nada hasta apretar el "+".
  const accessoryIconOptions = [
    { value: "", label: "Selecciona un accesorio", icon: Ban },
    ...accessoryOptions.map((o) => ({
      value: o.id,
      label: o.name,
      icon: getSensorTypeIcon(o.type),
    })),
  ];
  const accessoryNameById = new Map(accessoryOptions.map((o) => [o.id, o.name]));

  function addAccessoryLine() {
    if (!newAccessoryId) return;
    const qty = Math.max(1, Math.round(Number(newAccessoryQty) || 1));
    setAccessoryLines((lines) => {
      const existingLine = lines.find((l) => l.accessoryId === newAccessoryId);
      if (existingLine) {
        return lines.map((l) => (l.accessoryId === newAccessoryId ? { ...l, quantity: l.quantity + qty } : l));
      }
      return [...lines, { accessoryId: newAccessoryId, quantity: qty }];
    });
    setNewAccessoryId("");
    setNewAccessoryQty("1");
  }

  function removeAccessoryLine(accessoryId: string) {
    setAccessoryLines((lines) => lines.filter((l) => l.accessoryId !== accessoryId));
  }

  // Trae la foto ya subida y la mete en el mismo flujo de "archivo elegido" (file +
  // recorte automático) que una foto nueva — así no hace falta duplicar el editor de
  // recorte/marcado para el caso "editar la que ya está" vs. "subir una nueva".
  async function handleEditExistingPhoto() {
    if (!item?.photoPath) return;
    setError(null);
    setIsLoadingExistingPhoto(true);
    try {
      const response = await fetch(`/api/montajes/uploads/${item.id}`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      setFile(new File([blob], "foto-actual.jpg", { type: blob.type || "image/jpeg" }));
      setAnnotatedBlob(null);
      setShowAnnotator(true);
    } catch {
      setError("No se pudo cargar la foto actual");
    } finally {
      setIsLoadingExistingPhoto(false);
    }
  }

  // Un renglón de textarea por ubicación (modo alta): cada sensor del lote nace con su
  // nombre real (ej. "Daikin 1 - Impulsión") en vez de un número autogenerado que había
  // que renombrar a mano después, uno por uno. En modo "pendingMode" no hay nombres
  // todavía — se genera un placeholder por cantidad, para renombrar uno por uno después.
  const pendingQuantityNumber = Math.max(1, Math.min(50, Math.round(Number(pendingQuantity) || 1)));
  const locationLines = pendingMode
    ? Array.from({ length: pendingQuantityNumber }, (_, i) => `Ubicación pendiente #${i + 1}`)
    : locationsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
  // Cuando se dan de alta varias ubicaciones de una vez, la foto no se pide acá — meter N
  // recortes/marcados seguidos en el mismo modal sería tedioso. Cada ítem se crea sin
  // foto y se le agrega la suya propia después, editándolo desde la lista (uno por uno).
  const showPhotoSection = !!item || locationLines.length === 1;

  function handleSubmit() {
    if (item ? !location.trim() : locationLines.length === 0) {
      setError("La ubicación es obligatoria");
      return;
    }
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("sensorId", sensorId);
      if (item) {
        formData.set("id", item.id);
        formData.set("location", location);
      } else {
        formData.set("montajeId", montajeId);
        formData.set("locationsText", locationLines.join("\n"));
      }
      formData.set("notes", notes);
      formData.set("accessoriesJson", JSON.stringify(accessoryLines));
      if (showPhotoSection && file) {
        const photoBlob = annotatedBlob ?? (await compressPhoto(file));
        formData.set("photo", photoBlob, "photo.jpg");
      }
      const action = item ? updateMontajeItemAction : addMontajeItemAction;
      const result = await action(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  if (sensorOptions.length === 0) {
    return (
      <Modal onClose={onClose}>
        <h3 className="text-base font-semibold text-c24-navy">Añadir sensor</h3>
        <p className="mt-3 text-sm text-c24-text-muted">
          Todavía no hay sensores registrados. Crea uno primero en Inventario → Sensores.
        </p>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} size="xl">
      <h3 className="text-base font-semibold text-c24-navy">{item ? "Editar sensor" : "Añadir sensor"}</h3>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-sensor" className="text-sm font-medium text-c24-navy">
            Sensor
          </label>
          <IconSelect id="item-sensor" options={iconOptions} value={sensorId} onChange={setSensorId} />
        </div>

        {item ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-location" className="text-sm font-medium text-c24-navy">
              Ubicación
            </label>
            <Input
              id="item-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="ej. Daikin 1 - Impulsión"
              required
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={pendingMode ? "item-pending-quantity" : "item-locations"} className="text-sm font-medium text-c24-navy">
                {pendingMode ? "Cantidad" : "Ubicación (una por línea)"}
              </label>
              {/* Alternativa para cuando todavía no se sabe dónde va cada uno (ej. "necesito
                  20 de estos, los nombro en obra") — sin esto, había que inventar 20
                  nombres provisorios a mano en el textarea para poder crearlos ya. */}
              <button
                type="button"
                onClick={() => setPendingMode((v) => !v)}
                className="text-xs font-medium text-c24-teal-dark hover:underline"
              >
                {pendingMode ? "Ya sé la ubicación de cada uno" : "Todavía no sé dónde va cada uno"}
              </button>
            </div>

            {pendingMode ? (
              <>
                <Input
                  id="item-pending-quantity"
                  type="number"
                  min={1}
                  max={50}
                  value={pendingQuantity}
                  onChange={(e) => setPendingQuantity(e.target.value)}
                  className="w-24"
                />
                <p className="text-xs text-c24-text-muted">
                  Se van a crear {pendingQuantityNumber} sensores sin ubicación todavía — entra a cada uno desde la
                  lista para ponerle la suya cuando lo instales.
                </p>
              </>
            ) : (
              <>
                <textarea
                  id="item-locations"
                  value={locationsText}
                  onChange={(e) => setLocationsText(e.target.value)}
                  placeholder={"Daikin 1 - Impulsión\nDaikin 1 - Retorno\nDaikin 2 - Impulsión…"}
                  rows={4}
                  className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
                />
                {/* Cada línea nace como su propio sensor con ese nombre exacto — sin
                    numeración automática, así el listado y el PDF ya salen con nombres
                    útiles ("Daikin 1 - Impulsión") en vez de "Sala máquinas (1/11)". */}
                <p className="text-xs text-c24-text-muted">
                  {locationLines.length > 1
                    ? `Se van a crear ${locationLines.length} sensores, uno por línea. La foto de cada uno se agrega después, editándolo desde la lista.`
                    : "Escribe una línea por punto a instalar (ej. una por cada máquina/control)."}
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-notes" className="text-sm font-medium text-c24-navy">
            Observaciones (opcional)
          </label>
          <textarea
            id="item-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ej. necesita escalera, cliente pidió no taladrar acá…"
            rows={3}
            className="w-full rounded-md border border-c24-border bg-white px-3 py-2.5 text-sm text-c24-navy outline-none transition focus:border-c24-teal focus:ring-2 focus:ring-c24-teal/30"
          />
        </div>

        {accessoryOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-c24-navy">Accesorios (opcional)</label>

            {accessoryLines.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {accessoryLines.map((line) => (
                  <li
                    key={line.accessoryId}
                    className="flex items-center justify-between gap-2 rounded-md border border-c24-border bg-white px-3 py-1.5 text-sm text-c24-navy"
                  >
                    <span>
                      {line.quantity}× {accessoryNameById.get(line.accessoryId) ?? "Accesorio"}
                    </span>
                    <button
                      type="button"
                      aria-label="Quitar accesorio"
                      onClick={() => removeAccessoryLine(line.accessoryId)}
                      className="text-c24-text-muted hover:text-c24-danger"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <IconSelect
                  id="item-accessory"
                  options={accessoryIconOptions}
                  value={newAccessoryId}
                  onChange={setNewAccessoryId}
                />
              </div>
              <div className="w-20 shrink-0">
                <Input
                  id="item-accessory-qty"
                  type="number"
                  min={1}
                  value={newAccessoryQty}
                  onChange={(e) => setNewAccessoryQty(e.target.value)}
                  onKeyDown={(e) => {
                    // Sin esto, "elegir accesorio + cantidad + Enter" no hace nada y
                    // parece que el accesorio quedó cargado cuando en realidad nunca se
                    // agregó a la lista — hay que apretar el "+" sí o sí.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAccessoryLine();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                fullWidth={false}
                aria-label="Añadir accesorio"
                disabled={!newAccessoryId}
                onClick={addAccessoryLine}
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
            <p className="text-xs text-c24-text-muted">Pulsa + para añadir el accesorio a la lista.</p>
          </div>
        )}

        {showPhotoSection && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-photo" className="text-sm font-medium text-c24-navy">
            {item ? "Foto de dónde va (opcional, reemplaza la actual)" : "Foto de dónde va (opcional)"}
          </label>
          {item?.photoPath && !file && (
            <div className="flex items-end gap-3">
              {/* aspect-[4/3], no un cuadrado: la foto ya viene recortada a 4:3 desde el
                  editor — un cuadrado la recortaría una segunda vez sin saber qué parte
                  centró el usuario a propósito. */}
              <div className="aspect-[4/3] w-28 overflow-hidden rounded-md bg-c24-teal-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/montajes/uploads/${item.id}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleEditExistingPhoto}
                disabled={isLoadingExistingPhoto}
                className="text-sm font-medium text-c24-teal-dark hover:underline disabled:opacity-60"
              >
                {isLoadingExistingPhoto ? "Cargando…" : "Editar esta foto"}
              </button>
            </div>
          )}
          <input
            id="item-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              setAnnotatedBlob(null);
              // Al elegir una foto se pasa directo al recorte/marcado — evita el paso
              // extra de tener que acordarse de abrirlo aparte.
              if (selected) setShowAnnotator(true);
            }}
            className="text-sm text-c24-navy file:mr-3 file:rounded-md file:border-0 file:bg-c24-teal-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-c24-navy hover:file:bg-c24-teal-light/70"
          />
          {file && (
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAnnotator(true)}
                className="text-sm font-medium text-c24-teal-dark hover:underline"
              >
                {annotatedBlob ? "Editar de nuevo" : "Recortar y marcar la foto"}
              </button>
              {annotatedBlob && <span className="text-xs font-medium text-c24-teal-dark">✓ Marcada</span>}
            </div>
          )}
        </div>
        )}

        {error && <p className="rounded-md bg-c24-danger-light px-3 py-2 text-sm text-c24-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" fullWidth={false} onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" fullWidth={false} disabled={isPending} onClick={handleSubmit}>
            {isPending
              ? "Guardando…"
              : item
                ? "Guardar"
                : locationLines.length > 1
                  ? `Añadir ${locationLines.length}`
                  : "Añadir"}
          </Button>
        </div>
      </div>

      {showAnnotator && file && (
        <PhotoAnnotationModal
          file={file}
          onClose={() => setShowAnnotator(false)}
          onSaved={(blob) => {
            setAnnotatedBlob(blob);
            setShowAnnotator(false);
          }}
        />
      )}
    </Modal>
  );
}
