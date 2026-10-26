import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Default de Server Actions es 1MB — insuficiente para fotos de Montajes (tope propio
  // de la app: 10MB) y manuales PDF de Sensor (tope propio: 20MB). 25MB deja margen para
  // que el mensaje de error en español de la app salte antes que el límite de Next.
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
};

export default nextConfig;
