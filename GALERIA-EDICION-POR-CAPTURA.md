# Galería editable por captura

- Eliminado el campo de URLs por líneas de la interfaz.
- Cada captura permite editar su URL HTTPS, descripción, traducciones y miniatura desde su propio detalle, con vista previa.
- Se pueden añadir capturas por URL o seguir subiendo archivos.
- “Quitar captura de la galería” retira la captura del formulario y la vista previa. Solo persiste al guardar el proyecto; no elimina el archivo de Storage ni afecta otros proyectos que lo utilicen.
- Cambiar la URL conserva los metadatos de esa captura. Se mantiene el formato compatible con la app móvil.
- Las capturas nuevas requieren una URL HTTPS válida para guardar. Máximo de 60 entradas añadidas manualmente.

## Verificación

9 pruebas dirigidas correctas y build correcto. Incluyen edición individual, conservación de metadatos, retirada sin guardado automático y bloqueo de URLs inválidas. Pendiente revisión visual interactiva y despliegue.

## Key Learnings:
1. La galería se administra mediante detalles individuales con imagen, no mediante un textarea de URLs.
2. Quitar una captura es una edición del proyecto con guardado explícito, no un borrado físico de Storage.
