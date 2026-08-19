# Sabinapp

Sabinapp es un directorio local moderado de negocios de Sabinas Hidalgo, Nuevo León, México.

El objetivo del proyecto es permitir que negocios locales registren su información, pasen por revisión manual, sean publicados en un directorio público y tengan una página pública automática en `/negocio/[slug]`.

## Stack

- Next.js 16.2 App Router
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- @supabase/supabase-js
- @supabase/ssr

## Rutas principales

Públicas:

- `/`
- `/negocios`
- `/productos`
- `/noticias`
- `/tiempo`
- `/negocio/[slug]`

Autenticación:

- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/update-password`
- `/auth/callback`

Panel:

- `/dashboard`
- `/dashboard/negocios`
- `/dashboard/negocios/new`
- `/dashboard/negocios/[businessId]/edit`
- `/dashboard/negocios/[businessId]/preview`
- `/dashboard/admin/negocios`
- `/dashboard/admin/negocios/[businessId]/preview`

Desarrollo:

- `/dev/db-test`

La ruta `/dev/db-test` responde 404 en producción.

## Funciones actuales

- Registro e inicio de sesión.
- Recuperación de contraseña.
- Panel de usuario.
- Registro de negocios como borrador.
- Edición de contenido del negocio.
- Edición de imágenes.
- Edición de contactos.
- Edición de horarios.
- Edición de ubicaciones.
- Edición de productos, servicios, menú y destacados.
- Vista previa privada del negocio.
- Envío a revisión.
- Revisión administrativa.
- Publicación de negocios aprobados.
- Directorio público de negocios.
- Vitrina pública de productos y servicios.
- Página pública automática por negocio.
- Modos visuales para el negocio público.
- Botón flotante de contacto.

## Modos visuales

Los modos actuales son:

- classic
- modern
- warm
- compact
- elegant
- impact

Cada modo visual tiene su propio archivo de estilos y su propio componente visual.

## Comandos principales

Instalar dependencias:

`npm install`

Levantar desarrollo:

`npm run dev`

Validar código:

`npm run lint`

Compilar producción:

`npm run build`

Levantar build de producción:

`npm start`

## Variables de entorno

El proyecto requiere variables de Supabase en `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No subir archivos `.env` al repositorio.

## Reglas técnicas del proyecto

- Priorizar estabilidad antes que arquitectura perfecta.
- Separar datos, permisos, interfaces y estilos.
- No eliminar negocios físicamente desde admin en el flujo normal.
- Los negocios se ocultan, archivan o despublican según el caso.
- La autorización del negocio la confirma administración, no el dueño al registrarlo.
- Los negocios temporales sólo usan fechas cuando el tipo de negocio lo requiere.
- Antes de cerrar una fase, ejecutar `npm run lint && npm run build`.

## Documentación interna

La documentación interna vive en `docs/`.
