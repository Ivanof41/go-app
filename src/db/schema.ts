import { sql } from "drizzle-orm";
import {
  check,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "user"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  role: userRole("role").notNull().default("user"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Catálogo de referencia — se crean al vuelo desde el formulario de sensor (no tienen
// pantalla propia de gestión), por eso alcanza con id + name + timestamps.
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const technologies = pgTable("technologies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sensors = pgTable("sensors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  // varchar en vez de pgEnum a propósito: la lista de íconos/tipos (ver sensor-types.ts)
  // crece seguido a pedido del usuario, y un enum de Postgres exige una migración por
  // cada valor nuevo. La validación del valor vive solo en Zod (sensorSchema).
  type: varchar("type", { length: 60 }).notNull().default("otro"),
  // Marca/tecnología/proveedor/precios son opcionales a propósito: nombre + tipo
  // alcanzan para crear un sensor, el resto se puede completar después.
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "restrict" }),
  technologyId: uuid("technology_id").references(() => technologies.id, { onDelete: "restrict" }),
  providerId: uuid("provider_id").references(() => providers.id, { onDelete: "restrict" }),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2, mode: "number" }),
  salePrice: numeric("sale_price", { precision: 10, scale: 2, mode: "number" }),
  notes: text("notes"),
  // Manual de instalación en PDF, opcional. Ruta relativa dentro del volumen de
  // uploads (igual patrón que montaje_items.photoPath) — el archivo vive en disco, no
  // en la base. Solo Sensor por ahora (no Accesorio) porque es lo único que pidió el
  // usuario — no es un olvido, es alcance deliberado.
  manualPath: varchar("manual_path", { length: 300 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const zones = pgTable("zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  location: varchar("location", { length: 255 }),
  position: integer("position").notNull().default(0),
  // Forma de la rejilla visual (baldas × posiciones por balda) que se muestra en
  // /inventario/zonas. Uniforme a propósito: todas las baldas de una zona tienen el
  // mismo número de posiciones — ver docs/features/inventario.md.
  rows: integer("rows").notNull().default(3),
  cols: integer("cols").notNull().default(4),
  // Nombres opcionales por balda (índice = número de fila, 0-indexado). Un elemento
  // ausente o vacío ("") significa "sin nombre propio" — se muestra "Balda N" en su lugar.
  rowLabels: varchar("row_labels", { length: 100 }).array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Catálogo de accesorios (Toroidales, etc.) — entidad propia con su misma ficha que
// Sensor (ícono, marca, precio compra/venta) desde que ganó su propia página de
// gestión. `type` reutiliza la misma lista de íconos de SENSOR_TYPES (sensor-types.ts)
// que un sensor, no una lista separada — esa lista ya incluye íconos pensados para
// accesorios (batería, cargador, cable, etc.), y usarla para ambas entidades evita
// mantener dos catálogos de íconos en paralelo.
export const accessories = pgTable("accessories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  type: varchar("type", { length: 60 }).notNull().default("otro"),
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "restrict" }),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2, mode: "number" }),
  salePrice: numeric("sale_price", { precision: 10, scale: 2, mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sensorAccessories = pgTable(
  "sensor_accessories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // cascade (única vez en este schema — todo lo demás es restrict): el enlace a un
    // accesorio es un dato propio del sensor (una línea de su "pack"), no un hecho físico
    // independiente como el stock — borrar el sensor borra su composición sin fricción.
    sensorId: uuid("sensor_id")
      .notNull()
      .references(() => sensors.id, { onDelete: "cascade" }),
    accessoryId: uuid("accessory_id")
      .notNull()
      .references(() => accessories.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sensor_accessories_sensor_accessory_unique").on(table.sensorId, table.accessoryId),
    check("sensor_accessories_quantity_positive", sql`${table.quantity} >= 1`),
  ],
);

// Sigue llamándose "sensor_stock"/sensorStock aunque desde acá ahora también guarda
// stock de accesorios sueltos (no enlazados a un sensor) — renombrar la tabla hubiera
// significado tocar decenas de call sites (queries, actions, todos los componentes de
// Zonas) por una ganancia puramente cosmética. Una celda contiene un sensor O un
// accesorio, nunca los dos ni ninguno — de ahí sensorId/accessoryId ambos nullable más
// el CHECK de abajo, en vez de agregar una tabla accessory_stock separada (que hubiera
// necesitado coordinar el único índice (zoneId, row, col) a mano entre dos tablas).
// Trabajo de campo: instalación en casa de un cliente. Fase 1 solo cubre crear el
// montaje y sus ítems — estado/checklist/token de técnico llegan en su propia migración
// cuando toque esa fase, mismo criterio que accessories/sensor_accessories llegaron
// después de que sensors ya existía.
export const montajes = pgTable("montajes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  // Capturados junto con la dirección desde el picker de mapa (Leaflet + Nominatim) para
  // que un futuro mapa del Dashboard pueda pintar un pin por montaje sin volver a
  // geocodificar. Nullable: el pin es "mejor si está", no bloquea crear el montaje.
  latitude: numeric("latitude", { precision: 9, scale: 6, mode: "number" }),
  longitude: numeric("longitude", { precision: 9, scale: 6, mode: "number" }),
  notes: text("notes"),
  // null = Preparado (el kit todavía no salió de la oficina). Se setea una sola vez, al
  // pulsar "Marcar como iniciado" — no se deriva de los ítems instalados como el estado
  // Completado, porque el descuento de inventario pasa en este momento puntual, no
  // sensor por sensor en campo (ver stock-movements.ts).
  startedAt: timestamp("started_at", { withTimezone: true }),
  // Token del enlace público de instalación (/i/[token]) — nulo hasta que se genera desde
  // Gestión (ver generateInstallLinkAction). No es la PK ni se reusa como id de nada más:
  // es intencionalmente regenerable (invalidando el enlace viejo) sin tocar el montaje.
  installToken: varchar("install_token", { length: 64 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Un ítem = un sensor físico colocado en un punto concreto del montaje ("para cada
// sensor"), no un cubo de cantidad — a diferencia de sensor_accessories no lleva quantity.
export const montajeItems = pgTable("montaje_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  // cascade: el ítem es composición propia del montaje (mismo criterio que
  // sensor_accessories.sensorId) — borrar el montaje borra sus ítems sin fricción.
  montajeId: uuid("montaje_id")
    .notNull()
    .references(() => montajes.id, { onDelete: "cascade" }),
  // restrict: el sensor sigue siendo catálogo compartido (mismo criterio que
  // sensor_stock/sensor_accessories) — no se puede borrar un sensor referenciado.
  sensorId: uuid("sensor_id")
    .notNull()
    .references(() => sensors.id, { onDelete: "restrict" }),
  location: varchar("location", { length: 200 }).notNull(),
  // Nullable a nivel de columna (igual criterio que brandId en sensors), aunque el
  // formulario de Fase 1 la exige siempre. Solo la ruta relativa dentro del volumen de
  // uploads — el archivo en sí vive en disco, no en la base (ver docs/features).
  photoPath: varchar("photo_path", { length: 300 }),
  // Observaciones libres por sensor (ej. "necesita escalera", "cliente pidió no taladrar
  // acá") — opcional, distinto de las notas del montaje en general.
  notes: text("notes"),
  // Fase 2 (checklist de instalación): un timestamp en vez de un booleano — "instalado"
  // ya lleva implícito el "cuándo" sin agregar otra columna, y sirve directo para
  // ordenar/mostrar. El estado del montaje (Pendiente/En progreso/Completado) se deriva
  // de estos valores en las queries, no se guarda aparte — evita que se desincronice.
  installedAt: timestamp("installed_at", { withTimezone: true }),
  // Foto de la instalación ya terminada — distinta de photoPath (la referencia de dónde
  // va, tomada al crear el ítem). Opcional a pedido del usuario: marcar como instalado
  // no debe frenarse por no tener la foto a mano en el momento.
  installedPhotoPath: varchar("installed_photo_path", { length: 300 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Accesorios propios de ESTE sensor instalado en ESTE montaje — no del catálogo del
// sensor (esa relación, sensor_accessories, se probó y se sacó a propósito de la
// creación de sensores para no mezclar "cada cosa por su lado"). Acá es distinto: son
// los accesorios que de verdad van con este sensor en este trabajo concreto, y alimentan
// tanto el total del montaje como el descuento de inventario al iniciar.
export const montajeItemAccessories = pgTable(
  "montaje_item_accessories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    montajeItemId: uuid("montaje_item_id")
      .notNull()
      .references(() => montajeItems.id, { onDelete: "cascade" }),
    accessoryId: uuid("accessory_id")
      .notNull()
      .references(() => accessories.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("montaje_item_accessories_item_accessory_unique").on(table.montajeItemId, table.accessoryId),
    check("montaje_item_accessories_quantity_positive", sql`${table.quantity} >= 1`),
  ],
);

// Registra exactamente cuánto se descontó de qué zona, para poder deshacerlo con
// precisión. montajeItemId (no solo montajeId) es a propósito: sin esto, borrar UN ítem
// no podría saber cuáles movimientos son suyos y cuáles de sus hermanos, aunque
// compartan el mismo sensor — se restauraría de más o de menos.
export const montajeStockMovements = pgTable(
  "montaje_stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    montajeId: uuid("montaje_id")
      .notNull()
      .references(() => montajes.id, { onDelete: "cascade" }),
    montajeItemId: uuid("montaje_item_id")
      .notNull()
      .references(() => montajeItems.id, { onDelete: "cascade" }),
    zoneId: uuid("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "restrict" }),
    sensorId: uuid("sensor_id").references(() => sensors.id, { onDelete: "restrict" }),
    accessoryId: uuid("accessory_id").references(() => accessories.id, { onDelete: "restrict" }),
    // Cantidad REALMENTE descontada — puede ser menor a la pedida si no había stock
    // suficiente (nunca se bloquea, nunca baja de cero, ver stock-movements.ts).
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "montaje_stock_movements_exactly_one_item",
      sql`(${table.sensorId} is not null) <> (${table.accessoryId} is not null)`,
    ),
    check("montaje_stock_movements_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const sensorStock = pgTable(
  "sensor_stock",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sensorId: uuid("sensor_id").references(() => sensors.id, { onDelete: "restrict" }),
    accessoryId: uuid("accessory_id").references(() => accessories.id, { onDelete: "restrict" }),
    zoneId: uuid("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(0),
    // Celda dentro de la rejilla de la zona (0-indexado). El único índice está en
    // (zoneId, row, col), no en (sensorId, zoneId): una celda solo admite un ítem,
    // pero el mismo sensor/accesorio sí puede repetirse en varias celdas de la misma zona.
    row: integer("row").notNull(),
    col: integer("col").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sensor_stock_zone_cell_unique").on(table.zoneId, table.row, table.col),
    check("sensor_stock_quantity_non_negative", sql`${table.quantity} >= 0`),
    check(
      "sensor_stock_exactly_one_item",
      sql`(${table.sensorId} is not null) <> (${table.accessoryId} is not null)`,
    ),
  ],
);
