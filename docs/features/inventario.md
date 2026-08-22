# Inventario: Catálogo, Sensores, Zonas y stock

Primer módulo de negocio real de la app (hasta ahora solo existía el login y el layout base). Permite crear los sensores que se van a inventariar, las entidades que los describen, y llevar el stock real por zona física.

## Qué se construyó

- **`/inventario/catalogo`**: gestión de Marca, Tecnología y Proveedor — tres tablas de referencia simples (crear/editar/eliminar un nombre), con un componente genérico (`CatalogSection`) reutilizado 3 veces.
- **`/inventario/sensores`**: catálogo de sensores (nombre, marca, tecnología, proveedor, precio compra/venta, notas). Cada selector de marca/tecnología/proveedor tiene un botón "+" para crear la entidad al vuelo sin salir del formulario (`EntitySelectField` + `QuickCreateModal`), reusando las mismas Server Actions que `/inventario/catalogo`.
- **`/inventario/zonas`**: stock real por zona, una `Card` por zona con sus sensores y cantidades. Zonas se crean/editan/eliminan desde esta misma página (no en Catálogo). Ajustar stock admite modo "sumar/restar" (delta, el default) o "fijar cantidad exacta" (absoluto).
- **Sidebar**: primer grupo de navegación expandible ("Inventario" → Sensores/Catálogo/Zonas y stock). El Sidebar pasó de una lista plana a soportar `NavGroup` además de `NavLeaf`.
- **`ConfirmDialog`**: primer componente de confirmación destructiva del proyecto, sobre `Modal`. Reutilizado para borrar marca/tecnología/proveedor/sensor/zona.
- **`Modal` ganó una prop `size`** (`sm`/`lg`) en vez de aceptar `className` para el ancho — evita el mismo problema de clases Tailwind conflictivas que ya tenía `Button` con `fullWidth`.

## Decisiones tomadas

- **Fabricante = Marca**: una sola tabla (`brands`), no dos.
- **Zonas fuera de Catálogo**: se consideran "dónde está el stock", no "qué es el producto".
- **Sin librerías nuevas** (combobox/tabla/select): todo a mano con `<select>` nativo y `<table>` HTML, igual que el resto del proyecto.
- **Borrado de referencias en uso**: verificación previa con `count()` + mensaje amigable (marca/tecnología/proveedor en uso por sensores, sensor/zona con stock asociado) — nunca se deja fallar la constraint de la DB directamente. Las FKs usan `onDelete: "restrict"` como defensa en profundidad, no como el camino esperado.
- **Ajuste de stock en modo delta por defecto**: un usuario moviendo/contando inventario físico piensa en eventos ("llegaron 5"), no en el total resultante. Se implementa como `UPDATE quantity = quantity + $delta` atómico (`onConflictDoUpdate`), con el `CHECK quantity >= 0` de Postgres como red de seguridad final.
- **Modal en vez de rutas `/nuevo` y `/[id]/editar`** para crear/editar sensores: el formulario necesita estado local (las opciones de los selectores crecen al crear una entidad al vuelo), así que una ruta aparte no simplifica nada.

## Bug real encontrado durante la construcción

El flyout del grupo "Inventario" (cuando el Sidebar está colapsado) tenía `pointer-events-none` como clase base y `pointer-events-auto` condicional al mismo tiempo en la cadena de clases — el mismo problema de utilidades Tailwind conflictivas que ya afectó a `Button`/`Card` antes. El flyout se veía bien (opacity/transform sí resolvían correctamente porque usaban un ternario exclusivo) pero nunca era clickeable. Se corrigió usando un ternario exclusivo también para `pointer-events`, igual que para opacity/transform. Verificado con Playwright automatizando el hover + click real, no solo revisando el CSS a simple vista — así se detectó.

## Cómo probar

1. Crear una Marca, Tecnología y Proveedor en Catálogo; editar y eliminar uno sin uso; intentar eliminar uno en uso por un sensor (debe rechazar).
2. Crear un sensor usando el botón "+" de un selector para crear una marca nueva sin salir del formulario — debe quedar seleccionada automáticamente.
3. Crear una zona, agregar stock (delta y absoluto), intentar un delta que dejaría stock negativo (debe rechazar).
4. Intentar eliminar una zona o sensor con stock asociado (debe rechazar).
5. Sidebar: expandir/colapsar el grupo, refrescar y verificar que persiste; navegar directo a una sub-ruta y verificar auto-expansión; colapsar el sidebar entero y verificar que el flyout del grupo funciona y es clickeable.
