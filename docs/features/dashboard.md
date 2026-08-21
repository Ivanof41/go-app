# Dashboard, Sidebar, Topbar y Ajustes

Primera pantalla interna real de la app, sobre la base del login (Etapa 1). Construye el layout que van a compartir todas las features futuras (inventario, montajes, etc.).

## Qué se construyó

- **Sidebar** (`src/components/layout/Sidebar.tsx`): colapsable/expandible (persistido en `localStorage`, clave `go:sidebar-collapsed`), fondo navy en continuidad con el login. Por ahora solo dos ítems: Dashboard y Ajustes — no se agregaron placeholders de Inventario/Montajes como enlaces de navegación (para no tener enlaces muertos); cuando esas features existan, se agregan a `NAV_ITEMS`.
- **Topbar** (`src/components/layout/Topbar.tsx`): avatar + nombre del usuario, con un dropdown a mano (sin librería) que lleva a Ajustes o cierra sesión.
- **`getCurrentUser()`** (`src/lib/current-user.ts`): fuente de verdad para nombre/email/avatar, independiente del JWT — ver [architecture.md](../architecture.md#sesión-y-datos-de-perfil) para el por qué.
- **`/ajustes`**: cambiar nombre, email y contraseña, y subir/recortar foto de perfil.
- **Sistema de diseño**: se cerraron huecos que existían desde el login (radios no conectados a Tailwind, sin color de "peligro", sin `Card`/`Modal` reutilizables) — ver [design-system.md](../design-system.md).

## Decisiones tomadas

- **Avatar en la base de datos**, no en un volumen de archivos: columna `avatar` (`text`, nullable) en `users`, guardando un data URL base64 de una imagen ya recortada y comprimida a 256×256 JPEG (~20-70KB). Es la opción más simple de desplegar para esta escala — no requiere configurar un volumen Docker nuevo ni servir archivos estáticos aparte. Si en el futuro esto no escala bien (muchos usuarios, avatares grandes), migrar a almacenamiento en disco/objeto sería el siguiente paso.
- **Sin soporte mobile**: es una app de uso exclusivamente de escritorio, así que Sidebar/Topbar no tienen breakpoints ni comportamiento responsive.
- **Editor de recorte: `react-easy-crop`**: peer deps compatibles con React 19 sin parches, una sola dependencia transitiva pequeña, API controlada por props. El recorte final se hace con `<canvas>` en el cliente (sin dependencia adicional) y se manda como data URL ya listo — el servidor solo valida formato/tamaño (`src/lib/avatar.ts`), no procesa la imagen.
- **Contraseña**: `changePasswordAction` exige la contraseña actual (verificada con `verifyPassword`) antes de permitir el cambio — no alcanza con estar logueado.

## Cómo probar

1. Colapsar/expandir el Sidebar, refrescar la página → el estado persiste.
2. Cambiar nombre/email en Ajustes → el Topbar y el "Bienvenido, {nombre}" del Dashboard se actualizan sin cerrar sesión.
3. Cambiar contraseña → cerrar sesión → la contraseña vieja falla, la nueva funciona.
4. Subir una foto, recortarla (zoom/pan), guardar → aparece de inmediato en el Topbar y en Ajustes, y persiste tras recargar (está en la DB, no solo en el estado del componente).
