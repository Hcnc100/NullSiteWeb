# Cambios pendientes implementados — predeploy

> Actualización vigente: los cuatro avisos quedaron resueltos mediante migración del runner. Auditoría completa a cero, instalación limpia y 258 pruebas verificadas en [AVISOS-RESUELTOS.md](AVISOS-RESUELTOS.md). El gate de dependencias ya pasa; siguen pendientes configuración, integración y aceptación remota. El resto conserva el resultado predeploy anterior.

**Estado: cambios locales preparados y probados; publicación todavía bloqueada.** No hice commit/push, deploy, cambios de usuarios, IAM ni configuración remota.

## Qué cambió

### Dependencias

- Angular 20.3.33 y CLI/build 20.3.39, conservando Angular 20 y el proyecto Firebase existente.
- Herramientas typescript-eslint 8.71.1 y override acotado de grpc-js 1.14.6 para corregir sus avisos transitivos sin degradar Firebase.
- Resolución desde un árbol limpio, sin `--force` ni `--legacy-peer-deps`. Se verificaron `npm ci` del sitio y del backend.
- Auditoría completa: **33 → 4 avisos altos**, todos de la cadena de desarrollo Karma → chokidar/braces y su propagación a Angular/build. Auditoría `--omit=dev` del sitio y auditoría completa del backend: **0 avisos**. Esto no equivale a garantizar ausencia de vulnerabilidades.
- `braces` 3.0.3 sigue sin versión corregida para [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). No oculté el aviso ni cambié el gate a omitir desarrollo. Falta migrar el runner de pruebas o incorporar una corrección mantenida/verificada cuando exista; no eliminar pruebas para retirar Karma.

### Contacto y antispam

