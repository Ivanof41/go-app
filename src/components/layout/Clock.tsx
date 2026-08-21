"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hora del cliente, no existe en el servidor
    setTime(formatTime(new Date()));
    const interval = setInterval(() => setTime(formatTime(new Date())), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <span className="text-sm font-medium tabular-nums text-c24-navy" aria-label="Hora actual">
      {time}
    </span>
  );
}
