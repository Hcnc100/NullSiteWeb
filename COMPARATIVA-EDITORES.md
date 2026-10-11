# Qué editor conviene a NullSiteWeb

Investigación: 11 de octubre de 2026. Comparadas seis opciones con documentación oficial y metadata del registro npm. **Mi recomendación es Tiptap 3 para la solución definitiva; Kolkov es la alternativa de integración más rápida.** Es una evaluación técnica para este proyecto, no un resultado de pruebas de integración.

## Qué necesitamos realmente

Angular 20, blog y documentos legales, HTML ya existente en Firebase y lectores móviles, múltiples títulos, fuentes/tamaños/colores, imágenes privadas, borrador separado de publicación, iconos y tema propios. No necesitamos colaboración ni servicios de IA de pago.

## Comparación

| Opción | Encaje en nuestro caso | Inconveniente decisivo |
|---|---|---|
| **Tiptap 3** | Motor extensible, núcleo MIT, esquema configurable y exportación HTML. Permite construir una barra con nuestro tema e iconos y un nodo de imagen que conserve las rutas privadas. | Es headless: hay que construir la interfaz Angular y adaptar los formatos existentes; no trae todo listo como Word. |
| **Kolkov Angular Editor 3.4.0** | Angular 20 declarado, MIT, formulario reactivo y barra lista con fuentes y formatos. El camino más corto hacia el ejemplo que compartiste. | Menor control estructural que un motor basado en esquema; su API documenta comandos basados en `execCommand`, una API obsoleta del navegador. Hay que probar selección, pegado y deshacer entre navegadores. |
| **ngx-editor** | MIT y basado en ProseMirror; buena opción Angular con barra visual. | `latest` 19.1.0 exige Angular ≥22. La versión 18.0.0 declara ≥18.2 y podría encajar, pero necesitaríamos validar una línea anterior y los controles adicionales requeridos. |
| **Quill 2 + ngx-quill** | Buen editor con colores, fuentes y tamaños; wrapper MIT. Para Angular 20 corresponde ngx-quill 28.x. | Su modelo Delta y las advertencias oficiales sobre HTML/listas añaden fricción cuando nuestro contrato persistido ya es HTML. No elegiría esta opción para migrar los legales existentes. |
| **CKEditor 5** | Editor completo e integración Angular oficial; wrapper actual declara un mínimo Angular 20.3.25, que cumple nuestro 20.3.33. | Requiere revisar GPL o licencia comercial y qué funcionalidades son premium. La licencia del wrapper no sustituye la del editor. |
| **TinyMCE** | Muy buen encaje visual con un editor clásico completo e integración Angular. | El editor tiene condiciones GPL/comerciales y configuración de licencia; no confundir la licencia MIT del wrapper con la del núcleo. Añade decisiones de licencia/operación que hoy no necesitamos. |

Fuentes por opción: [Tiptap: arquitectura y licencia](https://tiptap.dev/docs/editor/getting-started/overview), [Kolkov: configuración y comandos](https://github.com/kolkov/angular-editor), [ngx-editor](https://sibiraj-s.github.io/ngx-editor/), [ngx-quill: compatibilidad y advertencias de HTML](https://github.com/KillerCodeMonkey/ngx-quill), [CKEditor: integración Angular y configuración de licencia](https://ckeditor.com/docs/ckeditor5/latest/getting-started/installation/self-hosted/angular.html), [TinyMCE: licencia](https://www.tiny.cloud/docs/tinymce/latest/license-key/). La obsolescencia de `execCommand` está documentada en [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand); no implica que hoy deje de funcionar.

## Por qué recomiendo Tiptap para nosotros

No porque Firebase lo exija —Firebase solo almacena el contenido—, sino porque tenemos **políticas diferentes para imágenes de blog y legales, HTML heredado y necesidad de controlar exactamente qué formato se publica**. Un esquema extensible ayuda a expresar esas reglas sin seguir ampliando un editor artesanal.

Sus extensiones contemplan [tamaño de fuente](https://tiptap.dev/docs/editor/extensions/functionality/fontsize), [color](https://tiptap.dev/docs/editor/extensions/functionality/color) e [imágenes](https://tiptap.dev/docs/editor/extensions/nodes/image). La documentación de tamaño muestra que genera estilos inline: por ello también debemos adaptar los sanitizadores; instalarlo no resuelve ese problema automáticamente.

Usaría el núcleo directamente dentro de un componente Angular compartido, sin depender inicialmente de un wrapper comunitario. El contenido seguiría guardándose en los campos HTML existentes; **no obligaría a migrar Firebase ni la app móvil a JSON**. Que el campo siga siendo HTML no garantiza que el lector móvil soporte cada formato nuevo: hay que probarlo.

El núcleo abierto cubre la base requerida, sin contratar colaboración o funciones de IA. La interfaz, accesibilidad, traducciones y compatibilidad serán responsabilidad de nuestra integración.

## Qué implementaría

1. Editor compartido cargado solo en el panel: barra adaptable con Font Awesome, deshacer/rehacer, párrafo y encabezados H2–H6; el título principal permanece separado.
2. Negrita, cursiva, subrayado, listas, citas, enlaces, alineación, paleta de colores accesible y selección acotada de fuentes/tamaños.
3. HTML como salida, modo avanzado opcional y vista previa con el mismo CSS del lector público.
4. Nodo de imagen propio: rutas privadas y resolución autorizada en blog, sin guardar blobs ni base64 en Firestore. Para legales, definir primero almacenamiento y publicación antes de permitir imágenes.
5. Sanitizado compartido de formatos admitidos y renderizado seguro: no CSS arbitrario, scripts, iframes o URLs peligrosas. El esquema del editor **no sustituye** la validación de seguridad.
6. Guardado y publicación explícitos como ahora, conservando control de acceso y detección de conflictos web↔móvil.

## Prueba necesaria antes de decidir definitivamente

La recomendación queda condicionada a una prueba pequeña con documentos representativos de Firebase: títulos, tablas legales, clases existentes, listas e imágenes privadas. Tiptap no conserva automáticamente HTML arbitrario: [su documentación explica este límite](https://tiptap.dev/docs/guides/faq).

La prueba debe demostrar editar → guardar → reabrir sin pérdida silenciosa, colores/tamaños conservados, pegado seguro, deshacer, uso con teclado y pantalla pequeña, y lectura móvil. Si un documento no es compatible, no debe reescribirse ni publicarse automáticamente. Medir también el bundle del panel y ejecutar auditoría del árbol de dependencias que realmente instalemos.

## Estado y conclusión

**Elegiría Tiptap si priorizamos mantenimiento y control; Kolkov si priorizamos entregar rápido una barra completa.** No instalaría Quill para este contrato HTML ni añadiría TinyMCE/CKEditor sin resolver antes la licencia.

No he instalado paquetes ni modificado código en esta investigación. Las versiones consultadas son metadata, no una certificación de seguridad o accesibilidad. La recomendación anterior de Kolkov como candidata rápida sigue siendo válida, pero no equivale a que sea la mejor solución a largo plazo.

## Key Learnings:
1. Para NullSiteWeb se recomienda evaluar Tiptap 3 como solución definitiva por el control de esquema, HTML y nodos de imagen; Kolkov queda como alternativa rápida.
2. Instalar latest de ngx-editor o ngx-quill no es apropiado sin verificar Angular: sus versiones actuales exigen Angular 22; ngx-quill 28.x declara Angular 20.
3. Ningún editor elimina la necesidad de adaptar sanitizadores y comprobar el recorrido HTML existente, lectores móviles e imágenes privadas.
