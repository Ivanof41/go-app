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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sensorStock = pgTable(
  "sensor_stock",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sensorId: uuid("sensor_id")
      .notNull()
      .references(() => sensors.id, { onDelete: "restrict" }),
    zoneId: uuid("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(0),
    // Celda dentro de la rejilla de la zona (0-indexado). El único índice está en
    // (zoneId, row, col), no en (sensorId, zoneId): una celda solo admite un sensor,
    // pero el mismo sensor sí puede repetirse en varias celdas de la misma zona.
    row: integer("row").notNull(),
    col: integer("col").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sensor_stock_zone_cell_unique").on(table.zoneId, table.row, table.col),
    check("sensor_stock_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);
