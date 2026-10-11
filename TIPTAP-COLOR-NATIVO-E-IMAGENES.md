# Color nativo, foco e imágenes

Recarga http://127.0.0.1:4300/editor-lab y selecciona **Tiptap 3**.

## Aplicado

- El botón de color abre el selector **nativo del navegador**, con su degradado y controles disponibles en tu sistema. La barra muestra la muestra y el valor elegido; los colores nuevos ya no están limitados a las cuatro opciones del diálogo anterior.
- Colores opacos hex/RGB válidos se normalizan y guardan como clases `rt-color-hex-RRGGBB`, sin conservar CSS libre. Se mantiene la normalización histórica de los colores de la paleta anterior.
- En los lectores de blog y legales, una directiva reconstruye exclusivamente la propiedad `color` a partir de clases con seis dígitos hexadecimales verificados. Angular sigue sanitizando el HTML; no hay bypass ni estilos arbitrarios. La reapertura convierte esos tokens en el formato que entiende Tiptap.
- Eliminado el marco interior de foco: el contenedor exterior del editor pasa a resaltarse al enfocar su contenido, conservando una señal visible para teclado.

## ¿Puedes poner imágenes?

**La librería Tiptap sí lo permite, pero todavía no hay un botón de imágenes habilitado en este laboratorio.** Instalar la extensión no equivale a integrar subida, permisos y recuperación.

- **Blog:** existe una política para imágenes privadas de borradores y sus versiones publicadas en Firebase. El siguiente trabajo es conectarla al nuevo editor, con inserción, vista previa, texto alternativo, límites de archivo y recuperación tras guardar.
- **Legales:** el sanitizado actual elimina imágenes intencionalmente. Habilitarlas exige una decisión e integración específicas; no se abrió ese permiso como efecto secundario del selector de color.

## Verificación

**62 archivos / 282 pruebas aprobadas en Chromium**, compilación Angular correcta. Incluye color fuera de la paleta (`#b438c2`), estilos calculados tras recuperar en legales y vista de blog, reapertura en Tiptap, validación de entradas maliciosas, y eliminación del outline interior. La prueba automatizada del color emite el evento del input; no automatiza el diálogo nativo del sistema operativo. No se desplegó ni se escribió en Firebase de producción.

## Relevant Files

- `src/app/models/rich-text-format.ts`: normalización y tokens de color.
- `src/app/models/rich-colors.directive.ts`: aplicación de colores validados tras el sanitizado Angular.
- `src/app/admin/editor-lab/tiptap-toolbar.component.*`: selector nativo y muestra.
- `src/app/admin/editor-lab/editor-lab.component.*`: foco y vistas de recuperación.
- `src/app/terms/legal-document/legal-document.component.*`: lector legal.
- `src/app/blog/blog.component.*`: lector público de blog.
- `src/app/models/rich-text-format.spec.ts`: validación, ataques e idempotencia.

## Next Steps

Valoración visual del selector/foco. Conectar imágenes privadas del blog antes de sustituir el editor real; no habilitar imágenes en legales sin definir su política.

## Key Learnings:

1. Colores libres pueden conservarse como tokens hex estrictos y renderizarse con una única propiedad validada, sin permitir CSS arbitrario.
2. El usuario prefiere un solo contorno de foco en el editor, manteniendo una indicación accesible.
