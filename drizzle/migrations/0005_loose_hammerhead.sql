-- Rejilla visual de zonas: cada zona gana una forma (rows x cols) y cada línea de
-- stock pasa a ocupar una celda (row, col) en vez de ser un total agregado por zona.
-- Editado a mano sobre lo que generó drizzle-kit: el índice único cambia de
-- (sensor_id, zone_id) a (zone_id, row, col), y sensor_stock.row/col no pueden ir
-- NOT NULL de entrada si ya hay stock cargado, así que se agregan nullable, se
-- rellenan, y recién después se endurecen.

ALTER TABLE "zones" ADD COLUMN "rows" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "zones" ADD COLUMN "cols" integer DEFAULT 4 NOT NULL;--> statement-breakpoint

-- Ensancha solo "rows" (nunca "cols") en zonas cuyo stock actual no entraría en 3x4,
-- para que ningún stock existente quede fuera de la rejilla visible tras la migración.
WITH counts AS (
  SELECT zone_id, count(*) AS n FROM "sensor_stock" GROUP BY zone_id
)
UPDATE "zones" z
SET rows = GREATEST(z.rows, CEIL(c.n::numeric / z.cols))
FROM counts c
WHERE c.zone_id = z.id AND c.n > z.rows * z.cols;--> statement-breakpoint

ALTER TABLE "sensor_stock" ADD COLUMN "row" integer;--> statement-breakpoint
ALTER TABLE "sensor_stock" ADD COLUMN "col" integer;--> statement-breakpoint

-- Backfill: asigna a cada línea de stock existente una celda secuencial dentro de la
-- rejilla (ya ensanchada si hacía falta) de su zona. La posición es arbitraria (orden
-- de creación), no la ubicación física real — es solo para que la migración no rompa.
WITH numbered AS (
  SELECT ss.id, z.cols,
         row_number() OVER (PARTITION BY ss.zone_id ORDER BY ss.created_at) - 1 AS rn
  FROM "sensor_stock" ss
  JOIN "zones" z ON z.id = ss.zone_id
)
UPDATE "sensor_stock" ss
SET row = numbered.rn / numbered.cols,
    col = numbered.rn % numbered.cols
FROM numbered
WHERE numbered.id = ss.id;--> statement-breakpoint

ALTER TABLE "sensor_stock" ALTER COLUMN "row" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sensor_stock" ALTER COLUMN "col" SET NOT NULL;--> statement-breakpoint

DROP INDEX "sensor_stock_sensor_zone_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "sensor_stock_zone_cell_unique" ON "sensor_stock" USING btree ("zone_id","row","col");
