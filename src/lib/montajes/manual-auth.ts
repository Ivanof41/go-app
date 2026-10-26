import { auth } from "@/auth";
import { isSensorAccessibleByToken } from "@/lib/montajes/queries";

// El manual de un sensor se sirve con sesión (equipo) o con el token del enlace público
// del técnico — igual que las fotos de un ítem, pero acá el token tiene que corresponder
// a un montaje que realmente incluya ESE sensor entre sus ítems.
export async function canAccessSensorManual(request: Request, sensorId: string): Promise<boolean> {
  const session = await auth();
  if (session?.user?.id) return true;

  const token = new URL(request.url).searchParams.get("token");
  if (!token) return false;
  return isSensorAccessibleByToken(sensorId, token);
}
