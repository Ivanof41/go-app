# Inventario: Sensores, Zonas y stock

Primer módulo de negocio real de la app (hasta ahora solo existía el login y el layout base). Permite crear los sensores que se van a inventariar, las entidades que los describen, y llevar el stock real por zona física.

## Qué se construyó

- **`/inventario/sensores`**: catálogo de sensores (nombre, marca, tecnología, proveedor, precio compra/venta, notas). No existe una página separada de "Catálogo" para Marca/Tecnología/Proveedor — se crean únicamente al vuelo desde el propio formulario de sensor (botón "+" junto a cada selector, `EntitySelectField` + `QuickCreateModal`), para no duplicar el mismo dato maestro en dos lugares. Solo se pueden crear, no editar/eliminar por separado — si hace falta corregir una, se hace vía sensor o directo en la DB por ahora.
- **`/inventario/zonas`**: stock real por zona, una `Card` por zona con sus sensores y cantidades. Zonas se crean/editan/eliminan desde esta misma página. Ajustar stock admite modo "sumar/restar" (delta, el default) o "fijar cantidad exacta" (absoluto).
- **Sidebar**: primer grupo de navegación expandible ("Inventario" → Sensores / Stock). El click en el grupo alterna sus sub-ítems como un acordeón **dentro del mismo riel** — con el sidebar colapsado, esto revela los íconos de Sensores/Stock apilados debajo (sin expandir el sidebar completo); con el sidebar expandido, revela los mismos ítems con su label. Es el mismo mecanismo (`isExpanded`/`onToggle`) en ambos casos, solo cambia cómo se renderiza cada `SidebarNavItem` (`collapsed` centra el ícono y usa un tooltip al hover; expandido muestra el label). El propio grupo, cuando el sidebar está colapsado, también tiene su tooltip al hover con solo su nombre — igual que cualquier ítem individual. Los sub-ítems no llevan indentación/borde propio (`ml-2 border-l ...`) — se descartó por dar un efecto de "relieve" que envolvía el nombre; el único indicador de jerarquía es el ícono más chico.
- **Sidebar + Topbar como una sola barra continua**: ambos comparten el mismo fondo blanco, la misma sombra suave (`shadow-[...(0,60,91,0.15)]`) y un borde de luz de 1px en `c24-teal/60` que nace en la esquina superior izquierda (donde el logo del Sidebar toca el Topbar) y se desvanece hacia los otros extremos — vertical en el borde derecho del Sidebar, horizontal en el borde inferior del Topbar. Antes tenían tratamientos de luz independientes (uno con `via-` centrado, otro sin luz) que se leían como dos piezas separadas. El Topbar ya no muestra el nombre de la página actual (se quitó el mapa `PAGE_TITLES` y el `<h2>`) — quedó solo reloj + menú de usuario, más limpio y sin depender de mantener ese mapa sincronizado con las rutas.
- **Selección visual = relleno, no subrayado**: el ítem activo (o el grupo activo) se marca con un fondo `bg-c24-teal-light` que cubre toda la fila (ícono + texto), consistente entre Dashboard, los sub-ítems de Inventario, y Montajes. Se descartó una versión anterior que combinaba un chip de fondo solo en el ícono con un subrayado animado bajo el texto — quedaba inconsistente entre el ícono y la etiqueta.
- **Montajes**: placeholder simple (`/montajes`, ícono `Wrench`), como ítem plano del Sidebar al mismo nivel que Dashboard e Inventario (no es un grupo, no tiene sub-páginas todavía).
- **`ConfirmDialog`**: primer componente de confirmación destructiva del proyecto, sobre `Modal`. Reutilizado para borrar sensor/zona.
- **`Modal` ganó una prop `size`** (`sm`/`lg`) en vez de aceptar `className` para el ancho — evita el mismo problema de clases Tailwind conflictivas que ya tenía `Button` con `fullWidth`.

## Decisiones tomadas

- **Fabricante = Marca**: una sola tabla (`brands`), no dos.
- **Sin página de Catálogo**: se construyó inicialmente (Marca/Tecnología/Proveedor con su propio CRUD) pero se eliminó a pedido del usuario — el flujo de creación rápida desde Sensores ya cubre la necesidad real, y mantener las dos vías era duplicar la misma gestión en dos pantallas. Las Server Actions de creación (`createBrandAction`, etc.) viven ahora directamente en `sensores/actions.ts`, el único lugar que las usa.
- **Sin librerías nuevas** (combobox/tabla/select): todo a mano con `<select>` nativo y `<table>` HTML, igual que el resto del proyecto.
- **Borrado de referencias en uso**: verificación previa con `count()` + mensaje amigable (sensor/zona con stock asociado) — nunca se deja fallar la constraint de la DB directamente. Las FKs usan `onDelete: "restrict"` como defensa en profundidad, no como el camino esperado.
- **Ajuste de stock en modo delta por defecto**: un usuario moviendo/contando inventario físico piensa en eventos ("llegaron 5"), no en el total resultante. Se implementa como `UPDATE quantity = quantity + $delta` atómico (`onConflictDoUpdate`), con el `CHECK quantity >= 0` de Postgres como red de seguridad final.
- **Modal en vez de rutas `/nuevo` y `/[id]/editar`** para crear/editar sensores: el formulario necesita estado local (las opciones de los selectores crecen al crear una entidad al vuelo), así que una ruta aparte no simplifica nada.
- **Página de Sensores a ancho completo** (sin `max-w`/`mx-auto`): la tabla se beneficia del espacio disponible, a diferencia de Ajustes (formularios angostos que sí se ven mejor centrados).

## Bug real encontrado durante la construcción

El flyout del grupo "Inventario" (cuando el Sidebar está colapsado) tenía `pointer-events-none` como clase base y `pointer-events-auto` condicional al mismo tiempo en la cadena de clases — el mismo problema de utilidades Tailwind conflictivas que ya afectó a `Button`/`Card` antes. El flyout se veía bien (opacity/transform sí resolvían correctamente porque usaban un ternario exclusivo) pero nunca era clickeable. Se corrigió usando un ternario exclusivo también para `pointer-events`, igual que para opacity/transform. Verificado con Playwright automatizando el hover + click real, no solo revisando el CSS a simple vista — así se detectó.

## Cómo probar

1. Crear un sensor usando el botón "+" de un selector para crear una marca/tecnología/proveedor nueva sin salir del formulario — debe quedar seleccionada automáticamente.
2. Editar y eliminar un sensor (con `ConfirmDialog`).
3. Crear una zona, agregar stock (delta y absoluto), intentar un delta que dejaría stock negativo (debe rechazar).
4. Intentar eliminar una zona o sensor con stock asociado (debe rechazar).
5. Sidebar: expandir/colapsar el grupo tanto con el sidebar ancho como colapsado (debe revelar los íconos/labels sin cambiar el ancho del sidebar), refrescar y verificar que persiste, navegar directo a una sub-ruta y verificar auto-expansión.
6. Confirmar que `/inventario/catalogo` ya no existe (404) y que Sensores ocupa el ancho completo de la página.
7. Confirmar que `/montajes` carga como placeholder y aparece en el Sidebar como ítem plano.
8. Confirmar que el Topbar no muestra ningún nombre de página en ninguna ruta, y que la luz de la esquina superior izquierda se ve continua entre Sidebar y Topbar.
