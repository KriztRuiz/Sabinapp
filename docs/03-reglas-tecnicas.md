# Sabinapp - Reglas técnicas

## Principios

- Avanzar por fases pequeñas y verificables.
- Priorizar estabilidad antes que arquitectura perfecta.
- Separar datos, permisos, interfaces y estilos.
- No asumir rutas de archivos.
- Verificar estructura real con `find`, `ls`, `grep` o `sed` cuando haya duda.

## Validación obligatoria

Antes de cerrar una fase:

`npm run lint && npm run build`

## SQL

Cuando haya cambios de Supabase o PostgreSQL, incluir siempre SQL completo para copiar en SQL Editor.

## Estilos

- Los estilos visuales del negocio público viven separados.
- Cada modo visual debe tener archivo propio.
- Los modos actuales son classic, modern, warm, compact, elegant e impact.

## Lenguaje visible

Para usuarios, preferir:

- negocio
- negocio público
- editar negocio
- ver negocio público

Evitar en interfaz visible:

- landing
- page
- Supabase
- RLS
- tabla
- debug
- siguiente fase

## Eliminación de negocios

No implementar eliminación física directa como flujo normal.

Usar según el caso:

- ocultar
- despublicar
- archivar
- suspender
