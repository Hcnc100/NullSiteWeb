# Verificación previa al deploy

> Actualización: dependencias y antispam implementados localmente; cuatro avisos ya resueltos y auditoría completa a cero en [AVISOS-RESUELTOS.md](AVISOS-RESUELTOS.md). Quedan configuración/aceptación remota e integración del workflow. Lo siguiente conserva la auditoría anterior, no el estado actual del código.

**Resultado: todavía no listo para publicar.** Revisión de archivos locales, npm audit y metadatos GitHub, sin desplegar ni modificar configuración remota.

## Bloqueos, en orden

1. **Actualizar el workflow remoto antes de integrar funcionalidades.** `main` en `Hcnc100/NullSiteWeb` aún contiene el workflow anterior: tiene trigger push y no contiene pruebas Angular, gate audit, aceptación manual ni environment production. Las mejoras de fase 10 solo están locales. Integrar primero el workflow controlado y comprobar su ejecución; no asumir que el remoto ya impide deploy automático.
2. **Resolver dependencias.** Auditoría repetida: 33 avisos (29 altos, 3 moderados, 1 bajo). El nuevo gate bloquea release por los altos. Manifiesto y lock coinciden, pero falta actualización compatible y validar una instalación limpia con `npm ci`. No eludir con force/legacy-peer-deps.
3. **Cerrar antispam real.** `EmailService` sigue usando `addDoc` directamente y las reglas permiten creación anónima validada por campos, no por CAPTCHA. Implementar verificación/rate limiting en NullSiteFunctions, migrar frontend y cerrar escritura directa coordinadamente. Alternativa para un lanzamiento limitado: retirar temporalmente el formulario y denegar creación directa, tras revisar compatibilidad móvil; ocultarlo solamente no elimina el riesgo. Ninguna alternativa se aplicó en esta revisión.
4. **Preparar protección de producción.** API de GitHub devuelve 404 para environment `production`: no pude confirmar que exista/acceder a él. Crear o verificarlo con revisión y ramas permitidas antes del release. `main` exige una aprobación, pero la respuesta consultada no contiene status checks obligatorios y `enforce_admins` está desactivado. Revisar también rulesets antes de concluir la protección efectiva; exigir validación CI antes de merge.
5. **Verificar Firebase/WIF/IAM y reglas efectivas.** No confirmados remotamente en esta revisión. Revisar confianza WIF, permisos mínimos de la cuenta, admin claim del usuario existente y reglas/índices/Storage compatibles con el móvil. El workflow nuevo permite seleccionar alcance, pero no despliega Functions.
6. **Aceptación real y recuperación.** Probar admin/usuario común/anónimo, revocación, edición web↔móvil, términos, blog oculto, idiomas y descarga CV. Conservar versión anterior de Hosting y reglas; restaurar Hosting no restaura datos ni permisos.

## Configuración confirmada en GitHub

- Workflow remoto activo; rama por defecto `main`.
- Existen nombres de secrets requeridos por el generador: SITE_KEY, FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID y FIREBASE_APP_ID; también FIREBASE_MEASUREMENT_ID. **Solo se consultaron nombres, no valores**: falta comprobar que correspondan al proyecto y dominios correctos.
- Existe además un secret llamado FIREBASE_SERVICE_ACCOUNT; el workflow local usa WIF y no lo referencia. Revisar su uso en otros workflows antes de retirarlo/rotarlo; no se modificó.

## Pendientes editoriales, distintos de los bloqueos técnicos

- Aprobar/aplicar propuesta ES/EN y completar textos alternativos.
- Aportar/publicar PDFs CV ES/EN. No hay PDFs en `src/assets`; esto no demuestra que no existan en Storage. El estado remoto del CV sigue sin comprobar.
- Estos puntos pueden posponerse si las funcionalidades incompletas permanecen correctamente deshabilitadas; no anunciar CV/blog disponibles sin probarlos.

## Evidencia local previa, no repetida aquí

Fase 10: 254 pruebas Angular, 90 de reglas, 3 del generador y build correctos. En esta revisión se repitieron auditoría, coincidencia manifiesto/lock y comprobación del flujo de contacto; no se repitió toda la suite ni se ejecutó Actions remoto.

## Handoff

### Goal
Determinar qué falta para deploy sin publicar.
### Discoveries
- Workflow remoto no incluye todavía las protecciones locales de fase 10.
- Nombres de secrets presentes; environment production no confirmado (404).
### Accomplished
- Checklist priorizado con bloqueos confirmados y verificaciones remotas pendientes.
### Next Steps
- Integrar primero el workflow controlado; resolver dependencias y antispam; validar IAM y aceptación.
### Relevant Files
- `.github/workflows/deploy-firebase.yml`: versión controlada local pendiente de integración.
- `FASE-10-RESULTADO.md`: pruebas previas y alcance de seguridad.
- `PENDIENTES-DEPLOY.md`: estado verificado para la siguiente sesión.

## Key Learnings:

1. Las protecciones del workflow local aún no están en main remoto; no asumir que los pushes ya son solo validación.
2. La presencia de nombres de secrets no verifica sus valores ni la confianza WIF.
