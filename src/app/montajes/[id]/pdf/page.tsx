import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getMontajeById, listMontajeItems } from "@/lib/montajes/queries";
import { getSensorTypeIcon } from "@/lib/inventario/sensor-types";
import { groupItemsBySensor } from "@/lib/montajes/group-items";
import { PrintButton } from "@/components/montajes/PrintButton";

// Ruta fuera de (protected) a propósito, igual que /i/[token]: así no hereda el
// sidebar/topbar de ProtectedLayout (no tienen sentido en una hoja para imprimir), pero
// sigue exigiendo sesión (auth() la sigue protegiendo vía proxy.ts, y además se chequea
// acá abajo) — a diferencia de /i/[token], esta ficha SÍ es solo para el equipo, no para
// mandar por WhatsApp sin cuenta.
export default async function MontajePdfPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const montaje = await getMontajeById(id);
  if (!montaje) redirect("/montajes");

  const items = await listMontajeItems(id);
  const groups = groupItemsBySensor(items);

  return (
    <div className="min-h-full bg-c24-teal-light/30 print:bg-white">
      {/* @page fija el tamaño/margen real de la hoja — sin esto, el margen por defecto
          del navegador varía, y max-w-3xl (768px) puede terminar más ancho que el área
          imprimible real de A4 y cortarse en el borde derecho. */}
      <style>{"@page { size: A4; margin: 15mm; }"}</style>
      {/* print:max-w-full en vez de un ancho fijo: así ocupa exactamente el área
          imprimible que define @page arriba, sea cual sea, sin arriesgarse a que un
          max-w-3xl en rem termine más ancho que esa área real y se corte. */}
      <div className="mx-auto max-w-3xl px-6 py-8 print:max-w-full print:px-0 print:py-0">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link
            href={`/montajes/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-c24-text-muted transition hover:text-c24-navy"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Volver al montaje
          </Link>
          <PrintButton />
        </div>

        {/* La hoja en sí — el resto de arriba (volver, botón imprimir) es solo de
            pantalla, print:hidden se encarga de que no salga en el PDF/impreso. */}
        {/* p-8 se mantiene en impresión a propósito (no print:p-0): @page ya reserva el
            margen de la HOJA física, pero sin este padding el contenido queda pegado al
            límite exacto del área imprimible, sin ningún aire de seguridad. */}
        <div className="rounded-lg bg-white p-8 shadow-sm print:rounded-none print:shadow-none">
          <header className="flex items-center justify-between border-b border-c24-border pb-4">
            <Image src="/LogoGO.png" alt="Go! — Connect24" width={90} height={78} priority />
            <div className="text-right">
              <p className="text-xs font-semibold tracking-wide text-c24-text-muted uppercase">Ficha de montaje</p>
              <p className="mt-0.5 text-xs text-c24-text-muted">
                {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </header>

          <section className="mt-6">
            <h1 className="text-xl font-semibold text-c24-navy">{montaje.clientName}</h1>
            <p className="mt-1 text-sm text-c24-text-muted">{montaje.address}</p>
            {montaje.notes && <p className="mt-2 text-sm text-c24-navy">{montaje.notes}</p>}
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold tracking-wide text-c24-text-muted uppercase">
              Sensores a instalar ({items.length})
            </h2>

            {items.length === 0 ? (
              <p className="mt-3 text-sm text-c24-text-muted">Este montaje todavía no tiene sensores cargados.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-6">
                {groups.map((group) => {
                  const GroupIcon = getSensorTypeIcon(group.sensorType);
                  const installedCount = group.items.filter((item) => item.installedAt).length;
                  return (
                    <div key={group.sensorId} className="break-inside-avoid">
                      {/* Encabezado de sección por tipo de sensor, con su propio contador
                          instalados/total — mismo formato que un checklist de referencia
                          de montajes anteriores (agrupado por modelo, no una lista plana
                          numerada). */}
                      <div className="flex items-center gap-1.5 border-b border-c24-border pb-1.5">
                        <GroupIcon className="h-4 w-4 shrink-0 text-c24-navy" strokeWidth={1.75} />
                        <h3 className="text-base font-semibold text-c24-navy">{group.sensorName}</h3>
                        <span className="ml-auto text-xs text-c24-text-muted">
                          {installedCount}/{group.items.length}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-col gap-4">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex gap-4 break-inside-avoid">
                            {/* Casillero vacío a propósito — el técnico lo tilda a mano en
                                papel a medida que instala, mismo criterio que el checklist
                                digital pero en su versión de papel. */}
                            <div className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-c24-navy" aria-hidden />

                            <div className="flex flex-1 gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-c24-navy">{item.location}</p>
                                {item.accessories.length > 0 && (
                                  <p className="mt-1 text-sm text-c24-navy">
                                    + {item.accessories.map((a) => `${a.quantity}× ${a.name}`).join(", ")}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="mt-2 rounded-md bg-c24-teal-light/50 px-2.5 py-1.5 text-sm text-c24-navy">
                                    {item.notes}
                                  </p>
                                )}
                              </div>

                              {item.photoPath && (
                                <div className="aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-md bg-c24-teal-light">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`/api/montajes/uploads/${item.id}`}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="mt-10 border-t border-c24-border pt-4 text-xs text-c24-text-muted">
            go.connect24.io — Ficha generada el {new Date().toLocaleDateString("es-ES")}
          </footer>
        </div>
      </div>
    </div>
  );
}
