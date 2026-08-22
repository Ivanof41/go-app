import {
  Antenna,
  BatteryCharging,
  BatteryFull,
  Bluetooth,
  Box,
  Cable,
  Camera,
  CreditCard,
  Droplets,
  Gauge,
  HelpCircle,
  Package,
  Router,
  Satellite,
  Sun,
  Thermometer,
  Waves,
  Wifi,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Lista abierta a propósito (ver el comentario en sensors.type de src/db/schema.ts):
// se espera seguir agregando íconos (tipos de sensor y accesorios que llevan) sin
// que eso implique una migración de base de datos.
export const SENSOR_TYPES = [
  { value: "presion", label: "Presión", icon: Gauge },
  { value: "electricidad", label: "Electricidad", icon: Zap },
  { value: "consumo_agua", label: "Consumo de agua", icon: Droplets },
  { value: "temperatura", label: "Temperatura", icon: Thermometer },
  { value: "pasarela_lorawan", label: "Pasarela LoRaWAN", icon: Antenna },
  { value: "nivel_agua", label: "Nivel de agua", icon: Waves },
  { value: "calidad_aire", label: "Calidad del aire", icon: Wind },
  { value: "bateria", label: "Batería", icon: BatteryFull },
  { value: "cargador", label: "Cargador", icon: BatteryCharging },
  { value: "panel_solar", label: "Panel solar", icon: Sun },
  { value: "router", label: "Router / gateway", icon: Router },
  { value: "satelite", label: "Satélite / GPS", icon: Satellite },
  { value: "camara", label: "Cámara", icon: Camera },
  { value: "soporte", label: "Soporte / kit de montaje", icon: Package },
  { value: "carcasa", label: "Carcasa", icon: Box },
  { value: "cable", label: "Cable / conector", icon: Cable },
  { value: "tarjeta_sim", label: "Tarjeta SIM", icon: CreditCard },
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "bluetooth", label: "Bluetooth", icon: Bluetooth },
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
