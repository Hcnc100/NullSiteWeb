# Tabla con texto; otros menús sin cambios

Restaurado **Tabla** en el control y texto junto a los iconos de sus seis acciones: insertar tabla, añadir fila/columna y eliminar fila/columna/tabla. El menú usa una lista vertical para facilitar la lectura.

Texto, Fondo y Enlace conservan sus iconos compactos. Se mantiene la apertura exclusiva de un menú a la vez.

Verificación: 21 pruebas del laboratorio aprobadas en Chromium; nueva regresión de etiquetas visibles en tabla y ausencia de texto en las acciones compactas de color. Recarga `/editor-lab`.

## Relevant Files

- `src/app/admin/editor-lab/tiptap-toolbar.component.html`: etiquetas de tabla.
- `src/app/admin/editor-lab/tiptap-toolbar.component.scss`: lista vertical.
- `src/app/admin/editor-lab/editor-lab.component.spec.ts`: regresión.

## Next Steps

Continuar la valoración del laboratorio antes de integrar el portal real.

## Key Learnings:

1. El usuario prefiere iconos y texto en las acciones de tablas, pero mantener los otros menús compactos con iconos.
