import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sensorStock, zones } from "@/db/schema";

// Tipo exacto que espera el callback de db.transaction — evita pelear con los genéricos
// de PgTransaction escribiendo el tipo a mano.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type StockItemKind = "sensor" | "accessory";

function stockColumn(kind: StockItemKind) {
  return kind === "sensor" ? sensorStock.sensorId : sensorStock.accessoryId;
}

export type ZoneDeduction = { zoneId: string; quantity: number };

// Resta hasta quantityNeeded del stock de refId SIN importar de qué zona sale — al
// usuario no le interesa desde qué estantería se preparó el kit, solo que el modelo de
// sensor/accesorio se descuente. Recorre TODAS las celdas de ese ítem en cualquier zona
// (orden fijo por posición de zona, luego row/col) sacando de cada una lo que se pueda
// hasta agotar el pedido o las celdas. Nunca bloquea, nunca deja una celda en negativo —
// si no alcanza, descuenta lo que hay y listo (el usuario confirmó que prefiere esto:
// siempre prepara el kit sabiendo que tiene stock, así que esto es un piso de seguridad,
// no el camino esperado). Devuelve cuánto se sacó de CADA zona realmente tocada — hace
// falta para poder registrar (y más adelante deshacer) el movimiento en la zona correcta,
// aunque el llamador nunca haya elegido ninguna. SELECT...FOR UPDATE bloquea las filas
// mientras se calcula, para que dos altas/ediciones simultáneas del mismo sensor no lean
// la misma cantidad "vieja" y se pisen al escribir.
export async function deductStock(
  tx: Tx,
  kind: StockItemKind,
  refId: string,
  quantityNeeded: number,
): Promise<ZoneDeduction[]> {
  if (quantityNeeded <= 0) return [];

  const cells = await tx
    .select({
      id: sensorStock.id,
      zoneId: sensorStock.zoneId,
      quantity: sensorStock.quantity,
      zonePosition: zones.position,
    })
    .from(sensorStock)
    .innerJoin(zones, eq(zones.id, sensorStock.zoneId))
    .where(eq(stockColumn(kind), refId))
    .orderBy(asc(zones.position), asc(sensorStock.row), asc(sensorStock.col))
    .for("update");

  let remaining = quantityNeeded;
  const deductedByZone = new Map<string, number>();
  for (const cell of cells) {
    if (remaining <= 0) break;
    const take = Math.min(cell.quantity, remaining);
    if (take <= 0) continue;
    await tx
      .update(sensorStock)
      .set({ quantity: cell.quantity - take, updatedAt: new Date() })
      .where(eq(sensorStock.id, cell.id));
    remaining -= take;
    deductedByZone.set(cell.zoneId, (deductedByZone.get(cell.zoneId) ?? 0) + take);
  }
  return [...deductedByZone.entries()].map(([zoneId, quantity]) => ({ zoneId, quantity }));
}

// Busca una celda existente de (zoneId, refId) y le suma la cantidad. Si no queda
// ninguna (caso raro — se borró esa celda entre medio, ej. con "Quitar de esta
// posición"), busca una posición libre dentro de la grilla de la zona y crea una fila
// nueva ahí en vez de perder el stock en silencio; solo si la zona está completamente
// llena devuelve una advertencia no bloqueante para que el usuario lo ajuste a mano.
export async function restoreStock(
  tx: Tx,
  zoneId: string,
  kind: StockItemKind,
  refId: string,
  quantity: number,
): Promise<{ warning?: string }> {
  if (quantity <= 0) return {};

  const [existing] = await tx
    .select({ id: sensorStock.id, quantity: sensorStock.quantity })
    .from(sensorStock)
    .where(and(eq(sensorStock.zoneId, zoneId), eq(stockColumn(kind), refId)))
    .orderBy(asc(sensorStock.row), asc(sensorStock.col))
    .limit(1)
    .for("update");

  if (existing) {
    await tx
      .update(sensorStock)
      .set({ quantity: existing.quantity + quantity, updatedAt: new Date() })
      .where(eq(sensorStock.id, existing.id));
    return {};
  }

  const [zone] = await tx.select({ rows: zones.rows, cols: zones.cols }).from(zones).where(eq(zones.id, zoneId));
  if (!zone) return { warning: "No se pudo restaurar el stock: la zona ya no existe." };

  const occupied = await tx
    .select({ row: sensorStock.row, col: sensorStock.col })
    .from(sensorStock)
    .where(eq(sensorStock.zoneId, zoneId));
  const occupiedCells = new Set(occupied.map((c) => `${c.row}-${c.col}`));

  for (let row = 0; row < zone.rows; row++) {
    for (let col = 0; col < zone.cols; col++) {
      if (occupiedCells.has(`${row}-${col}`)) continue;
      await tx.insert(sensorStock).values(
        kind === "sensor"
          ? { zoneId, sensorId: refId, accessoryId: null, quantity, row, col }
          : { zoneId, sensorId: null, accessoryId: refId, quantity, row, col },
      );
      return {};
    }
  }

  return {
    warning: "No se pudo restaurar el stock automáticamente: la zona no tiene celdas libres. Ajústalo a mano en Stock.",
  };
}
