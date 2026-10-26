import { headers } from "next/headers";

// Para armar el enlace público completo (/i/[token]) sin depender de window.location en
// el cliente — así funciona igual sin importar bajo qué dominio esté corriendo. Usado
// tanto por la lista de Montajes como por la ficha de un montaje, cualquier lugar que
// necesite mostrar/copiar el enlace del técnico.
export async function getInstallLinkBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : "";
}
