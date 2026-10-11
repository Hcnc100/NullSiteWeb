# Cierre de los cuatro avisos

> Implementado y verificado: [AVISOS-RESUELTOS.md](AVISOS-RESUELTOS.md). Auditoría completa 0 avisos, 58 suites y 258 pruebas correctas. Lo siguiente conserva el plan previo.

Sí, puedo trabajar en resolverlos con el repositorio actual. **No necesito contraseñas, secretos ni acceso adicional a Firebase.**

Auditoría repetida: siguen cuatro avisos altos en `@angular/build`, `karma`, `chokidar` y `braces`, derivados de una sola causa: `braces`.

No basta actualizar una versión: el aviso no tenía parche publicado en la revisión anterior. La vía a evaluar es migrar el runner Karma a Vitest y eliminar la cadena afectada, **conservando las 258 pruebas y su cobertura de comportamiento**. Angular 20 instalado incluye un builder unit-test con Vitest, pero está marcado experimental; hay que verificar compatibilidad antes de sustituir el runner.

## Trabajo necesario

1. Probar el runner alternativo y su compatibilidad con TestBed, navegador, Zone.js y mocks existentes.
2. Adaptar APIs Jasmine, spies y pruebas asíncronas sin debilitar assertions ni excluir pruebas para obtener verde.
3. Retirar Karma y dependencias que queden sin uso; actualizar CI y lock.
4. Verificar instalación limpia, todas las pruebas, build y auditoría completa.

No se ocultarán alertas ni se omitirá desarrollo del gate. No puedo prometer cero avisos hasta comprobar el árbol resultante. Esta revisión no cambia el runner ni despliega.

## Handoff

### Goal
Determinar si hace falta información adicional para resolver los avisos.
### Discoveries
- Audit confirma cuatro avisos y una única causa directa, braces.
- El builder unit-test instalado admite Vitest, marcado experimental.
### Accomplished
- Identificada ruta de resolución y requisitos de validación, sin pedir credenciales innecesarias.
### Next Steps
- Ejecutar y validar la migración del runner.
### Relevant Files
- `package.json`: dependencias de Karma/Jasmine.
- `angular.json`, `src/test.ts`, `karma.conf.cjs`: configuración actual de pruebas.
- `PLAN-CIERRE-AVISOS.md`: alcance propuesto, no implementación completada.

## Key Learnings:

1. Resolver esta cadena de desarrollo no requiere acceso de producción; requiere validar una migración del runner manteniendo las pruebas.
