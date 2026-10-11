# Editor visual de blog y legales

## Implementado

- Apertura en edición visual en blog y documentos legales, conservando HTML como opción avanzada.
- Barra compartida con iconos Font Awesome y etiquetas comprensibles: título de sección, subtítulo, párrafo, negrita, cursiva, listas y cita. El blog añade bloque de código.
- Texto y botones ES/EN, foco de teclado visible y controles bloqueados durante el guardado.
- El contenido sigue guardándose como HTML con los sanitizadores existentes; guardar borrador no publica.
- Subir una imagen del blog ya no lleva al usuario a la pestaña HTML. Se conserva el almacenamiento privado y la vista previa segura existente.

## Alcance y límites

Se reutilizó el editor existente y Font Awesome, sin nuevas dependencias. Esta es una mejora de su interfaz, no una integración de ngx-editor ni todas las funciones de la demo.

**Imágenes en legales siguen bloqueadas**, al igual que scripts y CSS arbitrario. Añadirlas de forma segura requiere definir almacenamiento y publicación antes de ampliar el sanitizador. El blog conserva imágenes privadas representadas como marcadores en la edición visual; la imagen completa se ve en la vista previa privada.

No se han incorporado colores arbitrarios, redimensionado de imágenes ni alineaciones nuevas. La barra actual conserva el comportamiento de inserción del editor existente.

## Verificación

33 pruebas de blog y legales correctas; build correcto. Se añadió además una prueba específica de la barra. Pendiente revisión visual interactiva, imágenes en documentos legales y despliegue.

## Key Learnings:
1. La edición debe presentar nombres comprensibles en lugar de etiquetas HTML, manteniendo HTML como formato persistido.
2. Blog y legales comparten barra visual, pero no comparten la política de imágenes: no debe ampliarse la superficie de HTML sin validar su publicación segura.
