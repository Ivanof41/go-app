import ExcelJS from "exceljs";
import { SENSOR_TYPES } from "@/lib/inventario/sensor-types";

// Alta masiva de sensores desde Excel. La plantilla se genera al vuelo (ver
// /api/sensores/plantilla) en vez de ser un .xlsx estático en /public: así los
// desplegables de Tipo/Marca/Tecnología/Proveedor salen siempre de la lista viva
// (SENSOR_TYPES crece seguido, y las marcas se crean desde la app) sin que nadie
// tenga que acordarse de regenerar un archivo.

export const MAX_IMPORT_BYTES = 5_000_000;
export const MAX_IMPORT_ROWS = 1000;

const SHEET_NAME = "Sensores";
const LISTS_SHEET_NAME = "Listas";

// `key` es el nombre interno; `header` lo que ve el usuario. Al leer se busca la
// columna por encabezado (normalizado), no por posición — si alguien reordena o
// borra columnas opcionales en su copia de la plantilla, la importación sigue andando.
export const IMPORT_COLUMNS = [
  { key: "name", header: "Nombre *", width: 34, note: "Obligatorio. Mínimo 2 caracteres." },
  { key: "type", header: "Tipo *", width: 26, note: "Obligatorio. Elegir de la lista desplegable." },
  { key: "brand", header: "Marca", width: 20, note: "Opcional. Si no existe en la app, se crea." },
  { key: "technology", header: "Tecnología", width: 20, note: "Opcional. Si no existe en la app, se crea." },
  { key: "provider", header: "Proveedor", width: 22, note: "Opcional. Si no existe en la app, se crea." },
  { key: "purchasePrice", header: "Precio compra (€)", width: 18, note: "Opcional. Número mayor que 0, ej. 45,90" },
  { key: "salePrice", header: "Precio venta (€)", width: 18, note: "Opcional. Número mayor que 0, ej. 79,00" },
  { key: "notes", header: "Notas", width: 40, note: "Opcional. Máximo 1000 caracteres." },
] as const;

type ImportColumnKey = (typeof IMPORT_COLUMNS)[number]["key"];

export type RawSensorRow = { rowNumber: number } & Record<ImportColumnKey, string>;

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[*()€]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Acepta tanto la etiqueta ("Temperatura") como el valor interno ("temperatura"),
// sin importar mayúsculas ni tildes — la gente va a pegar datos de otros Excel.
export function resolveSensorType(input: string): string | null {
  const normalized = normalizeHeader(input);
  const match = SENSOR_TYPES.find(
    (t) => normalizeHeader(t.label) === normalized || normalizeHeader(t.value) === normalized,
  );
  return match?.value ?? null;
}

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003C5B" } }; // --c24-navy
const EXAMPLE_FONT: Partial<ExcelJS.Font> = { italic: true, color: { argb: "FF4A6070" } }; // --c24-text-muted

// `worksheet.dataValidations` existe en runtime pero no está en los tipos de exceljs.
function dataValidations(sheet: ExcelJS.Worksheet) {
  return (sheet as unknown as { dataValidations: { add(range: string, v: ExcelJS.DataValidation): void } })
    .dataValidations;
}

