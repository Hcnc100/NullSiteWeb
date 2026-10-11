# Ajuste de color y navegación

Revisado con la skill `ui-styling`, aplicando sus criterios de jerarquía, consistencia y accesibilidad al SCSS existente, sin incorporar React ni Tailwind.

## Hallazgo y cambios

- El menú original define rojo puro para selección y rojo al 50 % para preselección. La modificación anterior había introducido otros tonos (`#b80000` y enlaces `#ff8585`); no eran los mismos.
- El panel ahora reutiliza el rojo al 50 % sobre su fondo oscuro para botones y pestaña activa: menos luminoso. El selector de idioma usa un granate equivalente aproximado. Es una adaptación más suave, no una copia del rojo puro seleccionado del menú público.
- Pestañas inactivas en blanco, sin subrayado. El estado activo se distingue por fondo y borde; el foco visible de teclado se conserva.
- El texto de marca deja de usar el acento rosado. Los enlaces dentro del contenido mantienen subrayado para distinguirlos del texto normal.

El mensaje de error de documentos legales visible en la captura es independiente de los estilos; no se ha diagnosticado ni corregido en este ajuste.

## Key Learnings:
1. El usuario prefiere acentos rojos menos luminosos y navegación del panel sin subrayado.
2. La fuente original contiene dos rojos: selección opaca y preselección al 50 %; deben distinguirse al adaptar el panel.
