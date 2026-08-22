const euroFormatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatEuro(value: number | null) {
  return value === null ? "—" : euroFormatter.format(value);
}
