# Arquitectura

## Stack

- **Next.js 16** (App Router, TypeScript), fuente DM Sans vía `next/font`.
- **Auth.js (NextAuth v5)** con `CredentialsProvider`, sesión `strategy: "jwt"`. Sin adapter de base de datos (no hay OAuth ni auto-registro; el `authorize()` valida directo contra la tabla `users`).
- **Drizzle ORM + PostgreSQL** (`postgres.js` como driver). Migraciones en `drizzle/migrations/`, generadas con `npm run db:generate` y aplicadas manualmente (ver "Despliegue" abajo).
- **Tailwind CSS v4** vía `@theme inline` en `src/app/globals.css` — ver [design-system.md](./design-system.md).
- **Docker** para producción (`Dockerfile` multi-stage, `docker-compose.prod.yml`), separado del entorno de desarrollo (`docker-compose.yml`, solo Postgres).

## Estructura de carpetas

```
src/
  auth.ts                    Config de Auth.js (NO tocar para agregar datos de perfil — ver "Sesión" abajo)
  proxy.ts                   Middleware (Next 16 renombró "middleware.ts" a "proxy.ts"). Protege todo salvo
                             /login, /api/auth/*, y assets estáticos (svg/png/jpg/jpeg/gif/webp/ico).
  db/
    index.ts                 Cliente Drizzle (singleton)
    schema.ts                Definición de tablas
  lib/
    current-user.ts          getCurrentUser() — ver "Sesión" abajo
    password.ts              hash/verify con bcryptjs
    env.ts                   Validación de env vars con zod
  components/
    ui/                      Componentes genéricos reutilizables (Button, Input, Card, Modal, Avatar)
    layout/                  Sidebar, Topbar — específicos del layout de (protected)
    auth/                    Componentes de la pantalla de login
    settings/                Componentes de la página de Ajustes
  app/
    login/                   Pantalla de login (pública)
    (protected)/             Todo lo que requiere sesión — layout.tsx valida sesión y envuelve
                             con Sidebar + Topbar
      dashboard/             Home tras login
      ajustes/               Perfil, contraseña, avatar
      <feature futura>/      Cada feature nueva (inventario, montajes) va aquí como su propia carpeta
    api/auth/[...nextauth]/  Handlers de Auth.js
```

**Convención para features nuevas**: cada una vive en `src/app/(protected)/<feature>/`, hereda el guard de sesión del layout de `(protected)`, y su lógica de negocio/queries va en `src/lib/<feature>/` (no todo amontonado en `db/`). Componentes específicos de la feature van junto a ella (`src/app/(protected)/<feature>/_components/` o `src/components/<feature>/`, según el tamaño).

## Sesión y datos de perfil

El JWT de sesión (`src/auth.ts`, callback `jwt`/`session`) carga **solo `id` y `role`** — lo mínimo necesario para autorización. Deliberadamente **no** carga `name`/`email`/`avatar`, porque esos datos cambian (el usuario los edita en Ajustes) y un JWT no se puede "actualizar" sin re-emitirlo.

En vez de eso, `src/lib/current-user.ts` expone `getCurrentUser()`: llama a `auth()` para el `id` de sesión y hace un **SELECT fresco** a `users` en cada request (memoizado con `cache()` de React dentro del mismo render, para no duplicar la consulta entre el layout y la página). Es la única fuente de verdad para mostrar nombre/email/avatar — así, tras editar el perfil en Ajustes, el Topbar y el Dashboard reflejan el cambio de inmediato, sin re-login.

`proxy.ts` sigue siendo el gatekeeper barato (solo verifica que haya una sesión válida, sin tocar la DB) para todas las rutas protegidas; `getCurrentUser()` es la verificación autoritativa de datos, usada dentro de cada layout/página que necesite mostrarlos.

## Despliegue

Producción corre en Docker (`docker-compose.prod.yml`, proyecto compose `go-app-prod`), detrás de Nginx (`proxy_pass` a `127.0.0.1:3001`) con SSL de Let's Encrypt en `go.connect24.io`. Redeploy tras un cambio:

```
git pull
docker compose -p go-app-prod --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Las migraciones **no** se aplican automáticamente — se copian y corren manualmente contra el contenedor de Postgres antes de desplegar la imagen nueva que ya espera el cambio de esquema:

```
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i go-postgres-prod psql -U go_app -d go_db < drizzle/migrations/000X_xxx.sql
```

Mismo procedimiento en dev, contra el contenedor `go-postgres` (`docker-compose.yml`, puerto `127.0.0.1:5433`).
