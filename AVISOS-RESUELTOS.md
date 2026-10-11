# Cuatro avisos resueltos

**Resultado local: auditoría completa con 0 avisos; 258 pruebas conservadas y correctas. Sin deploy.**

## Solución

- Retirados Karma, Jasmine, su configuración y la cadena vulnerable `braces` del árbol activo y del lock.
- Vitest **5.0.3**, proveedor Playwright **5.0.3** y Chromium real. Adaptador Angular de Analog **2.8.0**, conservando Angular **20.3.33** y el build de producción existente.
- Se descartó la primera integración con el builder experimental de Angular 20: requiere Vitest 3, que en la auditoría actual tenía avisos propios. No se dejó esa versión ni se ocultaron alertas.
- El override acotado `@angular/build.vitest: "$vitest"` alinea su peer opcional con el runner actualizado. **No usamos su builder unit-test ni su integración de Vitest 3**; `ng test` usa el adaptador de Analog, cuyos peers admiten Angular 20 y Vitest 5. La compatibilidad se verificó con instalación limpia, tipos y suite completa; no se usaron `--force` ni `--legacy-peer-deps`. Referencia: [integración de Analog](https://analogjs.org/docs/features/testing/vitest).
- Spies, mocks y rechazos convertidos a APIs Vitest; comprobación exacta de mensajes de error conservada. Restauración de spies tras cada prueba y configuración TestBed con Zone.js, destrucción de fixtures y errores por elementos/propiedades desconocidos.
- Las **58 suites y 258 pruebas** siguen ejecutándose: no se eliminaron, saltaron ni excluyeron pruebas para obtener verde. Se conservaron escenarios/assertions; no se calculó un porcentaje de cobertura antes/después.
- ESLint usa el programa TypeScript de pruebas para reconocer globals tipados. CI instala Chromium y comprueba tipos antes de ejecutar pruebas; gate completo de auditoría sigue activo.

## Verificación final

| Comprobación | Resultado |
|---|---|
| `npm ci` | Correcto, 0 avisos |
| `tsc --project tsconfig.spec.json --noEmit` | Correcto |
| Vitest + Chromium | 58 suites, 258 pruebas correctas |
| Build producción | Correcto |
| Auditoría completa del sitio | 0 avisos, incluidos desarrollo y opcionales |
| Auditoría del backend contacto | 0 avisos |
| Reglas Firestore/Storage | 94 pruebas correctas |
| Cuotas Firestore emulado | Integración correcta |
| Configuración CI/orígenes | 5 pruebas correctas |
| Backend contacto | 6 pruebas correctas |
| ESLint de 58 specs y 2 helpers | 0 errores, 81 advertencias de estilo/tipado explícito |
| YAML/gate manual, manifiesto-lock por claves/valores y diff check | Correctos |
| Marcas skip/todo/only en specs | Ninguna |

`package-lock.json` ya no contiene entradas de Karma ni braces. No se sustituyó la auditoría completa por `--omit=dev`. Cero avisos conocidos no garantiza ausencia absoluta de vulnerabilidades; el CLI Firebase descargado por npx y los servicios remotos no están cubiertos por audit del proyecto.

## Uso

```sh
npm ci
npx --no-install playwright install chromium
npx --no-install tsc --project tsconfig.spec.json --noEmit
npm test -- --watch=false
npm audit
```

Para una suite concreta: `npx --no-install vitest run src/app/admin/legal`.
El servidor de pruebas se limita a loopback; no exponerlo a Internet. La configuración Vite solo se utiliza para pruebas, no sustituye el build Angular de producción.

## Pendientes para publicar

El bloqueo de dependencias queda cerrado. Siguen pendientes integrar los cambios/workflow en GitHub, configurar production/revisores/WIF/IAM y secretos/orígenes del backend, aceptación real con CAPTCHA y móvil y aprobación editorial/CV si se van a habilitar. Ver `CAMBIOS-PREDEPLOY.md`. No se modificaron recursos remotos, usuarios ni contenido público.

## Handoff

### Goal
Resolver los cuatro avisos sin ocultarlos ni perder pruebas.
### Instructions
Mantener Angular y Firebase compartido con móvil; no desplegar automáticamente.
### Discoveries
- Vitest 3 compatible con el builder Angular 20 tenía nuevos avisos; fue necesario un adaptador compatible con Vitest actualizado.
- Karma persistía como peer opcional en el lock antiguo; hubo que regenerar resolución y validar una instalación completa seguida de npm ci.
- Audit de un lock generado aisladamente no prueba reproducibilidad: npm ci detectó inicialmente inconsistencias de hoisting chokidar, corregidas al completar instalación y regeneración.
### Accomplished
- Runner actualizado, 258 pruebas y build correctos, auditorías a cero y CI/documentación adaptados.
### Next Steps
- Configuración/aceptación remota y revisión del release manual. Las copias locales ignoradas en `.phase10-backup/` y `.vitest-migration-backup/` no forman parte del deploy; se conservaron, sin detener servidores TypeScript del editor del usuario.
### Relevant Files
- `vitest.config.ts`, `angular.json`: runner y navegador.
- `src/testing/setup.ts`, `src/testing/mock-methods.ts`: TestBed y dobles tipados.
- `src/**/*.spec.ts`: APIs Vitest y assertions preservadas.
- `package.json`, `package-lock.json`: dependencias actualizadas sin Karma/braces.
- `tsconfig.spec.json`, `eslint.config.js`: tipos y lint de pruebas.
- `.github/workflows/deploy-firebase.yml`: Chromium, tipos, suite y gates.

## Key Learnings:

1. Migrar a Vitest 3 no cerraba la seguridad actual; Analog permite mantener Angular 20 con Vitest 5 verificado.
2. Quitar Karma del manifiesto no basta si persiste como peer opcional en el lock.
3. Una auditoría limpia debe acompañarse de npm ci, tipos, todas las pruebas y build; no basta inspeccionar el lock.
