# Sistema de diseño

Todo vive como tokens CSS (`src/app/globals.css`) + componentes en `src/components/ui/`. No hay un doc de diseño separado del código: si algo cambia aquí, el código es la fuente de verdad y este archivo se actualiza junto con él.

## Paleta

Definida en `:root` y expuesta a Tailwind vía `@theme inline` (utilidades `bg-c24-*`, `text-c24-*`, `border-c24-*`):

| Token | Hex | Uso |
|---|---|---|
| `--c24-navy` | `#003c5b` | Texto principal, botón `primary` |
| `--c24-teal` | `#6ab5ab` | Acento, botón `accent`, focus ring, avatar fallback |
| `--c24-teal-dark` | `#4f9a91` | Hover de navy/teal |
| `--c24-teal-light` | `#edf4f3` | Fondos suaves (área de contenido, mensajes de éxito) |
| `--c24-text-muted` | `#4a6070` | Texto secundario/de apoyo |
| `--c24-border` | `rgba(0,60,91,0.1)` | Bordes sutiles |
| `--c24-danger` | `#dc2626` | Acciones destructivas, errores (botón `danger`) |
| `--c24-danger-light` | `#fef2f2` | Fondo de mensajes de error |

Radios (`--radius-sm/md/lg` = 8px/14px/20px) están conectados a Tailwind, así que `rounded-sm`/`rounded-md`/`rounded-lg` en cualquier componente usan estos valores, no el default de Tailwind.

## Tipografía

DM Sans (`next/font/google`, pesos 400/500/700). Convención de jerarquía (clases, no componente):

- `h1` de página: `text-2xl font-semibold text-c24-navy`
- `h2` de sección/Card: `text-base font-semibold text-c24-navy`
- Texto de apoyo: `text-sm text-c24-text-muted`

## Componentes (`src/components/ui/`)

### `Button`
Variantes: `primary` (navy, acción principal), `ghost` (outline, acción secundaria), `accent` (teal, para paneles oscuros — ver login), `danger` (rojo, acciones destructivas como "Cerrar sesión"). Por defecto es `fullWidth` (ocupa el 100% del contenedor, pensado para formularios); pasar `fullWidth={false}` para botones en línea (ej. footer de un modal).

**Importante**: no agregar `className="w-auto"` (o cualquier otra utilidad de ancho) esperando que sobreescriba `w-full` — con Tailwind, dos utilidades del mismo tipo (`w-*`) en la misma cadena de clases no se resuelven por orden de aparición, así que el resultado es impredecible. Usar siempre la prop `fullWidth` para eso.

### `Input`
Variantes: `light` (fondo blanco, para pantallas de tema claro — Ajustes, futuras features) y `dark` (fondo translúcido blanco sobre navy — panel de login).

### `Card`
Contenedor blanco con borde y radio (`rounded-lg border-c24-border`), `title` opcional que renderiza el `h2` de sección. Prop `dashed` para el estilo "placeholder/próximamente" (borde punteado, fondo semitransparente) — usado en las tarjetas del Dashboard.

### `Modal`
Overlay + diálogo centrado base. Cierra con `Escape` o click en el overlay (no al hacer click dentro del diálogo). Prop `size` (`sm` default, `lg` para formularios con más campos) — **nunca** pasar un `className` con `max-w-*` esperando anular el default, por la misma razón que `Button`/`fullWidth` (ver arriba): usar siempre la prop. Cualquier modal nuevo se construye sobre este componente, no reinventando su propio overlay (ver `AvatarCropModal` como ejemplo).

### `ConfirmDialog`
Confirmación destructiva genérica sobre `Modal`: título, descripción opcional, error opcional, botones Cancelar (`ghost`)/Confirmar (`danger`). Usar para cualquier borrado — no reinventar el overlay de confirmación cada vez (ver el módulo de Inventario).

### `Avatar`
Imagen circular si hay `src` (data URL), o iniciales sobre fondo teal si no. Tamaños `sm`/`md`/`lg`.

## El color de hover de una fila tiene que contrastar con el fondo real de la página, no con uno viejo

Regla general (el ejemplo concreto cambió con el tiempo, ver historia abajo): el hover de un elemento que vive directo sobre el fondo de `<main>` (sin una `Card` de por medio) tiene que ser un color que **contraste con el fondo actual de `ProtectedLayout`**, no el que contrastaba en una versión anterior de la app. Si el hover y el fondo terminan siendo el mismo color (o casi), el hover directamente no se ve — bajarle la opacidad (`/40`, `/60`, etc.) no arregla eso, solo lo hace más tenue todavía.

Historia, para que quede claro por qué esto es una trampa recurrente y no un error de una sola vez: originalmente `ProtectedLayout` tenía `bg-c24-teal-light`, y las filas de `SensorsTable` (que viven directo sobre ese fondo, sin `Card`) usaban `hover:bg-white` — contrastaba bien. Cuando la app se invirtió a fondo blanco + tarjetas oscuras (ver "Fondo de la app a blanco..." en [features/inventario.md](features/inventario.md)), `ProtectedLayout` pasó a `bg-white`, pero nadie tocó el hover de las tablas — quedaron con `hover:bg-white` sobre un fondo `bg-white`, invisible, y pasó desapercibido varias sesiones porque un hover roto no aparece en una captura de pantalla estática. Se corrigió a `hover:bg-c24-teal-light/50` en `SensorsTable.tsx`, `AccessoriesTable.tsx` y `MontajesTable.tsx`. Moraleja: cualquier cambio de fondo de página a futuro tiene que repasar también los hovers de elementos que viven directo sobre ese fondo, no solo los colores de texto/borde más obvios.

## La trampa de las clases Tailwind conflictivas

Ya nos mordió tres veces (`Button.fullWidth`, `Card` con `dashed`, el flyout del Sidebar): si dos utilidades del **mismo eje** (`w-*`, `max-w-*`, `bg-*`, `pointer-events-*`) aparecen juntas en una cadena de clases — una fija y otra condicional — el resultado no se resuelve por orden de aparición en el JSX, sino por el orden interno en que Tailwind genera el CSS. Es decir: **nunca poner el valor base y su override condicional como dos clases separadas del mismo eje**; usar siempre un ternario exclusivo (`condición ? "clase-a" : "clase-b"`) o una prop dedicada del componente (`fullWidth`, `size`, `dashed`).

## Íconos

**`lucide-react`** (line icons, `strokeWidth={1.75}` por convención en Sidebar/Topbar). Se eligió esta librería porque los SVG dibujados a mano (usados inicialmente en el Sidebar) no se veían suficientemente profesionales; `lucide-react` es tree-shakeable (cada ícono se importa por nombre, no infla el bundle) y su estilo de trazo combina bien con la paleta existente. El único ícono hecho a mano que se mantiene es el `CheckIcon` de `BrandPanel.tsx` (parte del branding del login, no un ícono de UI genérico).
