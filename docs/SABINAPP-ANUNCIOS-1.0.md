# Sabinapp 1.0 - Sistema local de publicidad

Última sincronización documental: 2026-09-15

## 1. Propósito

Sabinapp permite campañas publicitarias locales moderadas y administradas dentro de la plataforma.

El objetivo de Sabinapp 1.0 no es construir una red publicitaria compleja, sino ofrecer una primera herramienta comercial controlable para negocios locales.

---

## 2. Reglas generales

- toda campaña requiere revisión administrativa;
- el anunciante no puede autoaprobar una campaña;
- el anunciante puede reportar un pago, pero no verificarlo;
- no existe cobro automático en Sabinapp 1.0;
- no mostrar publicidad en autenticación ni paneles administrativos;
- no aceptar scripts, HTML o iframes arbitrarios del anunciante;
- el administrador puede rechazar, pausar o archivar campañas;
- las campañas vencidas, rechazadas o pausadas no deben mostrarse públicamente.

---

## 3. Campaña A - Anuncio fijo

Campaña publicitaria integrada en páginas públicas de Sabinapp sin bloquear la navegación.

Reglas de formato:

- tipo interno: `fixed_banner`;
- exactamente 1 imagen por campaña;
- no admite video;
- imagen máxima: 1000 KB;
- debe identificarse claramente como publicidad o promoción;
- no reproduce sonido;
- no abre destinos automáticamente.

Páginas contempladas:

- `/`;
- `/negocios`;
- `/productos`;
- `/noticias`;
- `/clima`;
- `/negocio/[slug]`.

Una campaña activa puede aparecer también en la página pública del propio negocio anunciante.

---

## 4. Campaña B - Interstitial

Campaña emergente de alto impacto.

Reglas de formato:

- tipo interno: `interstitial`;
- puede contener de 1 a 6 imágenes;
- alternativamente puede utilizar 1 video;
- no mezcla carrusel de imágenes y video en la misma campaña;
- imagen máxima: 1000 KB;
- video máximo: 16000 KB;
- probabilidad objetivo: `0.125`, equivalente a 1/8;
- espera obligatoria antes de cerrar: 10 segundos;
- cooldown configurado: 30 minutos.

No existe un máximo de interstitials por sesión como regla de producto.

Campaña B continúa deshabilitada mientras `interstitial_enabled = false`.

Su activación pública requiere una decisión explícita después de pruebas funcionales y de UX.

---

## 5. Estados de campaña

El enum `ad_campaign_status` contiene:

- `draft`;
- `pending_review`;
- `approved`;
- `active`;
- `paused`;
- `expired`;
- `rejected`;
- `archived`.

La existencia de un estado no significa que cualquier usuario pueda establecerlo directamente.

Las transiciones sensibles deben pasar por las operaciones autorizadas correspondientes.

---

## 6. Tablas actuales

El módulo utiliza actualmente:

- `ad_campaigns`;
- `ad_assets`;
- `ad_payments`;
- `ad_impressions`;
- `ad_clicks`;
- `ad_settings`.

Estas tablas ya existen; no deben describirse como infraestructura futura.

---

## 7. Flujo del anunciante

El flujo actual contempla:

1. crear una solicitud;
2. editarla mientras corresponda;
3. enviarla a revisión;
4. recibir aprobación, rechazo o solicitud de cambios;
5. reenviar después de correcciones;
6. reportar el pago cuando corresponda;
7. esperar verificación administrativa.

El anunciante no puede verificar su propio pago.

---

## 8. Flujo administrativo

Administración puede:

- revisar campañas;
- aprobar;
- rechazar;
- solicitar cambios;
- revisar el pago reportado;
- verificar el pago;
- rechazar el pago;
- administrar el estado de la campaña según permisos.

---

## 9. Flujo de pago

El pago de publicidad permanece manual en Sabinapp 1.0.

El sistema genera y conserva una referencia de pago esperada.

El dueño puede reportar una referencia bancaria o comprobante textual según el flujo disponible.

Administración verifica o rechaza el pago.

Caso positivo validado:

- el pago queda verificado;
- la campaña puede pasar a `active`;
- se establecen fechas de vigencia según corresponda.

Caso negativo validado:

- el pago queda `rejected`;
- la campaña permanece sin activarse;
- no comienza la vigencia;
- no consume días contratados;
- se conserva el motivo administrativo.

La fase 118E-3 quedó validada funcionalmente.

---

## 10. Destino del anuncio

Una campaña puede dirigir al usuario hacia un destino permitido, como una página del negocio o un método de contacto aprobado.

La resolución de contactos debe respetar contactos válidos del negocio y las reglas del servidor.

No aceptar destinos `javascript:` ni redirecciones arbitrarias inseguras.

---

## 11. Métricas

El módulo dispone de infraestructura para:

- impresiones;
- clics;
- campaña;
- asset;
- página donde ocurrió la interacción;
- negocio relacionado cuando corresponda;
- sesión técnica para control y métricas.

Las métricas avanzadas quedan fuera del cierre inmediato del módulo básico.

---

## 12. Seguridad y moderación

No permitir:

- scripts del anunciante;
- HTML personalizado;
- iframes arbitrarios;
- URLs `javascript:`;
- redirecciones sospechosas;
- fraude;
- anuncios engañosos;
- contenido prohibido por las reglas de Sabinapp;
- exposición de datos privados.

La interfaz no debe ser la única barrera de seguridad.

RLS, servidor, RPC, ownership, roles y estados deben proteger las operaciones sensibles según corresponda.

---

## 13. Configuración pendiente de sincronización

PostgreSQL todavía conserva algunos valores anteriores en `ad_settings`.

Las decisiones actuales requieren sincronizar posteriormente:

- Campaña A a exactamente 1 asset de imagen;
- máximo de imagen publicitaria a 1000 KB;
- máximo de video publicitario a 16000 KB;
- eliminación del máximo por sesión como regla utilizada por producto.

No es obligatorio eliminar columnas antiguas si dejan de utilizarse.

Campaña B debe permanecer deshabilitada durante esta sincronización.

---

## 14. Fase 118E-4

118E-4 se define como la fase de alineación de assets y límites publicitarios.

Debe comprobar y sincronizar:

- PostgreSQL;
- RPC y funciones relacionadas;
- validaciones de servidor;
- formularios del dueño;
- panel administrativo;
- render público;
- límites de archivos;
- comportamiento de Campaña A y Campaña B.

Campaña B no se activa públicamente como parte automática de 118E-4.

---

## 15. Estado actual

La infraestructura principal de publicidad, revisión y pagos ya existe.

118E-3 está completada y validada.

118E-4 queda pendiente para sincronizar las nuevas reglas de assets y tamaños.

Campaña A es el formato de menor riesgo UX y debe mantenerse como prioridad de lanzamiento.

Campaña B permanece preparada pero deshabilitada hasta completar pruebas y una decisión explícita de activación.

El estado exacto de avance debe mantenerse sincronizado con `docs/02-fases-desarrollo.md`.

No preparar despliegue público hasta cerrar los criterios pendientes de Sabinapp 1.0.
