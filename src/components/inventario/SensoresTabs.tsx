"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SensorsTable } from "@/components/inventario/SensorsTable";
import { AccessoriesTable, type AccessoryRow } from "@/components/inventario/AccessoriesTable";
import { clsx } from "@/lib/clsx";
import type { SensorFormValues } from "@/components/inventario/SensorForm";

type SensorRow = SensorFormValues & {
  brandName: string | null;
  technologyName: string | null;
  providerName: string | null;
};

export function SensoresTabs({
  sensors,
  accessories,
  initialTab,
}: {
  sensors: SensorRow[];
  accessories: AccessoryRow[];
  initialTab: "sensores" | "accesorios";
}) {
  const [tab, setTab] = useState<"sensores" | "accesorios">(initialTab);
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex w-fit rounded-md border border-c24-border p-1">
          <button
            type="button"
            onClick={() => setTab("sensores")}
            className={clsx(
              "rounded-md px-4 py-1.5 text-sm font-medium transition",
              tab === "sensores" ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
            )}
          >
            Sensores ({sensors.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("accesorios")}
            className={clsx(
              "rounded-md px-4 py-1.5 text-sm font-medium transition",
              tab === "accesorios" ? "bg-c24-navy text-white" : "text-c24-text-muted hover:text-c24-navy",
            )}
          >
            Accesorios ({accessories.length})
          </button>
        </div>

        <div className="flex gap-2">
          <Link
            href="/inventario/sensores/accesorios/nuevo"
            className="flex items-center rounded-md border border-c24-border px-4 py-2.5 text-sm font-medium text-c24-navy transition hover:bg-c24-teal-light"
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.75} /> Nuevo accesorio
          </Link>
          <Link
            href="/inventario/sensores/nuevo"
            className="flex items-center rounded-md bg-c24-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-c24-teal-dark"
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.75} /> Nuevo sensor
          </Link>
        </div>
      </div>

      <div className="mt-4">
        {tab === "sensores" ? <SensorsTable sensors={sensors} /> : <AccessoriesTable accessories={accessories} />}
      </div>
    </div>
  );
}
