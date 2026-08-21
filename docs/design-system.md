# Sistema de diseño

Todo vive como tokens CSS (`src/app/globals.css`) + componentes en `src/components/ui/`. No hay un doc de diseño separado del código: si algo cambia aquí, el código es la fuente de verdad y este archivo se actualiza junto con él.

## Paleta

Definida en `:root` y expuesta a Tailwind vía `@theme inline` (utilidades `bg-c24-*`, `text-c24-*`, `border-c24-*`):

| Token | Hex | Uso |
|---|---|---|
| `--c24-navy` | `#003c5b` | Texto principal, botón `primary`, fondo del Sidebar |
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
Overlay + diálogo centrado base. Cierra con `Escape` o click en el overlay (no al hacer click dentro del diálogo). Cualquier modal nuevo se construye sobre este componente, no reinventando su propio overlay (ver `AvatarCropModal` como ejemplo).

### `Avatar`
Imagen circular si hay `src` (data URL), o iniciales sobre fondo teal si no. Tamaños `sm`/`md`/`lg`.

## Íconos

SVG inline, sin librería externa. Convención: `stroke="currentColor"`, sin relleno (`fill="none"`), trazos con `strokeLinecap="round"` donde aplique — ver `src/components/layout/icons.tsx` y el `CheckIcon` de `BrandPanel.tsx` como referencia de estilo.
