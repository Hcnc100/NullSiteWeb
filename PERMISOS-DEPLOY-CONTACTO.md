# Permisos aplicados al despliegue

Proyecto: `nullpointer-716ae`. Cambios IAM autorizados por el usuario y aplicados en GCP.

## Cuenta del pipeline
`github-actions-firebase@nullpointer-716ae.iam.gserviceaccount.com`

Se conservaron Hosting Admin y API Keys Viewer. Se añadieron:
- Cloud Functions Admin: despliegue y política de invocación de funciones HTTP/gen2.
- Service Usage Consumer: consulta y uso de servicios.
- Firebase Rules Admin: publicación de reglas.
- Datastore Index Admin: gestión de índices de Firestore.
- Rol personalizado `firebaseStorageDeployMetadata`: solo `firebasestorage.buckets.get`, `firebasestorage.buckets.list`, `firebasestorage.defaultBucket.get`; sin acceso a objetos.
- Service Account User **solo sobre contact-runtime**, no sobre todas las cuentas del proyecto.
- Secret Manager Viewer **solo sobre CONTACT_RECAPTCHA_SECRET y CONTACT_RATE_LIMIT_KEY**: metadatos, no lectura del valor.

No se otorgaron Owner, Editor, Secret Accessor al pipeline ni permisos de modificación IAM de todo el proyecto. Cloud Functions Admin es un rol de servicio a nivel proyecto, no está limitado solo a submitContact; el comando de release sigue acotado a la codebase contact.

## Cuenta runtime separada
Se creó `contact-runtime@nullpointer-716ae.iam.gserviceaccount.com`:
- Datastore User: operaciones de datos en Firestore. Este permiso es a nivel proyecto, no una restricción por colección; Admin SDK no queda limitado por las reglas de cliente.
- Secret Accessor únicamente sobre los dos secretos de contacto.

Se habilitó Cloud Run API, necesaria para gen2. No se cambiaron notifyEmail ni sus permisos.

## Cambio de código necesario
`functions-contact/index.mjs` especifica explícitamente contact-runtime como serviceAccount. Este cambio debe integrarse antes de reintentar el release; la versión anterior seguiría seleccionando una cuenta por defecto.

## Verificación y límites
- Comandos IAM completados correctamente; 6 pruebas de Functions correctas y diff sin errores.
- Pendiente comprobar el deploy real después del merge. No se afirma que todos los permisos de las cuentas administradas de build/service-agent estén correctos hasta ejecutar y verificar ese flujo.
- No se volvió a ejecutar la versión antigua del workflow, para evitar desplegar con una identidad runtime distinta.

Referencias: [permisos Firebase](https://firebase.google.com/docs/projects/iam/permissions), [cuenta runtime e IAM](https://docs.cloud.google.com/functions/docs/reference/iam/roles).

## Key Learnings:
1. El pipeline usa permisos de despliegue; la lectura de secretos corresponde a la cuenta runtime dedicada, no al pipeline.
2. actAs se concedió únicamente sobre contact-runtime, evitando heredar permisos de las cuentas legacy.

## Handoff
- Objetivo: añadir permisos para desbloquear el release full.
- Completado: IAM remoto, API de Cloud Run y configuración explícita del runtime, con pruebas de Functions correctas.
- Pendiente: aprobación/merge del PR y comprobación del deploy automático.
- Archivos relevantes: `functions-contact/index.mjs`; este informe documenta los cambios IAM externos a Git.
