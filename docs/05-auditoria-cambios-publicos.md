# Auditoría de cambios públicos del dueño

Sabinapp permite que el dueño edite un negocio publicado sin bloquear su operación normal.

Los cambios públicos importantes quedan registrados en la tabla `business_change_events`.

## Regla principal

- El dueño puede editar un negocio publicado.
- El administrador recibe avisos de cambios.
- El administrador puede marcar cambios como vistos.
- El administrador puede retirar un negocio del público y mandarlo nuevamente a revisión.
- Pedir explicación y deshacer cambios quedan pendientes para una fase posterior.

## Cambios registrados

- Contenido y estilo visual.
- Contactos.
- Horarios.
- Ubicaciones.
- Imágenes y portada.
- Items de menú, productos o servicios.

## Estados de revisión

- `unseen`: cambio pendiente de revisar.
- `seen`: cambio visto por administración.
- `sent_to_review`: negocio retirado del público y enviado a revisión.
- `explanation_requested`: reservado para fase posterior.
- `reverted`: reservado para fase posterior.

## Paneles relacionados

- `/dashboard`: resumen rápido para administradores.
- `/dashboard/admin/negocios`: resumen, historial, cambios pendientes y detalle por estado.

## Pendiente

- Gráficas de actividad.
- Filtros por fecha, negocio, tipo de cambio o usuario.
- Pedir explicación al dueño.
- Deshacer cambios desde el panel admin.
