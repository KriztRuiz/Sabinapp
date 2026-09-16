# Sabinapp 1.0 - Reglas técnicas del proyecto

## 1. Propósito

Este documento define las reglas técnicas y de trabajo de Sabinapp.

Debe utilizarse junto con:

- `docs/00-sabinapp-alcance-mvp-v1.md` para el alcance del producto;
- `docs/02-fases-desarrollo.md` para el estado y avance;
- `docs/04-pruebas-manuales.md` para QA.

Su objetivo es reducir errores, contradicciones y cambios innecesarios durante el desarrollo.

---

## 2. Stack actual

Sabinapp utiliza:

- Next.js 16.3.3;
- App Router;
- TypeScript;
- React;
- Tailwind CSS;
- Supabase;
- PostgreSQL;
- `@supabase/supabase-js`;
- `@supabase/ssr`.

Entorno principal:

- Windows;
- Git Bash;
- VS Code;
- Node.js;
- npm.

---

## 3. Principios de desarrollo

Durante el desarrollo se debe:

- avanzar por fases pequeñas y verificables;
- priorizar estabilidad antes que arquitectura perfecta;
- separar datos, permisos, interfaces y estilos;
- modificar sólo lo necesario;
- comprobar el estado real antes de asumir;
- evitar reabrir decisiones cerradas sin motivo concreto;
- mantener Sabinapp 1.0 enfocada en el lanzamiento.

Una refactorización no es automáticamente una mejora.

Si algo funciona y está validado, sólo debe reescribirse cuando exista una razón concreta de:

- seguridad;
- mantenimiento;
- rendimiento;
- UX;
- corrección funcional;
- simplificación comprobable.

---

## 4. No asumir rutas ni estructura

Cuando exista duda sobre archivos, rutas o imports, no se debe adivinar.

Usar herramientas como:

```bash
find app components lib -type f | sort
```

También pueden utilizarse `grep`, `sed` y `git grep` para comprobar la estructura real antes de modificar código.

---

## 5. Cambios de código

Cada cambio debe indicar:

- archivo afectado;
- objetivo del cambio;
- código exacto;
- forma de validarlo.

Evitar reemplazar archivos completos cuando un cambio localizado sea suficiente.

---

## 6. Validación obligatoria

Antes de cerrar una fase técnica ejecutar:

```bash
git diff --check
npm run lint
npm run build
git status --short
```

Una fase no se considera terminada solamente porque compile.

También debe probarse funcionalmente cuando corresponda.

---

## 7. Git

Los commits deben representar unidades funcionales comprensibles.

Evitar mezclar cambios no relacionados en un mismo commit.

Antes de un commit importante deben pasar las validaciones de la fase.

---

## 8. SQL y Supabase

Cuando haya cambios de Supabase o PostgreSQL se debe proporcionar siempre SQL completo para ejecutar en Supabase SQL Editor.

Los cambios SQL importantes aplicados manualmente deben conservarse también en `docs/sql/`.

La base de datos no debe evolucionar sin trazabilidad en Git.

## 9. Funciones PostgreSQL

Antes de reemplazar una función existente debe conocerse su definición completa.

Se deben conservar, salvo decisión explícita:

- firma;
- parámetros;
- tipo de retorno;
- lenguaje;
- configuración de seguridad;
- `search_path`;
- comportamiento existente.

## 10. Enums PostgreSQL

No asumir que un enum se comporta como `text`.

Cuando una función de texto lo requiera, realizar conversión explícita.

Ejemplo validado en 118E-3: `lower(contact_row.type::text)`.

---

## 11. Seguridad y permisos

La interfaz nunca debe ser la única barrera de seguridad.

Las acciones sensibles deben validarse mediante las capas correspondientes:

- servidor;
- PostgreSQL;
- RPC;
- RLS;
- ownership;
- roles;
- estado del recurso.

Ocultar un botón no equivale a impedir una operación.

## 12. Ownership

Cuando un recurso pertenece a un usuario debe comprobarse su propiedad antes de modificarlo.

Esto aplica especialmente a negocios, campañas, contactos, imágenes, productos y servicios.

Nunca confiar únicamente en identificadores recibidos desde el navegador.

---

## 13. Autorización de negocios

La autorización relevante de un negocio sólo puede ser confirmada por administración.

El dueño no debe poder autoaprobar dicha autorización desde el formulario.

La regla base es mantener la autorización pendiente hasta revisión administrativa.

## 14. Negocios temporales

Los campos de vigencia temporal sólo deben utilizarse cuando el tipo de negocio realmente lo requiera.

Ejemplo principal: `ocasiones_especiales`.

No pedir fechas temporales para negocios permanentes.

## 15. Eliminación de negocios

No implementar eliminación física directa como flujo administrativo normal.

