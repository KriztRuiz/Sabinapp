# Sabinapp - Modelo de base de datos

## Base

Supabase con PostgreSQL.

## Tablas principales

- `profiles`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `businesses`
- `business_types`
- `categories`
- `business_settings`
- `business_media`
- `contact_methods`
- `business_hours`
- `business_locations`
- `business_items`
- `business_tags`
- `tags`
- `local_news`

## Negocios

La tabla principal es `businesses`.

Estados usados:

- `draft`
- `pending_review`
- `approved`
- `rejected`
- `published`
- `hidden`
- `suspended`
- `archived`
- `expired`

Reglas importantes:

- Un negocio público debe estar publicado.
- Un negocio adulto no aparece en el directorio general.
- Un negocio vencido no debe aparecer públicamente.
- Los negocios archivados se conservan como historial.
- No se usa eliminación física directa como acción normal de administración.

## Configuración visual

La tabla `business_settings` controla el modo visual del negocio.

Modos disponibles:

- `classic`
- `modern`
- `warm`
- `compact`
- `elegant`
- `impact`

## Contenido público relacionado

- `business_media`: imágenes.
- `contact_methods`: contactos.
- `business_hours`: horarios.
- `business_locations`: ubicaciones.
- `business_items`: productos, servicios, menú, paquetes, amenidades o destacados.
- `business_tags`: relación entre negocios y tags.
