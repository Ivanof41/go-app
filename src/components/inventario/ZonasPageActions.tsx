"use client";

import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ManageZonesModal } from "@/components/inventario/ManageZonesModal";
import { AddStockModal } from "@/components/inventario/AddStockModal";
import type { ZoneGridCell } from "@/components/inventario/ZoneGrid";

type Zone = { id: string; name: string; location: string | null; rows: number; cols: number; stock: ZoneGridCell[] };
type SensorOption = { id: string; name: string; type: string };

export function ZonasPageActions({
  zones,
  sensorOptions,
}: {
  zones: Zone[];
  sensorOptions: SensorOption[];
}) {
  const [showManageZones, setShowManageZones] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);

  return (
    <div className="flex gap-2">
      <Button type="button" variant="ghost" fullWidth={false} onClick={() => setShowManageZones(true)}>
        <Settings2 className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} /> Gestionar zonas
      </Button>
      <Button type="button" fullWidth={false} onClick={() => setShowAddStock(true)}>
        <Plus className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} /> Agregar stock
      </Button>

      {showManageZones && <ManageZonesModal zones={zones} onClose={() => setShowManageZones(false)} />}
      {showAddStock && (
        <AddStockModal
          sensorOptions={sensorOptions}
          zones={zones}
          onSaved={() => setShowAddStock(false)}
          onClose={() => setShowAddStock(false)}
        />
      )}
    </div>
  );
}
