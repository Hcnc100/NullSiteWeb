# Editor enriquecido: sí, ese es el alcance adecuado

Sí: puedes tener varios títulos y subtítulos dentro del mismo documento, párrafos, listas, enlaces, colores, fuentes y tamaños. Lo que necesitas es un editor WYSIWYG completo, no solo la barra de inserción que añadí antes. Esa modificación anterior se quedó corta respecto a tu ejemplo.

## Librería propuesta

`@kolkov/angular-editor` **3.4.0** es una candidata compatible: la metadata consultada en npm declara Angular 20/21/22 y RxJS 7.8. El proyecto utiliza Angular 20. Su [documentación oficial](https://github.com/kolkov/angular-editor) contempla formularios reactivos, fuentes, clases personalizadas y configuración de la barra.

Esta revisión confirma compatibilidad declarada, no una integración ni una auditoría de seguridad del paquete instalado. No se ha instalado todavía.

## Cómo debería quedar

- Un editor visual completo compartido para blog y legales.
- Varios encabezados dentro del contenido, manteniendo el título principal del artículo/documento por separado.
- Negrita, cursiva, subrayado, listas, citas, enlaces y alineación.
- Selector de fuentes de una lista definida, tamaños acotados y colores con contraste adecuado; sin cargar fuentes remotas arbitrarias.
- HTML como formato de guardado; pestaña de código opcional, no obligatoria para editar.
- Vista previa con los mismos estilos del contenido publicado.
- Imágenes del blog conservando las rutas privadas y su flujo de publicación actual. No sustituirlo por URLs públicas ni imágenes base64 generadas por el editor.
- Imágenes en legales requieren ampliar expresamente la política y definir almacenamiento/publicación; actualmente se eliminan por seguridad.

## Lo importante para no perder formato ni seguridad

No basta con instalar el editor: los sanitizadores actuales eliminan estilos que no reconocen. Hay que actualizar editor, sanitizadores y lectores públicos conjuntamente para que colores, tamaños y fuentes sobrevivan al guardado.

Se deben aceptar solo propiedades y valores concretos, o convertirlos en clases controladas. No habilitar CSS arbitrario, scripts, iframes, URLs peligrosas ni desactivar la protección de Angular con `bypassSecurityTrustHtml`.

La integración debe comprobar la ida y vuelta editar → guardar HTML → volver a abrir → publicar, además de pegado desde otros sitios, imágenes privadas, contenido antiguo y compatibilidad móvil. Guardar seguirá sin publicar automáticamente.

## Estado

Propuesta y compatibilidad revisadas; la migración al editor completo aún no está implementada. La barra sencilla anterior sigue activa.

## Key Learnings:
1. El usuario requiere edición enriquecida real con múltiples encabezados, colores, fuentes y tamaños, no una barra que solo inserte etiquetas.
2. La metadata de angular-editor 3.4.0 declara compatibilidad con Angular 20; la integración debe preservar el sanitizado y las imágenes privadas existentes.
