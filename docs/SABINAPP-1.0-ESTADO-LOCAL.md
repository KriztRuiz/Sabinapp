# Sabinapp 1.0 - Estado local antes de despliegue

Última revisión local: 2026-08-30

## Estado general

Sabinapp 1.0 está estable en entorno local.

El proyecto funciona como directorio local moderado de negocios de Sabinas Hidalgo, Nuevo León, México.

Todavía no se ha preparado despliegue.

## Stack actual

- Next.js 16.2 App Router
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- @supabase/supabase-js
- @supabase/ssr
- Git Bash en Windows

## Rutas públicas validadas

Respondieron correctamente con HTTP 200:

- /
- /negocios
- /productos
- /noticias
- /tiempo
- /negocio/taqueria-el-primo

## Rutas protegidas validadas

Sin sesión, redirigen a login:

- /dashboard
- /dashboard/negocios
- /dashboard/negocios/new
- /dashboard/admin/negocios
- /dashboard/perfil

## Negocios públicos visibles

Hay 6 negocios públicos visibles:

- Climas del Norte
- Contador Ruiz
- La Esquina Abarrotes
- Panadería San José
- Taquería El Primo
- Veterinaria Chihuahua

## Negocios no públicos validados

No aparecen públicamente y sus rutas directas responden 404:

- /negocio/prueba-flujo-58a
- /negocio/venta-garage-solidaria
- /negocio/quinta-las-palmas
- /negocio/famenor

## Seguridad y permisos

Validado:

- RLS activo en tablas sensibles.
- Crear negocios requiere perfil completo.
- Editar negocios requiere perfil completo.
- Comentar noticias requiere perfil completo.
- Publicar reseñas requiere perfil completo.
- Reportar reseñas requiere perfil completo.
- Reportar comentarios de noticias requiere perfil completo.
- has_permission() sólo concede permisos a perfiles activos.
- has_role() sólo concede roles a perfiles activos.
- is_profile_complete() centraliza la validación de perfil completo.
- is_adult_verified se sincroniza automáticamente desde birthdate.

## Comentarios, reseñas y reportes

Validado:

- Reseñas públicas en negocios.
- Comentarios públicos en noticias.
- Reportes de reseñas.
- Reportes de comentarios de noticias.
- Moderación admin de reportes.
- Los reportes no ocultan automáticamente contenido.
- Los nombres públicos son mínimos.

Ejemplos:

- Cristian Ruiz Cobos -> Cristian R.
- Sin nombre -> Usuario local.

## Limpieza de datos pre-1.0

Validado:

- 0 perfiles incompletos.
- 0 perfiles con mayoría de edad interna desincronizada.
- 0 reportes pendientes.
- Negocios hidden/archived no aparecen en home ni búsqueda.
- Drafts demo no aparecen en home ni búsqueda.
- Taquería El Prima fue corregido a Taquería El Primo.

## Validación técnica final

Últimos comandos ejecutados correctamente:

- npm run lint
- npm run build

Resultado:

- Compilación exitosa.
- TypeScript sin errores.
- 19 rutas estáticas generadas; /dev/db-test quedó como ruta dinámica bloqueada en modo producción local.
- Proxy activo.
- Estado Git limpio.

## Pendiente antes de despliegue

Antes de preparar despliegue, confirmar explícitamente:

- Dominio o subdominio a usar.
- Proyecto destino en Vercel u otro hosting.
- Variables de entorno productivas.
- Configuración final de Supabase Auth URLs.
- Revisión de datos demo que se quieran conservar o eliminar.
- Prueba final en navegador después del build productivo.

No preparar despliegue sin confirmación explícita.

## Actualización final de endurecimiento local

Fecha de actualización: 2026-08-31

Después de la revisión inicial del estado local, se aplicaron ajustes finales antes de considerar Sabinapp 1.0 congelado localmente.

### Dependencias y entorno

- Next.js actualizado a 16.3.3.
- eslint-config-next actualizado a 16.3.3.
- npm audit quedó en 0 vulnerabilidades.
- package.json declara engines:
  - node >=20.9.0
  - npm >=10

### Seguridad local y rutas de desarrollo

- /dev/db-test quedó forzada como ruta dinámica.
- /dev/db-test responde 404 en modo producción local usando npm run start.
- Las rutas públicas principales siguen respondiendo 200.
- Las rutas protegidas redirigen a login cuando no hay sesión.

### Datos públicos

Auditoría final de datos públicos:

- Negocios públicos visibles: 6
- No publicados con banderas públicas: 0
- Adultos visibles por error: 0
- Expirados visibles por error: 0
- Items activos de negocios no públicos: 0
- Items públicamente elegibles: 32
- Reseñas públicas de negocios no públicos: 0
- Comentarios públicos de noticias no activas: 0
- Noticias públicas activas: 3
- Reportes pendientes: 0

### Limpieza documentada

Se documentó la limpieza final en:

- docs/sql/sabinapp-limpieza-datos-publicos-final.sql

### Estado técnico

Últimas validaciones correctas:

- npm run lint
- npm run build
- npm run start en modo producción local
- Smoke test de rutas públicas/protegidas en modo producción local

Sabinapp 1.0 queda estable localmente antes de cualquier preparación de despliegue.

No preparar despliegue sin confirmación explícita.
