"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const MARGIN = 8;

// Portal a document.body a propósito: un <span> con position:absolute igual cuenta para
// el "scrollable overflow" del ancestro más cercano con overflow-x-auto (acá, el
// contenedor de las tablas de Montajes/Sensores/Accesorios), aunque sea invisible por
// opacity-0 y no afecte el layout normal — eso hacía aparecer una barra de scroll
// horizontal permanente y corría los íconos de la última columna. Renderizando el globo
// fuera del árbol de la tabla (con posición calculada a mano en cada hover) ese problema
// desaparece de raíz.
//
// Medición en dos pasos (useLayoutEffect después de montar, en vez de calcular todo en
// el mouseenter): centrar SIEMPRE sobre el ícono sin recortar reproducía el mismo bug
// para el último ícono de una fila (ej. "Eliminar", pegado al borde derecho) — ahí la
// mitad del globo quedaba fuera del viewport, y ESO también cuenta como scrollable
// overflow de la página, agregando un scroll horizontal nuevo justo al pasar el cursor.
// Acá se monta oculto, se mide su ancho real, y se lo recorta contra los bordes del
// viewport antes de mostrarlo — useLayoutEffect corre antes de pintar, así que no hay
// parpadeo.
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!visible) return;
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    if (!triggerRect || !tooltipRect) return;

    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    left = Math.min(Math.max(left, MARGIN), window.innerWidth - tooltipRect.width - MARGIN);

    let top = triggerRect.top - tooltipRect.height - 6;
    // Si no entra arriba (fila pegada al borde superior), lo manda abajo del ícono en vez
    // de dejarlo cortado por encima del viewport.
    if (top < MARGIN) top = triggerRect.bottom + 6;

    setPos({ top, left });
  }, [visible]);

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => {
        setVisible(false);
        setPos(null);
      }}
    >
      {children}
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            ref={tooltipRef}
            role="tooltip"
            className="pointer-events-none fixed z-[1200] rounded-md bg-c24-navy px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md"
            // Sin `pos` todavía (primer render, recién montado): se deja fuera de vista
            // en vez de en (0,0) — ahí es exactamente donde se mide su ancho real antes
            // de decidir la posición final, así el usuario nunca ve el salto.
            style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
