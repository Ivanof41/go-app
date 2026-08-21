# Go!

App interna de Connect24 para gestión de inventario y control de montajes.

**Etapa 1 (actual):** estructura base del proyecto + login funcional contra Postgres. El resto (inventario, montajes, dashboard real) se construye en etapas posteriores.

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

Colocar manualmente en `public/`:
- `logo-light.svg`
- `logo-dark.svg`

No se generan placeholders — la app ya los referencia en la pantalla de login.

## Base de datos

Cambios al esquema (`src/db/schema.ts`) generan una nueva migración:
```
npm run db:generate
npm run db:migrate
```

## Despliegue en producción

Sigue el mismo patrón que `web.connect24.io`: Nginx como reverse proxy + Certbot para SSL, pero aquí Nginx hace `proxy_pass` hacia la app en Docker (puerto interno `127.0.0.1:3001`, reservado en `/opt/apps/PORTS.md`) en vez de servir archivos estáticos.

```
docker compose -f docker-compose.prod.yml up -d --build
```

Luego, en el servidor, agregar el bloque de Nginx para `go.connect24.io` con `proxy_pass http://127.0.0.1:3001` y correr `certbot --nginx -d go.connect24.io`.
