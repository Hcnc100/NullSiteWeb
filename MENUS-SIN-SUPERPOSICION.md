# Menús sin superposición

Corregido en el laboratorio Tiptap: abrir Texto, Fondo, Enlace o Tabla cierra cualquier otro desplegable de esa barra antes de abrir el nuevo.

- Clic fuera: cierra los menús.
- Escape: cierra el menú y devuelve el foco a su control.
- Clic en el campo del enlace: mantiene su menú abierto para poder escribir.
- No se modificaron Firebase, el sanitizado ni el guardado de imágenes.

## Verificación

20 pruebas del laboratorio aprobadas en Chromium y compilación Angular correcta. Nueva regresión comprueba los cuatro menús consecutivos, que solo uno esté abierto, clic dentro/fuera y Escape con retorno de foco. No se realizó nueva inspección manual del navegador integrado.

Recarga http://127.0.0.1:4300/editor-lab para probarlo.

## Relevant Files

- `src/app/admin/editor-lab/tiptap-toolbar.component.ts`: cierre exclusivo, clic exterior y Escape.
- `src/app/admin/editor-lab/tiptap-toolbar.component.html`: coordinación de activaciones.
- `src/app/admin/editor-lab/editor-lab.component.spec.ts`: regresión de menús.

## Next Steps

Continuar la valoración visual del laboratorio antes de integrar los editores reales.

## Key Learnings:

1. Los desplegables de la barra deben ser mutuamente exclusivos; el cierre con Escape debe devolver el foco al control que los abrió.
