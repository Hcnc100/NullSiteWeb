# Validación y despliegue automáticos

## Configurado
- PR: ejecuta validación, nunca despliega.
- Push a main (incluido merge): valida y después despliega el stack completo — backend de contacto, reglas/índices de Firestore, Storage y Hosting.
- Si la validación falla, no se ejecuta deploy.
- Ejecución manual conservada: exige aceptación explícita y permite alcance full/hosting.
- Se conservan protecciones de main, entorno production, autenticación WIF, auditorías y concurrencia sin cancelación de despliegues.

Todo push a main activa este comportamiento, no solo merges; las protecciones de la rama deben seguir controlando quién puede escribir en ella. Los cambios de reglas pueden afectar también a la app móvil y deben revisarse en cada PR. No se cambiaron reglas ni permisos con esta configuración.

## Verificado
9 pruebas de Node correctas (configuración y condiciones de release); diff sin errores. Se añadieron casos de PR, otras ramas, push a main y aceptación manual, y se incorporaron al pipeline.

## Activación
El cambio se envía en la rama `ci/automatic-main-release`. Hace falta aprobar e integrar su PR en main. Ese merge activará la nueva validación y, si pasa, el despliegue. No se afirma que Firebase ya esté actualizado: debe comprobarse el resultado del job deploy.

## Key Learnings:
1. El deploy automático necesita un alcance full explícito para push: inputs.target no existe en ese evento.
2. Las ramas de PR solo validan; main es la única referencia habilitada para release.

## Handoff
- Objetivo: automatizar validación y despliegue al integrar en main.
- Completado: workflow, pruebas de regresión y documentación.
- Pendiente: aprobación/merge del PR y comprobación de su primer despliegue.
- Archivos: `.github/workflows/deploy-firebase.yml`, `tests/release-workflow.test.mjs`.
