"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Cropper, { type Area } from "react-easy-crop";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

// ssr:false tiene que estar en el import dinámico, no en un useEffect adentro del
// componente: fabric.js toca `window`/`document` al evaluar el módulo, no solo al
// renderizar — mismo motivo que LeafletMap.
const AnnotationCanvas = dynamic(() => import("./AnnotationCanvas"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-md bg-c24-teal-light/60" />,
});

const MAX_DIMENSION = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Recorte primero (react-easy-crop, ya probado en AvatarCropModal), anotado después
// (fabric.js) — fabric no tiene una herramienta de recorte propia, y no vale la pena
// pedirle a una librería que haga algo que la otra ya resuelve bien.
async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(area.width, area.height));
  const width = Math.round(area.width * scale);
  const height = Math.round(area.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo obtener el contexto de canvas");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen"))),
      "image/jpeg",
      0.9,
    );
  });
}

export function PhotoAnnotationModal({
  file,
  onSaved,
  onClose,
}: {
  file: File;
  onSaved: (blob: Blob) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"crop" | "annotate">("crop");
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const areaRef = useRef<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [exportFn, setExportFn] = useState<(() => Promise<Blob | null>) | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    areaRef.current = areaPixels;
  }, []);

  // setExportFn recibe una función de AnnotationCanvas — hay que envolverla en otra
  // arrow function al pasarla a setState, o React la interpreta como un updater
  // (prevState) => nextState en vez de guardarla como el valor de estado en sí.
  const handleAnnotationReady = useCallback((fn: () => Promise<Blob | null>) => {
    setExportFn(() => fn);
  }, []);

  async function handleCropNext() {
    if (!areaRef.current) return;
    setError(null);
    setIsPending(true);
    try {
      const blob = await cropToBlob(imageSrc, areaRef.current);
      setCroppedUrl(URL.createObjectURL(blob));
      setStep("annotate");
    } catch {
      setError("No se pudo procesar la imagen");
    } finally {
      setIsPending(false);
    }
  }

  async function handleSaveAnnotated() {
    if (!exportFn) return;
    setError(null);
    setIsPending(true);
    try {
      const blob = await exportFn();
      if (!blob) {
        setError("No se pudo generar la imagen");
        return;
      }
      onSaved(blob);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Modal onClose={onClose} size="2xl">
      <h3 className="text-base font-semibold text-c24-navy">{step === "crop" ? "Recortar foto" : "Marcar foto"}</h3>

      {step === "crop" ? (
        <>
          <div className="relative mt-4 h-80 w-full overflow-hidden rounded-md bg-c24-teal-light">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-4 w-full accent-c24-teal"
            aria-label="Zoom"
          />
        </>
      ) : (
        croppedUrl && (
          <div className="mt-4">
            <AnnotationCanvas imageUrl={croppedUrl} onReady={handleAnnotationReady} />
          </div>
        )
      )}

      {error && <p className="mt-3 text-sm text-c24-danger">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" fullWidth={false} onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        {step === "crop" ? (
          <Button type="button" fullWidth={false} disabled={isPending} onClick={handleCropNext}>
            {isPending ? "Procesando…" : "Siguiente"}
          </Button>
        ) : (
          <Button type="button" fullWidth={false} disabled={isPending || !exportFn} onClick={handleSaveAnnotated}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
