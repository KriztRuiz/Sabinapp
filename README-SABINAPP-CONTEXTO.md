# Sabinapp - Contexto técnico

Sabinapp es un directorio local moderado de negocios de Sabinas Hidalgo, Nuevo León, México.

## Stack

- Next.js 16.2 App Router
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- @supabase/supabase-js
- @supabase/ssr
- Git Bash en Windows

## Estado actual

- Base de datos Supabase creada.
- Auth funcionando.
- Recuperación de contraseña funcionando.
- Dashboard funcionando.
- Ruta pública `/negocio/[slug]` funcionando.
- Directorio público funcionando.
- Vitrina de productos funcionando.
- Página de clima funcionando.
- Página de noticias funcionando.
- ContactHub flotante abre y cierra opciones de contacto.
- Menú y destacados separados.
- Panel de edición del negocio creado.
- Selector visual debajo del contenido.
- Cambios guardados en Supabase.
- Ruta `/dev/db-test` protegida en producción.

## Rutas principales

- `/`
- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/update-password`
- `/dashboard`
- `/dashboard/negocios`
- `/dashboard/negocios/new`
- `/dashboard/negocios/[businessId]/edit`
- `/dashboard/negocios/[businessId]/preview`
- `/dashboard/admin/negocios`
- `/dashboard/admin/negocios/[businessId]/preview`
- `/dev/db-test`
- `/negocios`
- `/productos`
- `/noticias`
- `/tiempo`
- `/negocio/[slug]`

## Modos visuales

- classic
- modern
- warm
- compact
- elegant
- impact

## Reglas

- Componentes llenados desde Supabase.
- Estilos visuales separados en `lib/landing/styles`.
- Cada modo visual debe estar en archivo propio.
- El lenguaje visible para usuarios debe usar “negocio” en vez del término técnico anterior.
- SQL siempre completo para copiar y pegar.
- Validar con `npm run lint` y `npm run build`.

## Auditoría de cambios públicos

La auditoría de cambios públicos del dueño está documentada en `docs/05-auditoria-cambios-publicos.md`.

Regla principal: el dueño puede editar un negocio publicado, pero Sabinapp registra los cambios importantes para revisión administrativa.
