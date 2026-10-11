# Selector de color libre

Sí: te refieres al selector nativo del navegador, con degradado, barra de tono y valores RGB/hexadecimal, no a un diálogo con cuatro colores. Interpreté tu ejemplo de forma demasiado limitada.

Se puede usar `input type="color"` en Tiptap sin añadir otra librería; su presentación exacta depende del navegador y del sistema operativo. El botón de la barra puede seguir mostrando el color seleccionado.

Hay que adaptar también el guardado y los lectores: actualmente solo se conservan los colores de la paleta cerrada. Añadir únicamente el selector permitiría elegir un color que luego desaparecería al recuperar el documento.

La implementación correcta debe aceptar exclusivamente un valor de color validado y normalizado, por ejemplo hexadecimal `#RRGGBB`, nunca CSS arbitrario, y trasladarlo mediante una representación segura que los lectores puedan mostrar. Deben seguir bloqueados scripts, eventos, URLs CSS y el resto de propiedades no permitidas; no se debe usar `bypassSecurityTrustHtml` ni desactivar el sanitizado.

Antes de darlo por terminado habría que comprobar elección de un color fuera de la paleta, selección de texto, guardado, recuperación, reapertura y visualización en blog y legales, además de entradas maliciosas. Esta aclaración no modifica todavía la implementación.

## Key Learnings:

1. El usuario quiere un selector nativo de color libre RGB/hexadecimal, no una paleta cerrada de cuatro colores.
2. El selector libre requiere resolver la persistencia y el renderizado seguro de colores fuera de la paleta actual, no solo cambiar el control visual.
