# Contacto: bloqueo de envío y diagnóstico HTTP 400

11 octubre 2026.

## Producción: reCAPTCHA migrado
La consulta técnica a siteverify con un token sintético inválido devolvió inicialmente la exigencia de migrar la clave Classic. No se reutilizó el token pegado por el usuario, no se reenviaron sus datos ni se creó un contacto de prueba.

Con autorización explícita se habilitó la API reCAPTCHA Enterprise y se migró la clave actual al proyecto `nullpointer-716ae`. Google confirmó «Migration of NullSiteWeb succeeded». Se comprobó que mantiene tipo CHECKBOX y dominios ricardopajarocoatl.com, nullpointer-716ae.web.app y localhost. La comparación del secreto de Secret Manager con el secreto legado de la clave dio coincidencia, sin mostrar ni guardar los valores.

Tras unos minutos de propagación, la misma comprobación sintética cambió a `invalid-input-response`, resultado esperado para un token deliberadamente inválido. Ya no devuelve el bloqueo de migración. Esto no demuestra por sí solo un envío real exitoso: falta completar un CAPTCHA nuevo y enviar desde el navegador.

La migración mantiene las claves e integración existente según [documentación oficial de Google](https://docs.cloud.google.com/recaptcha/docs/migrate-recaptcha). No se cambió la validación de hostname, no se desactivó CAPTCHA ni se ampliaron dominios. La vinculación al proyecto es permanente; se informó y autorizó el posible coste al superar la cuota gratuita.

## Código local: bloqueo y feedback
- Estado reactivo `isSending`: botón «Enviando mensaje…», formulario aria-busy, fieldset deshabilitado y bloqueo de clics en CAPTCHA durante el envío.
- Aviso accesible «Enviando mensaje. Espera sin cerrar esta página».
- Protección contra dobles envíos incluso mientras la solicitud tarda.
- Error persistente en el formulario, no solo toast. HTTP 400 pide revisar campos y completar CAPTCHA; HTTP 429 pide esperar; timeout advierte que no se pudo confirmar entrega, sin afirmar falsamente que no llegó.
- Tras error conserva el mensaje y vuelve a habilitar el formulario. El token CAPTCHA se invalida/reseteará siempre porque es de un solo uso.
- Analytics no interrumpe la recuperación del formulario si falla.
- ES/EN para los nuevos mensajes. No se muestran respuestas crudas del servidor ni datos personales.

## Validación
- 10 pruebas focalizadas pasan en Chromium: componente y servicio.
- Build producción correcto.
- ESLint focalizado: cero errores y cero avisos.
- git diff --check correcto.

## Pendiente
**Los cambios visuales están locales, aún no se han hecho push ni desplegado.** La migración de reCAPTCHA sí está aplicada en Google Cloud. Publicar el frontend mediante el pipeline y comprobar un envío real con CAPTCHA recién completado. No se promete envío inmediato: incluye red, verificación y persistencia.

## Goal
Bloquear visualmente el formulario al enviar y diagnosticar HTTP 400 sin reducir seguridad.

## Instructions
Usuario autorizó migración de la clave al proyecto nullpointer-716ae tras informar vinculación y cuota/coste.

## Discoveries
Google exigía migración de reCAPTCHA Classic; el secreto almacenado sí corresponde a la clave pública. La propagación tardó minutos.

## Accomplished
Migración aplicada y verificada técnicamente; feedback/bloqueo implementado y probado localmente.

## Next Steps
Push/despliegue del frontend y validación humana de envío real.

## Relevant Files
- src/app/contact/form-contact/form-contact.component.ts/html/scss — estado de envío y feedback.
- src/app/contact/form-contact/form-contact.component.spec.ts — regresiones éxito/error/timeout/duplicados.
- src/app/contact/services/email.service.ts/spec.ts — estado HTTP tipado sin exponer respuestas.
- src/app/i18n/translations.ts — mensajes ES/EN.

## Key Learnings:
1. La clave reCAPTCHA Classic exigía migración; Google dejó de devolver ese bloqueo tras migrar y propagar.
2. El estado de envío debe ser reactivo para que el bloqueo visual se actualice además del bloqueo lógico.
3. Un timeout de cliente no demuestra que el servidor no guardó el contacto; se debe comunicar entrega incierta.
