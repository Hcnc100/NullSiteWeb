# Barra y menús con iconos

Recarga http://127.0.0.1:4300/editor-lab → **Tiptap 3**.

- Texto y fondo conservan sus dos controles separados, con iconos, muestra inferior de color y flecha de desplegable.
- Dentro de cada uno: paleta para elegir color y borrador para restablecerlo, sin frases largas visibles.
- Enlace y tabla usan también iconos con flecha; las acciones de tablas combinan añadir/eliminar con fila, columna o tabla.
- El formulario de enlace conserva la etiqueta de dirección necesaria para entender qué introducir; aplicar usa un icono de confirmación.
- Los controles mantienen nombres accesibles y ayudas nativas al pasar el cursor. Las acciones internas tienen al menos 44 px de alto.

## Verificación

Compilación Angular correcta y 19 pruebas de laboratorio aprobadas. La nueva regresión verifica apertura/cierre del desplegable, orden elegir/restablecer, independencia entre color y fondo y presencia de nombres, ayudas e iconos. Sin nueva inspección visual manual; sin cambios en Firebase, sanitizado o flujo de pegado.

## Relevant Files

- `src/app/admin/editor-lab/tiptap-toolbar.component.ts`: iconos y opciones de tabla.
- `src/app/admin/editor-lab/tiptap-toolbar.component.html`: controles y menús compactos accesibles.
- `src/app/admin/editor-lab/tiptap-toolbar.component.scss`: flechas, rejillas y tamaños.
- `src/app/admin/editor-lab/editor-lab.component.spec.ts`: regresión de menús.

## Next Steps

Valoración visual en el laboratorio antes de integrar la barra en los editores reales del portal.

## Key Learnings:

1. El usuario prefiere iconos compactos también dentro de los menús, con información textual secundaria mediante ayudas y etiquetas accesibles.
