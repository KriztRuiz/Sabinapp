# Sabinapp - Pruebas manuales

## Validación base

Ejecutar:

`npm run lint && npm run build`

## Rutas públicas

Probar:

- `/`
- `/negocios`
- `/productos`
- `/noticias`
- `/tiempo`
- `/negocio/taqueria-el-primo`
- `/negocio/abarrotes-la-esquina`

Revisar:

- Textos claros.
- Sin términos técnicos visibles.
- Botones principales claros.
- Búsquedas funcionando.
- Negocios publicados visibles.
- Negocios no publicados no visibles.
- ContactHub abre y cierra.
- Contactos correctos.
- Horarios visibles.
- Ubicaciones visibles.
- Imágenes visibles.
- Productos y destacados visibles.

## Rutas de dueño

Probar:

- `/dashboard`
- `/dashboard/negocios`
- `/dashboard/negocios/new`
- `/dashboard/negocios/[businessId]/edit`
- `/dashboard/negocios/[businessId]/preview`

Revisar:

- Crear negocio como borrador.
- Editar contenido.
- Editar clasificación.
- Agregar imágenes.
- Agregar contactos.
- Agregar horarios.
- Agregar ubicaciones.
- Agregar productos o servicios.
- Cambiar modo visual.
- Enviar a revisión.
- Publicar si está aprobado.

## Rutas admin

Probar:

- `/dashboard/admin/negocios`
- `/dashboard/admin/negocios/[businessId]/preview`

Revisar:

- Ver negocios en revisión.
- Aprobar.
- Rechazar.
- Ocultar.
- Ver preview privado.

## Ruta técnica

En producción, `/dev/db-test` debe devolver 404.
