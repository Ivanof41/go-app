import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { InstallProgress } from "@/components/montajes/InstallProgress";
import { PublicInstallChecklist } from "@/components/montajes/PublicInstallChecklist";
import { getMontajeByInstallToken, listMontajeItems } from "@/lib/montajes/queries";

// Ruta pública a propósito, fuera de (protected): sin auth(), sin sidebar/topbar — el
// técnico entra desde un enlace de WhatsApp sin cuenta ni contexto del resto de la app.
// El token identifica el montaje (ver montajes.installToken); nunca se acepta el id del
// montaje directo en la URL para no poder adivinar/enumerar montajes ajenos.
export default async function PublicInstalacionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const montaje = await getMontajeByInstallToken(token);

  if (!montaje) {
    return (
      <div className="flex min-h-full flex-col">
        <PublicHeader />
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <Card dashed className="max-w-sm text-center">
            <p className="text-sm text-white/60">Este enlace no es válido o ya no está activo.</p>
          </Card>
        </div>
      </div>
    );
  }

  const items = await listMontajeItems(montaje.id);
  const installedCount = items.filter((item) => item.installedAt).length;

  return (
    <div className="min-h-full">
      <PublicHeader />

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Card>
          <h1 className="text-lg font-semibold text-white">{montaje.clientName}</h1>
          <p className="mt-1 text-sm text-white/70">{montaje.address}</p>
        </Card>

        {!montaje.startedAt ? (
          <Card dashed className="flex flex-col items-center gap-1 py-12 text-center">
            <p className="text-sm text-white/60">Este montaje todavía no se inició. Avisá a la oficina.</p>
          </Card>
        ) : (
          <>
            {items.length > 0 && <InstallProgress installed={installedCount} total={items.length} />}

            {items.length === 0 ? (
              <Card dashed className="flex flex-col items-center gap-1 py-12 text-center">
                <p className="text-sm text-white/60">Todavía no hay sensores cargados para este montaje.</p>
              </Card>
            ) : (
              <PublicInstallChecklist token={token} items={items} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Cabecera de marca, blanca a propósito: el logo completo (LogoGO.png) tiene el texto en
// c24-navy, ilegible sobre un fondo oscuro — mismo motivo por el que BrandPanel.tsx
// (login) lo pone sobre blanco y no sobre el panel navy. Es lo primero que ve el técnico,
// así que tiene que quedar claro que el enlace es de Connect24, no una página cualquiera.
function PublicHeader() {
  return (
    <header className="border-b border-c24-border bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-2xl items-center">
        <Image src="/LogoGO.png" alt="Go! — Connect24" width={96} height={83} priority />
      </div>
    </header>
  );
}
