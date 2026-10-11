# Fase 10 — Seguridad y publicación controlada

> Continuación implementada: [CAMBIOS-PREDEPLOY.md](CAMBIOS-PREDEPLOY.md). Dependencias actualizadas, backend antispam preparado, frontend migrado y reglas cerradas localmente. Este documento conserva el resultado inicial; consultar la continuación para el estado vigente.

Estado: **avance local; NO cerrada ni desplegada**. Fecha local: 10/10/2026.

## Implementado

- Push y PR ejecutan validación; ya no despliegan automáticamente.
- Pipeline con pruebas Angular, reglas Firestore/Storage en proyecto demo, Java 21 y build de producción.
- Despliegue separado: solo ejecución manual desde `main`, casilla de aceptación y environment `production`. OIDC está limitado al job de despliegue; las pruebas no reciben credenciales Google.
- Alcance explícito: Hosting o Hosting + reglas + índices. No despliega Functions ni publica documentos del blog.
- Gate `npm audit --audit-level=high`: actualmente **bloquea la publicación**, deliberadamente.
- Configuración generada mediante JSON, sin interpolar secretos como código shell/TypeScript. Rechaza valores obligatorios vacíos y proyecto distinto al esperado. No sobrescribí los environments locales al probar.
- `npm audit fix --ignore-scripts` redujo el informe de 34 a 33 avisos. No se usó `--force` ni `--legacy-peer-deps`.

## Hallazgos y bloqueos

### 1. Antispam incompleto — prioridad alta

`form-contact.component.ts` exige un token, pero `EmailService.sendNewEmail()` no lo envía ni verifica: escribe directamente en `emails`. Las reglas restringen campos/tamaños y lectura, pero permiten creación anónima. Un cliente puede omitir la interfaz/CAPTCHA y generar mensajes repetidamente.

No cambié estas reglas a denegar todo: rompería el contacto actual sin un backend desplegado. **El riesgo permanece abierto**, no basta añadir un temporizador o honeypot en Angular.

Implementación pendiente en el backend existente `Hcnc100/NullSiteFunctions`, referenciado en README (no incluido en este workspace):

