"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AddStockModal } from "@/components/inventario/AddStockModal";
import type { ZoneGridCell } from "@/components/inventario/ZoneGrid";

type Zone = {
  id: string;
  name: string;
  location: string | null;
  rows: number;
  cols: number;
  rowLabels: string[] | null;
  stock: ZoneGridCell[];
};
type ItemOption = { id: string; name: string; type: string };

export function ZonasPageActions({
  zones,
  sensorOptions,
  accessoryOptions,
}: {
  zones: Zone[];
  sensorOptions: ItemOption[];
  accessoryOptions: ItemOption[];
}) {
  const [showAddStock, setShowAddStock] = useState(false);

  return (
    <div className="flex gap-2">
      <Link
        href="/inventario/zonas/gestionar"
        className="flex items-center rounded-md border border-c24-border px-4 py-2.5 text-sm font-medium text-c24-navy transition hover:bg-c24-teal-light"
      >
        <Settings2 className="mr-1.5 h-4 w-4" strokeWidth={1.75} /> Gestionar zonas
      </Link>
      <Button type="button" fullWidth={false} onClick={() => setShowAddStock(true)}>
        <Plus className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} /> Agregar stock
      </Button>

      {showAddStock && (
        <AddStockModal
          sensorOptions={sensorOptions}
          accessoryOptions={accessoryOptions}
          zones={zones}
          onSaved={() => setShowAddStock(false)}
          onClose={() => setShowAddStock(false)}
        />
      )}
    </div>
  );
}