Priorizar estados como:

- no publicado;
- archivado;
- suspendido;
- vencido.

La conservación de datos permite mantener:

- historial;
- métricas;
- auditoría;
- relaciones con contenido;
- evidencia administrativa.

Una eliminación física futura requerirá una fase explícita de auditoría.

## 16. Datos históricos

Los cambios de estado no deben destruir innecesariamente información útil para moderación, estadísticas, soporte o trazabilidad.

## 17. Página pública del negocio

La ruta pública principal es `/negocio/[slug]`.

Sólo deben mostrarse datos permitidos públicamente y compatibles con el estado del negocio.

## 18. Contactos públicos

Los contactos visibles deben respetar como mínimo:

- `is_active = true`;
- `is_approved = true`.

Un contacto almacenado no debe mostrarse automáticamente sólo por existir en la base de datos.

---

## 19. Menú y Destacados

Menú y Destacados son responsabilidades separadas.

El Menú lista las opciones correspondientes.

`show_price` determina si debe mostrarse el precio.

Destacados muestra únicamente elementos marcados como destacados y puede utilizar imágenes.

No volver a mezclar ambas responsabilidades.

## 20. Estilos del negocio público

Los estilos visuales deben permanecer separados de datos y permisos.

Carpeta principal: `lib/landing/styles/`.

Modos actuales:

- classic;
- modern;
- warm;
- compact;
- elegant;
- impact.

Cada modo debe vivir en su propio archivo.

## 21. Selector visual

El selector visual debe permanecer debajo de la sección donde se edita el contenido del negocio.

No moverlo sin una decisión explícita de UX.

## 22. Lenguaje visible

En la interfaz se deben preferir términos comprensibles para usuarios.

Preferir expresiones como:

- negocio;
- página del negocio;
- perfil del negocio;
- publicación del negocio;
- editar negocio;
- ver negocio.

Evitar exponer términos técnicos internos como `Supabase`, `RLS`, `RPC`, `debug`, `Server Action`, `landing` o `page` cuando no sean necesarios.

## 23. Mensajes y confirmaciones

Los mensajes deben explicar qué ocurrió y qué puede hacer el usuario después.

Las acciones sensibles deben solicitar confirmación cuando exista riesgo razonable de error humano.

Cuando una acción dependa de información escrita por el usuario, la confirmación debe mostrar el dato relevante cuando sea útil.

---

## 24. Publicidad y pagos

La publicidad es un módulo moderado.

Un dueño no debe poder activar una campaña pagada evitando revisión, pago o verificación administrativa.

El dueño puede reportar un pago, pero no verificarlo.

Un pago rechazado no debe activar la campaña, iniciar vigencia ni consumir días contratados.

Los estados relevantes deben protegerse también en servidor o base de datos.

## 25. Comentarios, reseñas y reportes

Los módulos comunitarios deben considerar autenticación, ownership, moderación, reportes y prevención de abuso.

El contenido público generado por usuarios no debe comprometer datos privados.

## 26. Noticias automáticas

La automatización de noticias no sustituye la moderación editorial.

Los candidatos deben respetar las reglas documentadas antes de convertirse en contenido público.

## 27. Rutas de desarrollo

Las rutas `/dev` no deben quedar expuestas de forma insegura en producción.

Rutas conocidas:

- `/dev/db-test`;
- `/dev/ads-test`.

Antes del lanzamiento deben estar protegidas, deshabilitadas o retiradas de producción.

## 28. Dependencias

No utilizar `npm audit fix --force` como solución automática.

Cualquier actualización forzada debe justificarse explícitamente.

Antes de agregar una dependencia revisar necesidad, mantenimiento, seguridad, compatibilidad y peso.

## 29. Warnings conocidos

El warning de hidratación relacionado con `fdprocessedid` suele provenir de extensiones del navegador.

No debe tratarse como bug de Sabinapp salvo evidencia de impacto funcional.

## 30. Caché y desarrollo local

Si `next dev` devuelve 404 para rutas existentes que compilaron correctamente, comprobar primero el estado de `.next`.

Puede limpiarse con `rm -rf .next` antes de modificar código innecesariamente.

Los problemas de proxy, túneles o `Origin` no deben confundirse automáticamente con errores de autenticación de Sabinapp.

## 31. Regla de alcance

Antes de agregar una función nueva debe preguntarse si es necesaria para lanzar Sabinapp 1.0 y generar valor local.

Si no lo es, debe considerarse post-1.0 salvo decisión explícita.

## 32. Definición técnica de fase terminada

Una fase se considera terminada cuando el comportamiento esperado está implementado, probado y documentado.

Además deben pasar `git diff --check`, `npm run lint` y `npm run build` cuando corresponda.

La compilación por sí sola no equivale a una fase terminada.
