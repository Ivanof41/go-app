# Documentación de Go!

Referencia de desarrollo para quien trabaje en el código de Go! (distinto del [README.md](../README.md) raíz, que es la guía rápida de setup/deploy).

- [architecture.md](./architecture.md) — stack, estructura de carpetas, modelo de auth/sesión, cómo se despliega.
- [design-system.md](./design-system.md) — paleta, tipografía, radios/sombras, y los componentes UI (`Button`, `Input`, `Card`, `Modal`, `Avatar`) con sus variantes.
- `features/` — un archivo por feature construida, con las decisiones tomadas y por qué. Empieza con [features/dashboard.md](./features/dashboard.md).

`architecture.md` y `design-system.md` se actualizan solo cuando cambian esas cosas (no en cada feature nueva). Cada feature nueva agrega su propio archivo en `features/`.
