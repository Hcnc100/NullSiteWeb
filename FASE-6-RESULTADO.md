# Fase 6 — Accesibilidad y responsive

**Estado: implementada y verificada localmente. Sin despliegue ni escrituras en Firebase.**

Se conserva la identidad visual negra/roja. Esta fase no modifica el lector de términos, la sanitización de HTML, el editor administrativo, las reglas Firebase ni la autenticación. Esos cambios permanecen en las fases siguientes.

## Cambios realizados

### Diálogos y galerías accesibles

- Proyectos y ampliación de imágenes utilizan Angular CDK, dependencia ya instalada, en lugar de los diálogos/activadores anteriores para estos flujos públicos.
- Diálogos con nombre, `role="dialog"`, `aria-modal`, foco inicial en el título, recorrido de foco contenido, cierre mediante Escape y devolución del foco al disparador.
- Botón de cierre etiquetado y de 44×44 px.
- Galería con botones nativos, miniaturas mayores sin deformación y visor compartido con controles Anterior/Siguiente, descripción y contador anunciado.
- Se usan las descripciones existentes en `galleryItems` cuando están disponibles; en datos históricos se muestra aplicación + número de captura. Las descripciones editoriales completas siguen siendo una tarea de contenido.
- Enlaces del detalle envuelven a otra línea; el diálogo tiene altura máxima y desplazamiento propio.
- Los nuevos controles se traducen a ES/EN. Solo se incluyen URL HTTPS en las galerías ampliadas.

### Contacto

- Superficie clara con colores explícitos, en lugar de texto blanco heredado sobre fondo claro.
- Contraste calculado del texto principal: **16.10:1**; texto de campos **17.53:1** y errores sobre tarjeta **6.04:1**.
- Etiquetas visibles vinculadas a sus campos, ayuda/contador mediante `aria-describedby`, estados `aria-invalid` y autocompletado de nombre/correo.
- Errores expuestos como alertas; el color no es la única señal de error.
- Formulario y tarjeta sin alturas rígidas que recorten contenido. Distribución de una columna hasta 900 px y dos columnas en escritorio.
- reCAPTCHA compacto para caber en pantallas estrechas. No se resolvió ningún CAPTCHA ni se enviaron mensajes durante las comprobaciones.

### Estructura y composición

- Un H1 por página en inicio, habilidades, proyectos, certificados y contacto; categorías y tarjetas con niveles subordinados.
- Inicio apilado hasta 900 px y con espaciado específico de tableta, manteniendo el límite de ancho de escritorio.
- Banda de títulos de proyectos alineada con el ancho completo de su imagen.
- Certificados con proporción reservada y `object-fit: contain`, miniaturas más legibles y ampliación operable por teclado.
- Iconos decorativos de habilidades ocultos del árbol accesible; el nombre sigue siendo texto visible.

## Verificación realizada

| Comprobación | Resultado |
|---|---|
| Pruebas Angular focalizadas | **23 aprobadas**. |
| Regresión Angular completa | **160 aprobadas** en ChromeHeadless. |
| Build de producción | Aprobado; bundle inicial aproximado de 1.44 MB. |
| ESLint de las áreas afectadas | Cero errores y 35 advertencias; no es un lint libre de advertencias. |
| `git diff --check` | Aprobado. |
| Responsive | 30 combinaciones: cinco secciones × seis anchos, sin desbordamiento horizontal y con un H1 por página cargada. |
| Teclado del proyecto DogeDex | Foco inicial dentro; 13 pasos de Tab sin escapar; Escape devuelve foco a DogeDex. |
| Visor anidado de capturas | Seis pasos de Tab dentro del visor; Escape vuelve a su miniatura sin cerrar el detalle. |
| Certificados | Los 14 cargaron en navegador; miniaturas conservan proporciones y el visor muestra descripción/contador. |
| Salto al contenido | Tab + Enter mueve el foco a `main-content`. |
| Movimiento reducido | Emulación `prefers-reduced-motion: reduce` respetada por la animación de inicio. Emulación restaurada. |
| Inglés | Comprobados `Close`, `Enlarge image` y `Screenshot` en el detalle real. |

Matriz: inicio, habilidades, proyectos, certificados y contacto, con datos públicos de Firebase, en **320, 390, 768, 1024, 1440 y 1920 px** de ancho. Altura de matriz: 900 px; comprobaciones visuales adicionales en tableta/escritorio y diálogo móvil. No equivale a probar todos los dispositivos o contenidos posibles.

Los tests nuevos cubren semántica/foco/restauración del diálogo, nombres de galería, exclusión de URL inseguras, límites del visor, galería vacía, campos asociados a etiquetas/ayuda/errores y dimensiones/alternativa de certificados. Los tests de contacto sustituyen reCAPTCHA por un componente de prueba sin red y no envían correos.

## Pendientes y límites de aceptación

1. Validación humana con lector de pantalla y zoom real al 200 %, además de pruebas en dispositivos físicos. La matriz estrecha no sustituye una prueba de zoom ni una certificación WCAG.
2. **reCAPTCHA muestra que el host local no está autorizado para la clave actual.** No se cambiaron claves ni dominios. Validar en el dominio permitido o configurar una clave de desarrollo separada; queda pendiente el envío real del formulario.
3. En la revisión visual, el certificado etiquetado “Kotlin - Introducción a la programación” muestra texto de “Máster en Hacking con Python”. Revisar su asociación en Firebase durante la fase de contenido; no se corrigieron datos productivos.
4. Completar traducciones editoriales y alternativas descriptivas de capturas, portadas independientes y miniaturas optimizadas en fase 9. Esta fase mejora presentación, no genera ni reemplaza assets en Storage.
5. El portal autenticado no se probó con credenciales reales. No se hicieron cambios en permisos, reglas o cuentas.
6. Continúan los pendientes de dependencias, antispam y pipeline de `PENDIENTES-VERIFICADOS.md`. No se ejecutaron Emulator tests porque esta fase no cambia reglas ni flujos de persistencia.

## Próxima fase

**Fase 7: presentación legal y HTML seguro**, manteniendo las URL actuales y evitando que HTML pegado afecte otras secciones. Después, fase 8 incorporará creación/edición de documentos legales al portal.

## Archivos relevantes

- `src/app/share/image-viewer/`: visor compartido, configuración de diálogo y pruebas.
- `src/app/projects/projects/`, `project-details/`, `img-details-project/` y `card-project/`: diálogos, teclado, encabezados, galería y tarjetas.
- `src/app/certificate/`: miniaturas proporcionadas, botones y visor accesible.
- `src/app/contact/`: contraste, composición, etiquetas y errores asociados.
- `src/app/profile/profile/profile.component.scss`: breakpoint y espaciado de tableta.
- `src/app/skills/`: encabezados e iconos decorativos.
- `src/app/i18n/translations.ts`: nombres de nuevos controles ES/EN.
- `src/styles.scss`: superficies de diálogo y utilidad de texto visualmente oculto.

## Key Learnings:

1. Angular CDK ya instalado resuelve foco inicial, contención, Escape y restauración en los diálogos públicos; se verificó también el retorno desde un visor anidado.
2. Contacto necesita colores y `color-scheme` explícitos para su superficie clara, porque el tema global oscuro producía texto blanco poco legible.
3. Los certificados requieren `contain` y reserva de proporción, no forzar la imagen a llenar un rectángulo deformándola.
4. La clave reCAPTCHA actual rechaza el host local; la aceptación del envío necesita un dominio permitido o una configuración de desarrollo independiente.
