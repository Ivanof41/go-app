export type StockTotalRow = {
  kind: "sensor" | "accessory";
  itemId: string;
  itemName: string;
  itemType: string;
  quantity: number;
  zoneCount: number;
  purchasePrice: number | null;
  salePrice: number | null;
};

// Agrupa el stock de getZonesWithStock() por sensor/accesorio, sumando cantidades entre
// TODAS las zonas — la grilla de cada ZoneCard ya muestra el detalle celda por celda,
// pero no hay forma hoy de ver de un vistazo "cuánto tengo en total de este sensor" sin
// sumar a mano zona por zona.
export function buildStockTotals(
  allStock: {
    kind: "sensor" | "accessory";
    itemId: string;
    itemName: string;
    itemType: string;
    zoneId: string;
    quantity: number;
    purchasePrice: number | null;
    salePrice: number | null;
  }[],
): StockTotalRow[] {
  const totals = new Map<string, Omit<StockTotalRow, "zoneCount"> & { zoneIds: Set<string> }>();
  for (const row of allStock) {
    const key = `${row.kind}-${row.itemId}`;
    const existing = totals.get(key);
    if (existing) {
      existing.quantity += row.quantity;
      existing.zoneIds.add(row.zoneId);
    } else {
      totals.set(key, {
        kind: row.kind,
        itemId: row.itemId,
        itemName: row.itemName,
        itemType: row.itemType,
        quantity: row.quantity,
        zoneIds: new Set([row.zoneId]),
        purchasePrice: row.purchasePrice,
        salePrice: row.salePrice,
      });
    }
  }
  return [...totals.values()].map(({ zoneIds, ...rest }) => ({ ...rest, zoneCount: zoneIds.size }));
}
