# Decisión: Tiptap para los contenidos editables

**Elegimos Tiptap 3 con la implementación aprobada del laboratorio.** Kolkov deja de ser la alternativa elegida; su experimento puede conservarse como referencia hasta terminar la migración.

## Experiencia aprobada

- Barra compacta de iconos, tema oscuro y estados activos rojos.
- Menús mutuamente exclusivos, cierre exterior/Escape y nombres accesibles.
- Acciones de tabla con texto e iconos; otros menús compactos.
- Valores predeterminados y controles que reflejan la selección o indican formato mixto.
- Colores independientes de texto/fondo, selector nativo y restablecimiento dentro de cada menú.
- Citas visualmente diferenciadas.
- Imágenes por archivo/enlace y pegado; alineación persistente.
- Imágenes pegadas en memoria hasta guardar/borrador, con referencias privadas en Firebase después del guardado.
- HTML sanitizado y formatos recuperables en la web.

## Estado real

La elección queda confirmada. **La migración de los editores reales del portal todavía no está implementada**: blog y legales conservan su editor anterior. No se debe desplegar el laboratorio ni importar su servicio de imágenes directamente al portal: utiliza la carpeta fija de pruebas `blog-drafts/editor-lab/`.

## Integración siguiente

1. Extraer editor y barra a componentes compartidos fuera de `editor-lab`, manteniendo los comportamientos aprobados.
2. Blog: conectar contenido al formulario existente y las imágenes temporales al ID real del borrador; completar subidas antes de guardar, conservar conflictos de revisión y publicación explícita.
3. Legales: conectar el editor al formulario existente sin alterar Guardar/Publicar. Definir almacenamiento y publicación de imágenes legales antes de habilitarlas públicamente.
4. Conectar formatos/colores a todas las vistas previas y lectores; asegurar la reapertura de documentos existentes y el intercambio con la app móvil.
5. Probar guardado, errores, permisos, borradores, publicación, imágenes, accesibilidad, idiomas y adaptación a pantallas. Retirar Kolkov y excluir el laboratorio de la entrega final una vez validada la migración.

## Archivos de entrada revisados

- `src/app/admin/blog/admin-blog.component.ts` y `.html`: formulario, editor actual, guardado y publicación.
- `src/app/admin/legal/admin-legal.component.ts` y `.html`: destino de la migración legal.
- `src/app/admin/editor-lab/`: referencia experimental aprobada, no implementación final del portal.

## Key Learnings:

1. El usuario elige definitivamente Tiptap 3 con la experiencia validada en el laboratorio para los contenidos editables del portal.
2. La migración debe conservar la semántica de borrador/publicación y sustituir los identificadores fijos del laboratorio por los del documento real.
