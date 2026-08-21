"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { updateAvatarAction } from "@/app/(protected)/ajustes/actions";

const OUTPUT_SIZE = 256;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToDataUrl(imageSrc: string, area: Area): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo obtener el contexto de canvas");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarCropModal({
  imageSrc,
  onClose,
  onSaved,
}: {
  imageSrc: string;
  onClose: () => void;
  onSaved: (dataUrl: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const areaRef = useRef<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    areaRef.current = areaPixels;
  }, []);

  function handleSave() {
    if (!areaRef.current) return;
    setError(null);
    startTransition(async () => {
      const dataUrl = await cropToDataUrl(imageSrc, areaRef.current!);
      const formData = new FormData();
      formData.set("avatar", dataUrl);
      const result = await updateAvatarAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSaved(dataUrl);
    });
  }

  return (
    <Modal onClose={onClose}>
      <div className="relative h-72 w-full overflow-hidden rounded-md bg-c24-teal-light">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
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

      {error && <p className="mt-2 text-sm text-c24-danger">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="primary" fullWidth={false} disabled={isPending} onClick={handleSave}>
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </Modal>
  );
}
