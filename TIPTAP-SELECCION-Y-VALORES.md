# Barra Tiptap: selección y valores predeterminados

Disponible en http://127.0.0.1:4300/editor-lab → **Tiptap 3**.

- Insertar/aplicar y quitar enlaces están agrupados para permanecer juntos.
- Texto sin formato: **Arial, 16 px y blanco**, coherentes con el estilo base del editor. Ya no muestra «Tamaño» como valor vacío.
- Al mover el cursor o seleccionar texto, los selectores reflejan fuente, tamaño y color; se leen las marcas del documento y los estilos heredados cuando no existen marcas explícitas.
- Si una selección contiene valores diferentes, el control correspondiente muestra **Mixto**. Elegir un valor lo aplica a la selección.
- Los tamaños recuperados en rem se presentan en píxeles en el selector; los valores visuales no amplían el vocabulario permitido al guardar.

## Verificación

13 pruebas aprobadas en Chromium y compilación Angular correcta. Nueva regresión: selección de Georgia/24 px/rojo, selección mixta, párrafo vacío con valores concretos y agrupación de enlaces. Se mantienen las pruebas de guardado, recuperación, lectores y sanitizado. No se realizó una nueva revisión manual del navegador integrado en este cambio.

## Alcance y siguientes pasos

Solo laboratorio experimental; sin despliegue ni modificación de Firebase o del sanitizado. Queda tu valoración visual y probar selecciones complejas antes de integrar el editor definitivo en blog y legales.

## Relevant Files

- `src/app/admin/editor-lab/tiptap-toolbar.component.ts`: lectura de selección y normalización.
- `src/app/admin/editor-lab/tiptap-toolbar.component.html`: valores y agrupación de enlaces.
- `src/app/admin/editor-lab/tiptap-toolbar.component.scss`: grupo visual de enlaces.
- `src/app/admin/editor-lab/editor-lab.component.scss`: estilo base explícito.
- `src/app/admin/editor-lab/editor-lab.component.spec.ts`: regresión de selección y valores vacíos.

## Key Learnings:

1. Los controles de formato deben mostrar los valores reales seleccionados y distinguir selección mixta de texto sin formato.
2. El usuario prefiere acciones de aplicar/quitar enlaces juntas y valores predeterminados concretos en lugar de placeholders.
