# Sabinapp 1.0 - Auditoría de cambios públicos

## 1. Propósito

Sabinapp permite que el dueño continúe administrando un negocio publicado sin perder trazabilidad administrativa.

Los cambios públicos relevantes pueden registrarse en `business_change_events`.

La auditoría permite detectar cambios posteriores a una aprobación y facilita su revisión administrativa.

---

## 2. Información registrada

`business_change_events` puede conservar:

- negocio relacionado;
- nombre y slug como snapshot;
- actor del cambio;
- correo del actor como snapshot;
- acción realizada;
- tabla y registro afectados;
- resumen del cambio;
- `before_data`;
- `after_data`;
- estado de revisión.

---

## 3. Estados de revisión

El enum `business_change_review_status` contiene:

- `unseen`;
- `seen`;
- `explanation_requested`;
- `reverted`;
- `sent_to_review`.

`unseen` representa un cambio todavía pendiente de revisión.

`seen` representa un cambio ya observado por administración.

`sent_to_review` permite representar el regreso del negocio al flujo de revisión.

La existencia de `explanation_requested` y `reverted` en PostgreSQL no significa que sus flujos completos estén terminados en la interfaz.

---

## 4. Reglas de auditoría

El dueño puede editar información permitida de su negocio.

Los cambios relevantes no deben destruir innecesariamente el historial anterior.

Administración debe poder identificar qué cambió y quién realizó el cambio cuando esa información esté disponible.

Si un cambio compromete la validez de la publicación, el negocio puede retirarse del público y regresar al proceso de revisión.

No debe utilizarse eliminación física como solución administrativa normal.

## 5. Áreas auditables

La auditoría puede incluir:

- contenido del negocio;
- contactos;
- horarios;
- ubicaciones;
- imágenes y portada;
- menú, productos y servicios;
- configuración visual;
- otros datos públicos relacionados.

---

## 6. Revisión administrativa

La tabla permite registrar cuándo un evento fue visto o resuelto, quién realizó la acción y una nota administrativa.

Las acciones de revisión deben respetar roles y permisos también en servidor y base de datos.

## 7. Estado de implementación

La infraestructura de auditoría existe en PostgreSQL.

Cada acción debe considerarse terminada sólo cuando su interfaz y comportamiento hayan sido probados.

## 8. Pendientes posibles

- filtros por fecha, negocio o actor;
- solicitud de explicación al dueño;
- reversión administrativa asistida;
- mejor comparación entre `before_data` y `after_data`;
- estadísticas de actividad.

Estos puntos sólo son obligatorios para 1.0 cuando `docs/02-fases-desarrollo.md` así lo determine.

## 9. Conservación

Los eventos de auditoría forman parte del historial operativo y no deben eliminarse simplemente porque cambie el estado del negocio.
