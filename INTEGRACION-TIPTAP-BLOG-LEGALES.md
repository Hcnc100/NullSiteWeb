# Integración de Tiptap en Blog y Documentos legales

## Implementado
- Editor compartido en los formularios reales de Blog y Documentos legales, conservando modos HTML y vista previa.
- Barra aprobada: formato, fuentes, tamaños, colores de texto/fondo, enlaces y tablas con etiquetas comprensibles.
- HTML sanitizado al editar y recuperar; el contenido se persiste mediante los servicios existentes, sin publicar automáticamente.
- Blog: insertar imágenes mediante archivo, enlace HTTPS o pegado. Permanecen en memoria hasta guardar el borrador; entonces se suben asociadas al ID del artículo. La vista previa también permite ver las imágenes temporales.
- Recuperación de imágenes privadas con el servicio existente y revocación de las URL temporales al cerrar el editor.
- Protección contra pérdida silenciosa de estructuras legales antiguas no soportadas: editor visual de solo lectura y aviso para usar modo HTML.
- Ruta del laboratorio retirada y recursos globales de Kolkov eliminados de la aplicación publicada. Los archivos experimentales se conservan como referencia.

## Verificación
- Suite completa: 63 archivos y 297 pruebas correctas.
- Compilación de producción correcta.
- Sin referencias al laboratorio ni al emulador de pruebas en los JavaScript compilados.
- Pruebas de integración con servicios simulados: formato sanitizado, guardado explícito, protección de contenido legal antiguo y comportamiento del editor del blog.

## Límites y despliegue
- Los documentos legales tienen editor enriquecido, pero **no imágenes**: falta definir almacenamiento y publicación segura para esos archivos. No se ampliaron permisos para habilitarlas apresuradamente.
- La importación por enlace depende de CORS; cuando el origen lo bloquea, se debe descargar y seleccionar el archivo.
- Las imágenes temporales se pierden al recargar sin guardar; es deliberado para no subir archivos antes de la confirmación.
- No se han realizado escrituras de prueba en Firebase real, push ni despliegue. Antes de publicar: comprobar con una sesión administradora el ciclo guardar → cerrar → recuperar → vista pública en el entorno de destino, y verificar las reglas existentes.
- Los nuevos mensajes de imágenes están en español; queda completar su traducción al inglés.

## Key Learnings:
1. Tiptap comparte la integración real de Blog y Legal sin depender de los servicios ni identificadores del laboratorio.
2. Los archivos pegados se conservan en memoria y solo se promocionan al almacenamiento al guardar el borrador.
3. Las estructuras HTML sin representación equivalente en el esquema deben conservarse y editarse como HTML, no convertirse silenciosamente.

## Handoff
- Objetivo: integrar el editor elegido y retirar la entrada del laboratorio.
- Completado: integración, pruebas automatizadas y compilación local.
- Pendiente: validación con Firebase real, traducción de mensajes nuevos y política de imágenes legales antes de habilitarlas.
- Archivos principales: `src/app/admin/rich-editor/`, `src/app/admin/blog/`, `src/app/admin/legal/`, `src/app/models/blog-draft.ts`, `src/app/app.routes.ts`.
