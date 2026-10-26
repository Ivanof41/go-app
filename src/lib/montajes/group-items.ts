export type GroupableItem = {
  sensorId: string;
  sensorName: string;
  sensorType: string;
};

export type ItemGroup<T extends GroupableItem> = {
  sensorId: string;
  sensorName: string;
  sensorType: string;
  items: T[];
};

// Agrupa por sensor preservando el orden de PRIMERA aparición (los ítems ya vienen
// ordenados por createdAt asc desde listMontajeItems) — así el orden de las secciones
// coincide con el orden en que se fueron cargando los sensores, sin ordenar alfabético
// ni nada que reordene lo que el usuario ya vio antes.
export function groupItemsBySensor<T extends GroupableItem>(items: T[]): ItemGroup<T>[] {
  const order: string[] = [];
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (!groups.has(item.sensorId)) {
      groups.set(item.sensorId, []);
      order.push(item.sensorId);
    }
    groups.get(item.sensorId)!.push(item);
  }
  return order.map((sensorId) => {
    const groupItems = groups.get(sensorId)!;
    return {
      sensorId,
      sensorName: groupItems[0].sensorName,
      sensorType: groupItems[0].sensorType,
      items: groupItems,
    };
  });
}
