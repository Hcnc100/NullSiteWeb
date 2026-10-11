# Laboratorio: imágenes privadas y fondo del texto

## Cómo probar

1. Recarga http://127.0.0.1:4300/editor-lab.
2. Selecciona texto y utiliza **Texto** o **Fondo**. Son controles separados, identificados por nombre y muestra. Ambos abren el selector nativo; **Sin fondo** elimina solo el fondo, sin alterar el color de fuente.
3. Abre **Insertar imagen · Firebase privado**, escribe su descripción accesible, elige el archivo y pulsa **Subir e insertar imagen**.
4. Si no estás autenticado, utiliza el enlace a `/admin/login` en el mismo origen. Se reutiliza el usuario administrador existente; no se creó otro login.
5. Guarda localmente y recupera el documento. Comprueba las imágenes en ambas vistas y usa **Volver a editar lo recuperado**.

## Qué se implementó

- Subida real mediante el servicio existente de Firebase, exclusivamente con permisos de administrador. Destino de pruebas: `blog-drafts/editor-lab/<archivo>`. **Pulsar subir sí crea un archivo privado en el proyecto Firebase configurado**, aunque el documento se guarde localmente. La página lo advierte explícitamente.
- PNG, JPEG, WebP y GIF hasta 10 MB; comprobación de decodificación, límite de 40 megapíxeles, descripción obligatoria y límite de 20 inserciones mediante el formulario.
- Tiptap inserta en la selección; Kolkov añade la imagen al final del contenido.
- HTML guardado contiene una ruta privada inerte (`data-image-path`), nunca una URL blob ni un token público de descarga. Al recuperar, se obtienen los bytes con la sesión de administrador y se muestran mediante URLs temporales.
- El lector legal admite una política de imágenes explícita **solo en el laboratorio**. Por defecto sigue bloqueándolas. Ambas vistas del laboratorio muestran los archivos privados; no se publica ningún documento por probarlas.
- Fondos opacos hex/RGB validados se conservan mediante tokens independientes `rt-background-hex-RRGGBB`. Se reconstruye exclusivamente `background-color`; scripts, URLs CSS, imágenes de fondo y otras propiedades siguen bloqueados.

## Verificación

**63 archivos / 287 pruebas aprobadas en Chromium** y compilación Angular correcta. Las pruebas nuevas verifican controles independientes, fondo recuperado/reabierto, referencia privada de imagen recuperada, URLs temporales efectivamente asignadas en ambas vistas, bloqueo de rutas externas, lector legal cerrado por defecto y rechazo de subidas anónimas o SVG.

Los tests de subida usan un servicio Firebase simulado: **no se realizó una subida real durante estas verificaciones**, no se desplegó y no se cambiaron reglas. La conexión real necesita tu sesión y los permisos existentes. No se afirma validación visual manual del diálogo nativo.

## Pendientes para integrar en el portal definitivo

- Conectar cada documento a su identificador real: el laboratorio comparte una carpeta de pruebas y no crea entradas de blog ni legales.
- Blog: integrar la publicación existente que copia imágenes privadas a una versión publicada; las vistas privadas del laboratorio no son una publicación real.
- Legales: definir y probar almacenamiento/publicación de imágenes con reglas específicas antes de permitirlas en documentos públicos. Esta prueba no abre las reglas ni hace públicas las imágenes.
- Ajustar posición de imágenes en Kolkov, edición de descripción, eliminación de referencias y limpieza de archivos de prueba. Quitar una imagen del texto no elimina el archivo en Storage.

## Relevant Files

- `src/app/admin/editor-lab/lab-images.service.ts`: subida autenticada, resolución privada y extensión Image de Tiptap.
- `src/app/admin/editor-lab/lab-images.directive.ts`: resolución de imágenes en vistas de prueba.
- `src/app/admin/editor-lab/editor-lab.component.*`: formulario, inserción, guardado y vistas.
- `src/app/admin/editor-lab/tiptap-toolbar.component.*`: Texto/Fondo y eliminación de fondo.
- `src/app/models/rich-text-format.ts`, `rich-colors.directive.ts`: tokens y presentación validada del fondo.
- `src/app/terms/legal-html.ts`, `legal-document/legal-document.component.ts`: política explícita de imágenes, deshabilitada por defecto.
- Tests del laboratorio, servicio de imágenes y formato enriquecido: regresiones.

## Key Learnings:

1. Las imágenes del laboratorio deben conservar rutas privadas y reutilizar el administrador existente; nunca generar enlaces públicos como atajo de vista previa.
2. El usuario quiere aplicar fondos al texto con un selector inequívocamente separado del color de fuente.
3. Probar imágenes legales en privado no equivale a habilitar su publicación: esta última requiere política de almacenamiento y permisos específica.
4. Angular elimina atributos data-* al renderizar innerHTML; las rutas privadas se resuelven desde una copia inerte recién sanitizada, sin restaurar atributos arbitrarios ni confiar en HTML crudo.
