import { Antenna, Droplets, Gauge, HelpCircle, Thermometer, Waves, Wind, Zap, type LucideIcon } from "lucide-react";

export const SENSOR_TYPES = [
  { value: "presion", label: "Presión", icon: Gauge },
  { value: "electricidad", label: "Electricidad", icon: Zap },
  { value: "consumo_agua", label: "Consumo de agua", icon: Droplets },
  { value: "temperatura", label: "Temperatura", icon: Thermometer },
  { value: "pasarela_lorawan", label: "Pasarela LoRaWAN", icon: Antenna },
  { value: "nivel_agua", label: "Nivel de agua", icon: Waves },
  { value: "calidad_aire", label: "Calidad del aire", icon: Wind },
  { value: "otro", label: "Otro", icon: HelpCircle },
] as const;

export type SensorTypeValue = (typeof SENSOR_TYPES)[number]["value"];

export const SENSOR_TYPE_VALUES = SENSOR_TYPES.map((t) => t.value) as [SensorTypeValue, ...SensorTypeValue[]];

export function getSensorTypeIcon(type: string): LucideIcon {
  return SENSOR_TYPES.find((t) => t.value === type)?.icon ?? HelpCircle;
}

export function getSensorTypeLabel(type: string): string {
  return SENSOR_TYPES.find((t) => t.value === type)?.label ?? "Otro";
}
