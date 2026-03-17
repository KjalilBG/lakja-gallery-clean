# La Kja Gallery

Plataforma de galerias fotograficas premium enfocada en entrega de albumes, favoritas y descargas.

## Stack propuesto

- Next.js 15 + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Supabase para auth y base de datos
- Cloudflare R2 para almacenamiento

## Modulos contemplados

- `src/app/(admin)` panel privado
- `src/app/(client)` experiencia de cliente
- `src/app/api` endpoints internos
- `src/features/albums` dominio inicial del producto
- `prisma/schema.prisma` modelo base de datos

## Primeros pasos

1. Instalar dependencias con `npm install`
2. Copiar `.env.example` a `.env`
3. Levantar PostgreSQL o conectar Supabase
4. Ejecutar `npx prisma generate`
5. Ejecutar `npx prisma migrate dev`
6. Iniciar con `npm run dev`

## Deploy en Vercel

1. Sube este proyecto a GitHub.
2. Crea un proyecto nuevo en Vercel e importa el repo.
3. En `Settings > Environment Variables` agrega estas variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `ADMIN_EMAILS`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_ORIGINALS`
   - `R2_BUCKET_DERIVATIVES`
4. En Google Cloud agrega tambien la URL productiva:
   - origen autorizado: `https://tu-dominio.vercel.app`
   - redirect URI: `https://tu-dominio.vercel.app/api/auth/callback/google`
5. Antes del primer deploy, sincroniza Prisma contra Supabase con `prisma db push`.
6. Despliega y prueba:
   - `/`
   - `/login`
   - `/admin`
   - una galeria publica con fotos en R2

## Seguridad operativa

- Nunca subas `.env`, `.env.local` ni secretos a Git.
- Si un secreto se expone, rota primero el servicio afectado y luego actualiza Vercel y tu entorno local.
- Para Vercel usa `DATABASE_URL` en modo transaccional (`6543`) y `DIRECT_URL` en session mode (`5432`).
- Si trabajas con Supabase localmente, confirma la conectividad del pooler antes de asumir que el problema es Prisma.
- Mantén en desuso o privado cualquier repo viejo que haya contenido secretos en su historial.

## Recuperacion de datos

- Las imagenes viven en Cloudflare R2.
- La metadata principal vive en Supabase.
- Si necesitas recuperar contenido publicado, importa primero `Album` y luego `Photo`.
- Despues puedes restaurar `FavoriteSelection`, `FavoriteSelectionItem`, `Favorite`, `AlbumView` y `Download`.

## Siguiente implementacion recomendada

- Persistir favoritas en base de datos
- Agregar toasts en vez de banners
- Preparar deploy con dominio propio
- Mover ZIPs pesados a jobs en background
- Refinar experiencia movil
