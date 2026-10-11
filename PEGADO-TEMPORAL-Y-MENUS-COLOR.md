# Pegado temporal y menús compactos

## Cambio solicitado

**Ctrl+V ya no sube la imagen inmediatamente.** La imagen se valida y permanece en memoria, con una URL temporal para verla, seleccionarla y centrarla. Si se pega una imagen HTML desde una web, se intenta obtener sus bytes; eso depende de CORS, pero tampoco se suben a Firebase durante el pegado.

Al pulsar **Guardar local** o guardar el documento en el emulador, el laboratorio:

1. Identifica únicamente las imágenes temporales todavía referenciadas en ese contenido.
2. Comprueba la sesión de administrador existente y sube esos archivos a Firebase.
3. Sustituye las referencias temporales por rutas privadas persistentes.
4. Guarda el documento solo después de completar las subidas.

Si una subida falla, no se declara guardado el documento. Las imágenes quedan en memoria para reintentar. Se reutilizan las subidas ya completadas al reintentar, evitando repetirlas durante la misma sesión. Una imagen retirada antes de guardar no se sube. Recargar o cerrar sin guardar pierde los archivos temporales.

**Alcance:** esto está implementado en el laboratorio; aún no sustituye el editor real ni sus acciones de Guardar/Borrador. En el laboratorio las rutas siguen bajo `blog-drafts/editor-lab/`; al integrar el portal se debe utilizar el ID real del borrador. El botón explícito **Subir e insertar imagen** y la inserción manual por enlace conservan su subida inmediata, diferenciados del pegado temporal.

## Ajustes de la petición anterior incluidos

- Dos menús compactos con iconos: color de texto y fondo.
- En cada menú, primera opción **Elegir color…**; segunda opción **Restablecer**. Eliminado el tercer botón independiente de fondo.
- Insertar imagen por enlace HTTPS, con importación al almacenamiento privado. Si el sitio impide CORS, se indica descargar y subir el archivo; no se utiliza un proxy ni se expone un token público.
- Alinear la imagen seleccionada con los botones izquierda/centro/derecha; su alineación se conserva al guardar y reabrir.

## Verificación

**63 archivos / 291 pruebas aprobadas en Chromium**, compilación Angular correcta. Pruebas específicas de pegado sin subida, subida al guardar, exclusión de imágenes no referenciadas, reintento sin duplicar subidas completadas, alineación persistida, controles independientes y validación de enlaces. Firebase y descargas externas están simulados en esas pruebas: no se realizaron subidas reales durante la verificación.

## Pendientes

Conectar este flujo a Guardar/Borrador del blog real y a su ID, y definir la publicación de imágenes legales. Si varias subidas se completan y luego falla otra o falla el guardado del documento, pueden quedar archivos privados sin referencia; hace falta una política de limpieza antes de producción.

## Relevant Files

- `src/app/admin/editor-lab/lab-images.service.ts`: archivos temporales, subida diferida e importación por URL.
- `src/app/admin/editor-lab/editor-lab.component.*`: pegado, guardado, inserción y avisos.
- `src/app/admin/editor-lab/tiptap-toolbar.component.*`: menús y alineación de imagen.
- `src/app/models/rich-text-format.ts`, `src/app/scss/_rich-text.scss`: alineación persistente.
- Tests del laboratorio y servicio de imágenes: regresiones.

## Key Learnings:

1. El usuario requiere que las imágenes pegadas permanezcan en memoria y se suban solo al guardar o crear borrador, no al pegar.
2. Solo deben subirse archivos temporales referenciados por el contenido guardado; un fallo de subida no debe presentarse como guardado correcto.
