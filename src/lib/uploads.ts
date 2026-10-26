import path from "path";

// Ruta dentro del contenedor donde vive el volumen `go_app_uploads` en prod (ver
// docker-compose.prod.yml) — en dev son carpetas locales bajo `./uploads`. Un solo
// archivo de constantes para todos los tipos de archivo subido (fotos de Montajes,
// manuales de Sensor) en vez de uno por feature — son la misma infraestructura
// (mismo volumen, mismo patrón "servir por id, nunca por path libre") y dejarlos
// separados solo invita a que diverjan con el tiempo por descuido.
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export const MONTAJES_UPLOADS_DIR = path.join(UPLOADS_ROOT, "montajes");
export const SENSOR_MANUALS_DIR = path.join(UPLOADS_ROOT, "sensor-manuals");

export const MAX_PHOTO_BYTES = 10_000_000;
export const MAX_MANUAL_BYTES = 20_000_000;

export const PHOTO_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const PHOTO_CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const MANUAL_EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
};

export const MANUAL_CONTENT_TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
};