Nuevo backend `functions-contact`, Node 22, codebase `contact`, sin cambiar el repositorio de notificaciones existente. La separación evita gestionar sus funciones desde este despliegue, siguiendo el mecanismo de [codebases Firebase](https://firebase.google.com/docs/functions/organize-functions).

- Endpoint POST JSON `/api/contact`, proxied por Hosting a `submitContact` en us-central1.
- Validación en servidor: campos permitidos, tamaños, email, origen HTTPS exacto y cuerpo máximo 8 KiB.
- Verificación de CAPTCHA en servidor con secreto, hostname exacto y timeout; rechaza errores del proveedor. Nunca guarda ni registra token/secreto.
- Cuotas transaccionales: 3 mensajes por IP y ventana fija de 10 minutos, y 30 globales por minuto. No son ventanas deslizantes; los límites pueden admitir ráfagas en los bordes de ventana. La IP se convierte en HMAC con clave secreta, sin guardarla en claro.
- Contadores con `expiresAt` y configuración TTL. El borrado TTL es asíncrono; la autorización depende de las ventanas, no de la puntualidad del borrado.
- Límites de instancias, concurrencia y timeout reducen exposición, **no constituyen un límite absoluto de gasto ni impiden todo DoS**. CAPTCHA ocurre antes de las escrituras de cuota; activar alertas y verificar volumen/costes reales.
- Mensajes se crean con campos históricos, `createdAt`, `updatedAt` y `timestamp` para el trigger móvil existente. No se modificó ni certificó ese trigger remoto.
- Reglas: denegada creación directa de `emails` desde cualquier cliente, incluido admin; lectura/edición admin existente se conserva. Contadores inaccesibles a clientes.
- Angular ya no usa `addDoc`: envía token al endpoint. Doble submit bloqueado, éxito solo ante respuesta 201 con `ok: true`, errores genéricos y token invalidado después de cada intento.
- Reinicio explícito del widget CAPTCHA: `ngx-captcha.writeValue()` es un no-op y resetear únicamente FormControl dejaba el widget marcado con un token usado.

**Cambio operativo importante:** desplegar solo las reglas cerrará el contacto viejo; desplegar solo el frontend sin backend hará fallar el envío. No existe fallback inseguro a Firestore. Revisar si algún cliente móvil crea mensajes directamente: también deberá usar el backend.

### Pipeline

- Se conservan validación en push/PR y release manual desde main con aceptación y environment production.
- Añadidos instalación/auditoría/pruebas del backend, pruebas de configuración y de cuotas en emulador.
- Release `full` por defecto: primero backend `functions:contact`, después reglas/índices/Storage/Hosting. La opción Hosting se reserva para actualizaciones posteriores, una vez migrado y verificado el backend.
- Orígenes salen de variable GitHub `CONTACT_ALLOWED_ORIGINS`, validada y serializada como dotenv; no hay dominio comodín ni secreto en Angular.
- El gate completo de audit **sigue bloqueando deploy por los 4 avisos de desarrollo**. No ejecutar manualmente otra ruta para eludirlo.

## Pruebas verificadas

| Comprobación | Resultado |
|---|---|
| Instalación limpia `npm ci`, sitio y backend | Correcta |
| Angular, ChromeHeadless | 258 correctas |
| Regresión final de contacto, tras ajuste de lint | 10 correctas |
| Reglas Firestore/Storage | 94 correctas |
| Cuotas contra Firestore emulado | Paralelismo por IP, límite global, nueva ventana y escritura atómica correctos |
| Backend: validación, CAPTCHA, orígenes, errores y persistencia | 6 correctas |
| Generadores de configuración CI/orígenes | 5 correctas |
| Build producción | Correcto |
| Lint de archivos de contacto modificados | 0 errores, 5 advertencias |
| YAML/JSON y carga del export de Functions | Correctos |
| Coincidencia manifiesto/lock, sitio y backend; diff check | Correctos |

No se simuló que Google aceptara tokens reales: las pruebas de CAPTCHA aíslan HTTP con dobles; falta integración real con proveedor y Hosting. No se probó expiración TTL real ni IAM/cloud limits en emulador. La suite completa pasó antes del ajuste equivalente `isLoaded === true`; el lint y las 10 pruebas finales de contacto sí incluyen ese ajuste.

## Qué falta, fuera del código preparado

1. **Resolver el aviso sin parche de braces** o migrar el runner manteniendo las 258 pruebas. El gate no se ha debilitado.
2. Integrar el workflow local en GitHub; el remoto anterior aún no se ha actualizado en esta sesión. Configurar/verificar `production`, revisores, ramas y checks obligatorios. No se cambiaron protecciones remotamente.
3. Configurar dos secretos de Functions mediante Secret Manager (no GitHub/frontend): `CONTACT_RECAPTCHA_SECRET` y `CONTACT_RATE_LIMIT_KEY` (clave aleatoria de al menos 32 caracteres). No proporcionar sus valores en chat ni guardarlos en Git.
4. Configurar variable del environment GitHub `CONTACT_ALLOWED_ORIGINS` con los orígenes reales HTTPS separados por comas, sin slash final; incluir solo dominios que se aceptarán. Confirmar que reCAPTCHA autoriza esos dominios y usa el site key/secret correspondientes.
5. Revisar WIF/IAM, APIs/billing requeridos por Functions v2 y permisos de acceso a secretos del runtime. No ampliar permisos a Editor por conveniencia. La cuenta previa solo estaba verificada para el flujo de Hosting, no para este backend nuevo.
6. Aceptación en entorno controlado con CAPTCHA real: envío correcto, token reutilizado/rechazado, cuotas, IP vista a través del proxy Hosting, recepción móvil y admin/no-admin. Probar también términos, blog oculto, edición móvil↔web, ES/EN y CV antes de declarar disponible cada función.
7. Aprobar traducciones y aportar PDFs CV ES/EN, o mantener funciones incompletas deshabilitadas. No se inventaron documentos ni se publicó la propuesta editorial.

### Secuencia operativa cuando estén cerrados los bloqueos

Preparar secrets/orígenes y aceptación controlada; ejecutar release manual `full`. No ejecutar `firebase deploy --only functions` desde otros repositorios sin revisar su codebase. Tras publicar, verificar endpoint, reglas y notificaciones. Si falla después del backend, revisar el estado de cada recurso: el despliegue no es una transacción global. Revertir Hosting no revierte reglas, Functions, TTL ni datos; no reabrir escritura anónima como rollback.

## Handoff de sesión

### Goal
Implementar cambios predeploy sin publicar automáticamente.
### Instructions
Mantener Firebase Auth unificado con móvil y panel privado; no publicar blog ni contenido editorial automáticamente.
### Discoveries
- El ERESOLVE previo desapareció al resolver el árbol completo limpio.
- Los cuatro avisos restantes derivan de un único advisory sin parche de braces, solo en desarrollo.
- El widget CAPTCHA no responde a writeValue; requiere reset explícito.
- Trigger remoto histórico requiere campo timestamp en mensajes.
### Accomplished
- Dependencias actualizadas y reproducibles, backend antispam, cuotas atómicas, migración frontend, reglas cerradas, TTL y pipeline con pruebas.
### Next Steps
- Cerrar advisory/migración de runner; configuración remota y secretos; aceptación real; integración y release manual revisado.
### Relevant Files
- `package.json`, `package-lock.json`: árbol actualizado.
- `functions-contact/`: endpoint, validación, CAPTCHA, cuotas y pruebas; lock independiente.
- `src/app/contact/`: transporte HTTP, token, widget y regresiones.
- `firestore.rules`, `firestore.indexes.json`: escritura server-only y TTL.
- `firebase.json`: codebase y rewrite.
- `.github/workflows/deploy-firebase.yml`, `scripts/contact-config.mjs`: gates y configuración.

Copia local previa en `.phase10-backup/` (ignorada por Git), incluida la instalación antigua; el intento de limpieza fue bloqueado por la política del entorno y no se reintentó por otra vía. No es parte del despliegue.

## Key Learnings:

1. Resolver Angular desde un árbol limpio evitó forzar peers y permitió verificar npm ci reproducible.
2. CAPTCHA debe verificarse antes de persistir; cuota y creación del mensaje deben compartir transacción.
3. La codebase contact conserva independientes las funciones móviles; el campo timestamp mantiene su contrato histórico.
4. Resetear un FormControl no reinicia ngx-captcha: su writeValue es un no-op.
