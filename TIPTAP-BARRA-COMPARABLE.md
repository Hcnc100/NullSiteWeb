# Tiptap: barra compacta para comparar con Kolkov

En http://127.0.0.1:4300/editor-lab selecciona **Tiptap 3**. Conservamos Kolkov y sus ajustes, sin elegir todavía el editor definitivo.

## Añadido

- Barra compacta con FontAwesome, fondo oscuro, estados activos rojos y etiquetas accesibles.
- Deshacer/rehacer, negrita, cursiva, subrayado, tachado, listas, alineación, citas, código, separador y quitar formato.
- Desplegables de títulos 2–6, fuentes, tamaños y colores de la lista segura.
- Insertar y quitar enlaces con validación de direcciones.
- Menú de tablas: insertar, añadir/eliminar filas y columnas y eliminar tabla.
- Controles deshabilitados cuando no corresponden, foco visible y adaptación de la barra mediante salto de línea.

No es una copia exacta: emplea selectores nativos y limita colores, tamaños y fuentes a los que se conservan al guardar. No incorpora resaltado de fondo, fuentes arbitrarias, imágenes, vídeos ni otros formatos que la política actual no permite. Imágenes privadas siguen siendo un trabajo separado. La elección de Kolkov sigue abierta según tu comparación visual.

## Verificación

- 12 pruebas del laboratorio aprobadas en Chromium: incluyen los dos editores y el guardado, recuperación y lectores públicos.
- Nuevas pruebas: botón de subrayado, fuentes/tamaños/colores conservados sin CSS libre, rechazo de enlaces ejecutables y operaciones de tablas.
- TypeScript de aplicación y compilación Angular aprobados antes del último ajuste pequeño de normalización del valor de los selectores al reabrir.
- La comprobación adicional en el navegador integrado quedó bloqueada por un fallo de conexión con la pestaña; no se afirma revisión visual manual completa. Puedes verla recargando el laboratorio.

## Alcance

Solo rama experimental y laboratorio. Sin despliegue, cambios en Firebase ni sustitución del editor real de blog o legales. Sanitizado intacto.

## Relevant Files

- `src/app/admin/editor-lab/tiptap-toolbar.component.ts`: comandos, selección activa y validaciones.
- `src/app/admin/editor-lab/tiptap-toolbar.component.html`: barra y menús.
- `src/app/admin/editor-lab/tiptap-toolbar.component.scss`: tema y adaptación.
- `src/app/admin/editor-lab/editor-lab.component.*`: integración y pruebas.

## Key Learnings:

1. La preferencia actual del usuario es Kolkov por su barra; Tiptap solo se elegirá si su experiencia visual resulta comparable.
2. La barra Tiptap debe ofrecer el vocabulario de formato admitido por el sanitizado para evitar prometer estilos que desaparecerán al recuperar el contenido.
