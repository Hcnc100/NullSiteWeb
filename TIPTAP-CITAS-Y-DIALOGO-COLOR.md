# Citas y diálogo de color

Prueba recargando http://127.0.0.1:4300/editor-lab → **Tiptap 3**.

- **Citas:** el botón de comillas crea un bloque de cita, no añade caracteres de comillas. Ahora se distingue mediante borde lateral, sangría y tono de texto. El estilo también se aplica al contenido de los lectores y a Kolkov.
- **Color:** sustituido el selector por un botón con muestra del color seleccionado y nombre. Abre un diálogo modal nativo con muestras de blanco, rojo, azul y verde; indica el color activo. Puedes elegir uno, cancelar o cerrar con Escape.
- La selección del texto se conserva al aplicar el color desde el diálogo. Las selecciones de colores distintos se indican como mixtas.

La paleta sigue siendo cerrada: no es todavía un selector RGB/hexadecimal libre, porque esos valores no se conservarían con la política actual. No se desactivó ni amplió el sanitizado.

## Verificación

14 pruebas del laboratorio aprobadas en Chromium y compilación Angular correcta. Nueva regresión comprueba borde y sangría de cita, apertura/cierre real del diálogo, color azul aplicado a la selección, actualización del botón y recuperación de cita/color mediante HTML seguro sin estilos libres. No se realizó una revisión visual manual adicional del navegador integrado.

## Alcance / siguientes pasos

Rama experimental, sin despliegue ni cambios en Firebase. Falta tu comparación visual y la elección final antes de integrar el editor real de blog y legales.

## Relevant Files

- `src/app/scss/_rich-text.scss`: presentación de citas en editores y lectores.
- `src/app/admin/editor-lab/tiptap-toolbar.component.ts`: paleta y acciones del diálogo.
- `src/app/admin/editor-lab/tiptap-toolbar.component.html`: botón con muestra y diálogo modal.
- `src/app/admin/editor-lab/tiptap-toolbar.component.scss`: presentación del diálogo.
- `src/app/admin/editor-lab/editor-lab.component.spec.ts`: regresión visual/funcional y recuperación.

## Key Learnings:

1. Un bloque de cita necesita estilos explícitos para distinguirse cuando el reset global elimina márgenes y decoración del navegador.
2. El usuario prefiere un botón con muestra de color y diálogo, en lugar de un selector de nombres sin muestras.
