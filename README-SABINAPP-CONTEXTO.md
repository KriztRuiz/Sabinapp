# Sabinapp - Contexto técnico

Sabinapp es un directorio local moderado de negocios de Sabinas Hidalgo, Nuevo León.

## Stack
- Next.js 16.2 App Router
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- @supabase/supabase-js
- @supabase/ssr

## Estado actual
- Base de datos Supabase creada.
- Auth funcionando.
- Recuperación de contraseña funcionando.
- Dashboard funcionando.
- Ruta pública /negocio/[slug] funcionando.
- Landing pública funcionando.
- ContactHub flotante abre/cierra opciones.
- Menú y Destacados separados.
- Panel de edición de landing creado.
- Selector visual debajo del contenido.
- SQL confirma que cambios se guardan.

## Rutas
- /auth/login
- /auth/sign-up
- /auth/forgot-password
- /auth/update-password
- /dashboard
- /dashboard/negocios
- /dashboard/negocios/[businessId]/edit
- /negocio/[slug]

## Modos visuales
- classic
- modern
- warm
- compact
- elegant
- impact

## Reglas
- Componentes llenados desde Supabase.
- Estilos visuales separados en lib/landing/styles.
- Cada modo visual en archivo propio.
- SQL siempre completo para copiar y pegar.
- Validar con npm run lint y npm run build.
