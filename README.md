# Go!

App interna de Connect24 para gestión de inventario y control de montajes.

**Etapa 1 (actual):** estructura base del proyecto + login funcional contra Postgres. El resto (inventario, montajes, dashboard real) se construye en etapas posteriores.

**En producción:** https://go.connect24.io (desde 2026-08-21).

## Stack

- Next.js (App Router, TypeScript)
- Auth.js (NextAuth v5) con Credentials Provider, sesión JWT
- Drizzle ORM + PostgreSQL
- Tailwind CSS v4

## Desarrollo local

1. Copiar `.env.example` a `.env` y completar los valores (`AUTH_SECRET` se genera con `npx auth secret`).
2. Levantar Postgres: `docker compose up -d`
3. Aplicar migraciones: `npm run db:migrate`
4. Crear el primer usuario admin (usa `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` del `.env`):
   ```
   npm run seed:admin
   ```
5. `npm run dev` y abrir `http://localhost:3000`

## Logos

En `public/`:
- `LogoGO.png` — logo completo (wordmark + tagline + dominio), usado en la pantalla de login.
- `LogoOnlyGo.png` — solo el ícono/marca, disponible para usos futuros (favicon, sidebar compacto, etc.).

## Base de datos

Cambios al esquema (`src/db/schema.ts`) generan una nueva migración:
```
npm run db:generate
npm run db:migrate
```

## Despliegue en producción

Nginx como reverse proxy + Certbot para SSL (mismo patrón que `web.connect24.io`), pero aquí Nginx hace `proxy_pass` hacia la app en Docker (puerto interno `127.0.0.1:3001`, reservado en `/opt/apps/PORTS.md`) en vez de servir archivos estáticos. Corre como un proyecto Docker Compose separado del de desarrollo (`-p go-app-prod`), con su propio `.env.production` (no versionado) y su propia base de datos (`go-postgres-prod`, sin puerto publicado al host).

Para actualizar tras un cambio:
```
git pull
docker compose -p go-app-prod --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Si el cambio agrega una migración nueva:
```
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i go-postgres-prod psql -U go_app -d go_db < drizzle/migrations/<archivo>.sql
```

El bloque de Nginx para `go.connect24.io` y el certificado SSL (Certbot) ya están configurados en el servidor.