export async function buildSensorTemplate(catalogs: {
  brands: string[];
  technologies: string[];
  providers: string[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Connect24 Go";

  const sheet = workbook.addWorksheet(SHEET_NAME, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = IMPORT_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
    cell.note = IMPORT_COLUMNS[colNumber - 1].note;
  });

  // Hoja oculta con las listas para los desplegables — una validación de Excel con
  // lista literal ("a,b,c") tiene tope de 255 caracteres, y los tipos ya lo superan.
  const lists = workbook.addWorksheet(LISTS_SHEET_NAME, { state: "veryHidden" });
  const listColumns: { key: ImportColumnKey; values: string[] }[] = [
    { key: "type", values: SENSOR_TYPES.map((t) => t.label) },
    { key: "brand", values: catalogs.brands },
    { key: "technology", values: catalogs.technologies },
    { key: "provider", values: catalogs.providers },
  ];

  const lastDataRow = MAX_IMPORT_ROWS + 1;
  listColumns.forEach(({ key, values }, i) => {
    const colLetter = String.fromCharCode(65 + i);
    values.forEach((v, rowIdx) => {
      lists.getCell(`${colLetter}${rowIdx + 1}`).value = v;
    });
    if (values.length === 0) return;

    const targetLetter = String.fromCharCode(65 + IMPORT_COLUMNS.findIndex((c) => c.key === key));
    const source = `${LISTS_SHEET_NAME}!$${colLetter}$1:$${colLetter}$${values.length}`;
    // Tipo es estricto (tiene que ser uno de los íconos conocidos). Marca/Tecnología/
    // Proveedor solo sugieren: se puede escribir uno nuevo y la importación lo crea.
    const strict = key === "type";
    // Una sola validación por rango, no celda por celda (cell.dataValidation): exceljs
    // agrupa las celdas ordenando direcciones como texto ("B10" < "B2") y genera rangos
    // solapados que Excel "repara" al abrir el archivo.
    dataValidations(sheet).add(`${targetLetter}2:${targetLetter}${lastDataRow}`, {
      type: "list",
      allowBlank: true,
      formulae: [source],
      showErrorMessage: strict,
      ...(strict && {
        errorStyle: "stop",
        errorTitle: "Tipo no válido",
        error: "Elige un tipo de la lista desplegable.",
      }),
    });
  });

  const priceCols = IMPORT_COLUMNS.flatMap((c, i) =>
    c.key === "purchasePrice" || c.key === "salePrice" ? [i + 1] : [],
  );
  for (const col of priceCols) sheet.getColumn(col).numFmt = '#,##0.00 "€"';

  const instructions = workbook.addWorksheet("Instrucciones");
  instructions.columns = [{ width: 24 }, { width: 70 }];
  instructions.addRow(["Cómo usar esta plantilla"]).font = { bold: true, size: 14 };
  instructions.addRow([]);
  [
    "1. Rellena una fila por sensor en la hoja «Sensores» (desde la fila 2).",
    "2. Solo Nombre y Tipo son obligatorios; el resto se puede completar después en la app.",
    "3. Tipo: elígelo del desplegable. Marca, Tecnología y Proveedor sugieren los ya existentes, pero puedes escribir uno nuevo y se creará.",
    "4. Precios: solo el número (ej. 45,90). Sin símbolo de moneda.",
    "5. No cambies los encabezados de la fila 1.",
    "6. Si un sensor ya existe en la app con el mismo nombre, se omite (no se duplica).",
    "7. Si alguna fila tiene errores, no se importa nada: la app te indica qué filas corregir.",
    `8. Máximo ${MAX_IMPORT_ROWS} sensores por archivo.`,
    "9. Los manuales PDF se adjuntan después, editando cada sensor.",
  ].forEach((line) => instructions.addRow([line]));
  instructions.addRow([]);
  instructions.addRow(["Columna", "Descripción"]).font = { bold: true };
  IMPORT_COLUMNS.forEach((c) => instructions.addRow([c.header, c.note]));
  instructions.addRow([]);
  instructions.addRow(["Ejemplo de fila"]).font = { bold: true };
  const example = ["Sensor temperatura LHT65N", "Temperatura", "Dragino", "LoRaWAN", "Distribuidor X", 45.9, 79, "Incluye sonda externa"];
  IMPORT_COLUMNS.forEach((c, i) => {
    const row = instructions.addRow([c.header, example[i]]);
    row.getCell(2).font = EXAMPLE_FONT;
  });
  instructions.getColumn(1).alignment = { wrapText: true, vertical: "top" };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((r) => r.text).join("").trim();
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("text" in value) return String(value.text).trim();
    if ("error" in value) return "";
  }
  return String(value).trim();
}

export async function parseSensorWorkbook(
  data: ArrayBuffer,
): Promise<{ rows: RawSensorRow[] } | { error: string }> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(data);
  } catch {
    return { error: "No se pudo leer el archivo. ¿Es un Excel (.xlsx) válido?" };
  }

  // Preferimos la hoja de la plantilla por nombre; si alguien la renombró, la primera
  // hoja visible.
  const sheet =
    workbook.getWorksheet(SHEET_NAME) ?? workbook.worksheets.find((ws) => ws.state === "visible");
  if (!sheet) return { error: "El archivo no tiene hojas" };

  const headerRow = sheet.getRow(1);
  const columnByKey = new Map<ImportColumnKey, number>();
  headerRow.eachCell((cell, colNumber) => {
    const header = normalizeHeader(cellText(cell.value));
    const column = IMPORT_COLUMNS.find((c) => normalizeHeader(c.header) === header);
    if (column) columnByKey.set(column.key, colNumber);
  });

  if (!columnByKey.has("name") || !columnByKey.has("type")) {
    return { error: "No se encontraron las columnas «Nombre» y «Tipo» en la fila 1. Usa la plantilla." };
  }

  const rows: RawSensorRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = { rowNumber } as RawSensorRow;
    for (const c of IMPORT_COLUMNS) {
      const col = columnByKey.get(c.key);
      raw[c.key] = col ? cellText(row.getCell(col).value) : "";
    }
    // Filas que solo tienen formato o validación (sin datos) también cuentan como
    // "no vacías" para exceljs — se descartan acá.
    if (IMPORT_COLUMNS.every((c) => raw[c.key] === "")) return;
    rows.push(raw);
  });

  if (rows.length === 0) return { error: "El archivo no tiene sensores (la hoja está vacía)" };
  if (rows.length > MAX_IMPORT_ROWS) {
    return { error: `Máximo ${MAX_IMPORT_ROWS} sensores por archivo (tiene ${rows.length})` };
  }
  return { rows };
}
