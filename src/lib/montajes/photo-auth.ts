import { auth } from "@/auth";
import { isItemAccessibleByToken } from "@/lib/montajes/queries";

// Las fotos de un ítem (referencia y de instalación) se sirven con sesión (Gestión/
// Instalación autenticadas) o con el token del enlace público del técnico — nunca con
// las dos sueltas: si no hay sesión, el token tiene que ser justo el del montaje dueño
// de ESE ítem, no de cualquier otro.
export async function canAccessMontajeItemPhoto(request: Request, itemId: string): Promise<boolean> {
  const session = await auth();
  if (session?.user?.id) return true;

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return false;
  return isItemAccessibleByToken(itemId, token);
}
