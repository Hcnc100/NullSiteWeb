# Sí, se puede corregir

Estos detalles no son motivo suficiente para descartar Kolkov.

- **Flechas de los desplegables:** el tema actual mezcla fondos oscuros con fondos blancos internos. La librería dibuja una capa `::before` sobre el lado de la flecha usando `--ae-picker-label-color`, que en nuestro laboratorio está definido como blanco. Hay que corregir esa variable, la capa y sus estados hover, foco y deshabilitado; no sustituir el editor.
- **Viñetas y numeración:** el reset global elimina el padding. Hay que restablecer sangría y marcadores dentro del editor y comprobar las listas anidadas. Si con «dos puntos» te refieres al carácter `:`, sería otro problema: necesitamos una frase de ejemplo para comprobar si desaparece al editar o al guardar.
- **Tablas:** en la captura las celdas conservan su contenido, pero faltan bordes y separación. Se resuelve con CSS acotado al contenido. Crear tablas, insertar filas/columnas y eliminarlas desde la barra es una funcionalidad distinta; requeriría controles adicionales en nuestra integración de Kolkov.

## Seguridad y comprobación

No hace falta permitir CSS arbitrario ni desactivar el sanitizado. El aspecto de listas y tablas debe venir de estilos propios de la web. Verificaríamos desplegables abiertos y cerrados, teclado, listas anidadas y tablas antes y después de guardar, recuperar y reabrir.

**Mi recomendación:** corregir estos detalles y comparar de nuevo. Kolkov sigue siendo una opción válida si prefieres su barra completa; Tiptap conserva la ventaja si necesitas controles de tablas más extensibles y mayor personalización. Esta revisión no modifica todavía el código ni acredita una nueva prueba visual.

## Key Learnings:

1. `--ae-picker-label-color` en Kolkov controla el fondo del selector y su capa lateral, no el color del texto; definirlo blanco provoca un conflicto con nuestro tema oscuro.
2. Presentar una tabla existente y ofrecer herramientas para editar su estructura son requisitos diferentes.
