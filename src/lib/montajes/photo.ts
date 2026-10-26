const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Redimensiona al lado más largo a MAX_DIMENSION y comprime a JPEG — es documentación de
// dónde va un sensor, no un avatar, necesita más detalle que una miniatura de 256px. Si
// el navegador no puede decodificar el archivo (ej. un .heic real fuera de Safari), se
// sube el original sin tocar — el servidor igual valida el MIME y rechaza con un error
// claro si no encaja, no hace falta prometer transcodificación acá.
export async function compressPhoto(file: File): Promise<Blob> {
  try {
    const src = URL.createObjectURL(file);
    const image = await loadImage(src);
    URL.revokeObjectURL(src);

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    return blob ?? file;
  } catch {
    return file;
  }
}