1. Endpoint de contacto con validación de estructura/tamaños en servidor; límite de solicitudes y cuota global, timeout y respuesta genérica.
2. Verificar token con secreto en servidor, hostname permitido y éxito; rechazar token vencido/reutilizado y fallos de red. El token es de un solo uso y vence a los dos minutos según [Google reCAPTCHA](https://developers.google.com/recaptcha/docs/verify).
3. Guardar el mensaje con Admin SDK solo tras esas comprobaciones; conservar el contrato que consume el móvil y no registrar contenido/token en logs.
4. Migrar `EmailService` al endpoint y enviar token. Después cerrar creación directa de `emails` desde clientes y actualizar su prueba actual de creación anónima.
5. Probar abuso, solicitudes paralelas, token inválido/repetido, límites y caída del proveedor; habilitar alertas de costes. No guardar el secreto en Angular.

### 2. Dependencias — prioridad alta

Informe local final: **33 avisos: 29 altos, 3 moderados, 1 bajo, 0 críticos**. Son avisos de dependencias, no 33 vulnerabilidades independientes explotables en este sitio. Incluyen Angular, Firebase/grpc y herramientas de build/test.

Intenté subir conjuntamente Angular a 20.3.33 y CLI/build a 20.3.39. npm rechazó la resolución de peers (`ERESOLVE`, árbol instalado 20.3.1/20.3.2). Deshice únicamente ese cambio de versiones; manifiesto y lock vuelven a coincidir. No forcé una instalación incoherente. La corrección automática restante queda en el lock y pasó pruebas/build.

Pendiente resolver la actualización en una instalación aislada y reproducible, revisar peers de AngularFire/CDK y paquetes de herramientas, regenerar lock y repetir `npm ci`, pruebas y auditoría. No aplicar ciegamente las degradaciones mayores que propone audit para Firebase/Karma. No exponer `ng serve` a Internet mientras se revisan avisos de Vite.

### 3. Permisos y aceptación real — pendiente externo

- 90 pruebas locales de reglas pasan, incluidos visitante/usuario/admin, HTML legal, borradores, blog desactivado y recursos retirados. No demuestran qué reglas están actualmente desplegadas.
- Se conserva el mismo Firebase Auth y `admin: true`; no se creó un segundo login ni se alteraron usuarios/claims.
- No verifiqué IAM/WIF remoto, reglas desplegadas, restricciones de API key, App Check, cuotas ni protección de ramas. No se cambió configuración de producción.
- Configurar `production` con revisores y ramas permitidas; nombrar el environment en YAML **no configura por sí mismo sus protecciones**. La disponibilidad depende del plan/visibilidad según [GitHub](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
- Restringir WIF al repositorio, rama y environment esperados. Revisar permisos mínimos de la cuenta: incluir reglas/índices necesita más permisos que Hosting. No ampliar IAM automáticamente.
- CSP existente es parcial (objetos/base/framing); no es una política completa contra scripts. Una CSP estricta requiere inventario y pruebas con Angular, Firebase y CAPTCHA antes de imponerla.

## Pruebas ejecutadas

| Comprobación | Resultado |
|---|---|
| Generador CI: demo sin secretos, configuración inválida, valores tratados como datos | 3/3 |
| Angular ChromeHeadless | 254/254 |
| Reglas Firestore/Storage, proyecto demo, puertos aislados | 90/90 |
| Build de producción | Correcto |
| YAML parseado y comprobación de separación OIDC/manual | Correcto |
| Manifiesto vs lock | Coinciden |
| `git diff --check` | Correcto |

No se ejecutó GitHub Actions remoto ni un despliegue. No se certificó un `npm ci` limpio en otra máquina. El CLI Firebase conserva el pin previo 15.22.1; su cadena descargada por npx requiere revisión aparte y no está cubierta por audit del proyecto.

## Orden para cerrar y publicar

1. Resolver dependencias y lograr instalación limpia/auditoría aceptable; el gate actual no permite omitir altos/críticos.
2. Implementar y desplegar antispam backend coordinado con el frontend/reglas, sin ventana de escritura abierta ni corte accidental del formulario.
3. Configurar revisores, WIF/IAM y secrets del environment. Revisar diff de reglas antes de aplicarlas: también afectan al móvil.
4. Aceptación con cuenta real existente: admin autorizado, usuario común denegado, revocación de sesión/claim, edición web↔móvil, términos/borradores, blog oculto, ES/EN y CV. No usar datos personales reales en formularios de prueba.
5. Completar aprobación editorial y PDFs ES/EN pendientes de fase 9.
6. Ejecutar manualmente el workflow desde `main` con alcance revisado. Aplicar reglas compatibles antes de exponer funcionalidades que las requieren. Comprobar HTTP/console y operaciones autorizadas/denegadas tras publicar.
7. Conservar release Hosting y versiones anteriores de reglas/índices para recuperación. Revertir Hosting no revierte reglas ni documentos; planificar cada recuperación por separado.

## Handoff de sesión

### Goal
Avanzar fase 10 sin desplegar ni publicar contenido automáticamente.
### Discoveries
- CAPTCHA no llega al servidor; creación anónima de emails sigue permitida.
- Actualización explícita Angular encuentra ERESOLVE; no se eludieron peers.
### Accomplished
- Pipeline de validación y release manual separado; generador seguro con pruebas; auditoría y regresión local.
### Next Steps
- Resolver peers/dependencias; integrar backend antispam; configurar protecciones remotas y aceptación real.
### Relevant Files
- `.github/workflows/deploy-firebase.yml`: validación y despliegue manual condicionado.
- `scripts/ci-environment.mjs`: generación segura de configuración CI.
- `tests/ci-environment.test.mjs`: límites del generador.
- `package-lock.json`: correcciones compatibles de audit.
- `src/app/contact/services/email.service.ts`, `firestore.rules`: evidencia del riesgo pendiente; sin cambios en esta fase.

## Key Learnings:

1. Validar CAPTCHA únicamente en Angular no protege una colección con creación anónima.
2. Las pruebas de reglas del emulador no confirman permisos desplegados ni IAM.
3. Separar OIDC del job de pruebas reduce exposición; el environment necesita protecciones configuradas fuera del YAML.
