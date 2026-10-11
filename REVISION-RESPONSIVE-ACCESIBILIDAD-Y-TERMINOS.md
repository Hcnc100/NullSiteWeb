# Revisión de interfaz, imágenes y documentos legales

Fecha: 10 de octubre de 2026. **Solo análisis: sin cambios de código, publicaciones ni escrituras en Firebase.**

## Respuesta directa sobre términos y condiciones

**Actualmente sí acepta HTML estructural, pero no estilos CSS arbitrarios.** El lector usa `[innerHTML]` con sanitización de Angular. En RunningApp encontré dos atributos `style` guardados en Firebase y ninguno permaneció en el contenido renderizado. Por tanto, pegar HTML con colores o estilos no garantiza conservar su presentación. No hay todavía un editor de documentos legales en el portal.

La mejora recomendada es permitir **formato visual y HTML seguro**, con estilos prediseñados controlados por el sitio. No desactivar la sanitización para conseguir colores o tamaños.

## Qué revisé y qué quedó fuera

- Sitio local con datos públicos reales de Firebase: inicio, habilidades, proyectos, certificados, contacto y documento legal de NurseApp.
- Matriz de 30 combinaciones: seis páginas en 390×844, 768×1024, 1024×768, 1440×900 y 1920×1080. No apareció desbordamiento horizontal del documento con el contenido cargado actual.
- Capturas y mediciones de composición, imágenes, encabezados y contraste; interacción por teclado del modal de proyectos.
- Cinco documentos públicos de `terms`; referencias públicas de imágenes de perfil, proyectos y certificados, mediante lecturas y solicitudes HTTP HEAD.
- No es una certificación WCAG ni una prueba completa de todos los estados. Falta validar zoom al 200 %, lectores de pantalla, todos los diálogos y formularios, contenido extremo y el portal con una sesión administrativa real. No se inventarió todo Storage, archivos privados ni archivos huérfanos.

## Hallazgos prioritarios

| Prioridad | Hallazgo verificado | Mejora propuesta |
|---|---|---|
| Alta | Al abrir DogeDex, el foco permanece en la tarjeta; Tab salta a Archipelago detrás del modal. El contenedor no expone `role="dialog"`, nombre ni `aria-modal`; la × no aparece como botón accesible. Escape cierra, pero no devuelve el foco al origen. | Diálogo accesible: foco inicial dentro, fondo inerte, recorrido contenido, cierre etiquetado y retorno al disparador. |
| Alta | En contacto, texto blanco sobre tarjeta #ddd: contraste aproximado 1.36:1. Placeholder #757575 sobre #3b3b3b: 2.43:1. | Unificar superficies y colores; etiquetas visibles permanentes, además de los nombres accesibles que ya existen. |
| Media | Habilidades, proyectos, certificados y contacto no presentan H1; NurseApp presenta dos. | Un H1 descriptivo por página y jerarquía H2/H3 coherente dentro del contenido. |
| Media | Certificados se fuerzan a 150×120 con `object-fit: fill`, aunque sus proporciones originales son distintas. | `contain`, proporción conservada y apertura accesible del original. |
| Media | Galería de DogeDex: nueve capturas a 50 px de ancho, alternativas genéricas numeradas y sin controles de miniatura claramente operables por teclado. | Miniaturas mayores, botones con descripción, navegación y ampliación accesibles. |
| Media | Términos usa `all: revert`; títulos observados de 64 px y cuerpo de unos 989 px en pantalla de 1024. | Tipografía editorial explícita, ancho de lectura limitado y títulos adaptables. |

Para texto normal, la referencia WCAG AA es 4.5:1; para texto grande, 3:1. Los dos pares medidos de contacto quedan por debajo. [W3C: contraste mínimo](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum).

El comportamiento de foco y semántica del modal debe seguir un patrón de diálogo accesible. [W3C: diálogo modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Composición responsive y animaciones

Conservaría la identidad negra/roja: necesita refinamiento, no un rediseño completo.

- **Tabletas:** a 768 px el inicio todavía tiene dos columnas y bastante espacio vertical vacío. Conviene un breakpoint intermedio: fotografía y texto con proporciones más equilibradas y menos altura mínima rígida.
- **Pantallas grandes:** limitar el ancho del contenido y usar una escala consistente de separaciones. No estirar párrafos legales de extremo a extremo ni aumentar columnas indefinidamente.
- **Proyectos:** las portadas son capturas verticales recortadas a cuadrados de 180 px. Usaría una portada independiente y dejaría las capturas para la galería. Igualaría el ancho de la banda del título con el de la imagen.
- **Contacto:** primero corregir legibilidad; después equilibrar ilustración y formulario. Añadir `autocomplete` apropiado y ayuda/errores asociados a cada campo. Los campos ya tienen `aria-label`: no están totalmente sin nombre accesible.
- **Movimiento:** transiciones discretas de opacidad/desplazamiento corto, entrada escalonada limitada y hover equivalente al foco. Evitar animaciones continuas que compitan con el contenido o retrasen su lectura. Mantener el soporte de movimiento reducido existente y probarlo también en galerías y nuevos editores.
- **Idiomas:** la interfaz ES/EN no traduce automáticamente el contenido de Firebase. En español todavía aparecen textos editoriales en inglés. Completar ambos idiomas y señalar claramente cualquier fallback.

## Imágenes reales de Firebase

| Alcance comprobado | Resultado |
|---|---|
| Perfil y proyectos | 86 referencias, 85 URL únicas; todas respondieron HTTP 200. |
| Formatos de esas 85 URL | 84 PNG y un JPEG. |
| Tamaño acumulado | 10,471,131 bytes, aproximadamente 9.99 MiB; no es el peso de la carga inicial. |
| Certificados | 14 referencias comprobadas; todas HTTP 200 y JPEG; 769,226 bytes acumulados. |

No detecté enlaces HTTP rotos en ese conjunto. HEAD confirma disponibilidad y metadatos, no valida por sí solo la corrección visual de cada archivo. Las imágenes observadas posteriormente en proyectos, galería de DogeDex y certificados sí cargaron en navegador.

Mejoras recomendadas:

1. Generar tamaños de miniatura y usar `srcset`/`sizes`: varias portadas originales son 1080×2280 para mostrarse a 180×180.
2. Mantener originales legibles para certificados y capturas. Evaluar WebP/AVIF comparando calidad; no convertir indiscriminadamente imágenes con texto pequeño.
3. Declarar dimensiones/proporciones para reservar espacio y mantener carga diferida fuera del primer bloque visible.
4. Dar descripciones útiles a las capturas; traducir también las alternativas cuando corresponda.
5. Las 85 URL de perfil/proyectos incluyen tokens de descarga. Son referencias de material público: **no reutilizar ese mecanismo para borradores privados**.

No recomiendo eliminar archivos supuestamente sobrantes sin inventario autenticado, referencias cruzadas y respaldo.

## Propuesta: “Documentos legales” dentro del portal

### Flujo de creación sencillo

1. Entrar con **el mismo Firebase Auth y permiso administrativo** que ya utiliza el portal; no crear otra base de usuarios.
2. Seleccionar **Nuevo documento** o **Duplicar como borrador**.
3. Indicar aplicación, tipo de documento, título, idioma ES/EN, versión y fecha de vigencia.
4. Elegir plantilla estructural y editar en pestañas **Visual / HTML / Vista previa**.
5. Guardar borrador privado. Mostrar validaciones y advertir sobre HTML o estilos eliminados.
6. Previsualizar con el mismo renderizador público en móvil, tableta y escritorio.
7. Publicar mediante una acción explícita, conservando historial y URL estable.

Hay que diferenciar **política de privacidad** de **términos y condiciones**: varios documentos actuales son políticas de privacidad. La plantilla organiza el texto, pero no garantiza cumplimiento legal ni debe inventar afirmaciones sobre el tratamiento de datos.

### Formato y estilos que sí permitiría

- Encabezados H2/H3, párrafos, negrita, cursiva, listas, citas y separadores.
- Enlaces HTTPS y correo `mailto:` validado. No copiar sin adaptar el saneador del blog: los documentos legales necesitan enlaces de contacto.
- Presets de aviso, nota y bloque destacado; alineaciones limitadas y clases expresamente permitidas.
- Tablas solo si hacen falta, con título, encabezados y contenedor responsive.
- Colores y tipografía del tema; tamaños elegidos mediante estilos semánticos, no valores CSS libres.

**No permitiría:** scripts, manejadores de eventos, iframes arbitrarios, hojas externas, `<style>` libre, URLs peligrosas, CSS con recursos remotos ni posiciones que puedan tapar la interfaz. Mantener sanitización, sin `bypassSecurityTrustHtml`.

### Condición adicional: el HTML no debe romper la página

Por petición del usuario, priorizar compatibilidad y prevención de incidencias al pegar HTML:

- Encapsular los estilos del documento para que no afecten navegación, portal ni otras secciones. No insertar hojas de estilo aportadas por el contenido.
- Normalizar HTML mal formado y limpiar etiquetas, atributos y enlaces no permitidos antes de guardar/publicar; volver a sanear al renderizar. No depender únicamente del editor para proteger escrituras realizadas desde el móvil.
- Limitar longitud, profundidad y cantidad de elementos para evitar contenido que bloquee la interfaz; definir estos límites con muestras reales antes de implementarlos.
- Contener palabras largas, código, tablas e imágenes dentro del documento sin desbordar la pantalla. No usar alturas fijas que corten contenido.
- Mostrar qué se ha retirado o normalizado y conservar el texto seguro; no publicar cambios silenciosos que alteren el sentido del documento.
- La vista previa debe usar exactamente el mismo saneador y estilos que la página pública. Conservar la versión publicada anterior si falla validación, guardado o publicación.
- Probar HTML pegado desde Word/Google Docs, etiquetas sin cerrar, listas anidadas, tablas anchas, enlaces peligrosos, atributos de eventos y estilos invasivos. Añadir pruebas de regresión de seguridad y responsive antes de habilitar el editor.
- No modificar masivamente documentos existentes: comparar su renderizado y mantener respaldo/versiones para poder revertir.

Esto reduce el riesgo de fallos de presentación y XSS; no constituye una garantía de riesgo cero ni de conformidad legal.

### Presentación pública

- Cabecera con aplicación, tipo, idioma, versión y última actualización.
- Ancho de lectura aproximado de 70–75 caracteres; texto de 16–18 px e interlineado generoso.
- Un solo H1; títulos interiores con tamaños adaptables y espacios consistentes.
- Índice de secciones: plegable en móvil y lateral solo donde haya espacio.
- Anclas compartibles, enlaces distinguibles, foco visible y presentación de impresión limpia.
- Mensajes de documento inexistente/error traducidos; no confundir un fallo de red con un documento borrado.

### Firebase y seguridad

La colección actual `terms` tiene lectura pública. **Un campo `draft` o esconder el enlace no vuelve privado un documento.**

Propondría borradores e historial en una colección administrativa separada, y publicar únicamente la versión aprobada en `terms/{id}`. Conservar los IDs y rutas actuales usados por las apps; no migrar ni borrar automáticamente. La lectura pública de documentos publicados no debe requerir login; la edición y publicación sí requieren autenticación y autorización administrativa comprobada en reglas.

Añadir control de conflictos entre móvil y web, validación de campos y escrituras parciales que preserven datos no editados. Antes de cualquier migración: respaldo y pruebas en Emulator. Las traducciones legales necesitan revisión humana, no sustitución automática silenciosa.

## Orden recomendado de implementación, después de aprobar este repaso

1. **Correcciones accesibles:** modal, contraste, etiquetas visibles y encabezados.
2. **Lector legal:** tipografía, ancho, índice y estilos semánticos seguros, sin alterar documentos ni URLs existentes.
3. **Portal legal:** listado, plantillas, editor Visual/HTML, vista previa, borradores privados, publicación e historial.
4. **Medios y responsive:** proporciones, portadas, miniaturas y ajustes de composición para tableta/escritorio.
5. **Aceptación y despliegue:** teclado completo, zoom 200 %, lector de pantalla, movimiento reducido, ES/EN y matriz 320/390/768/1024/1440/1920; pruebas de permisos y publicación con reglas desplegadas.

La auditoría previa de dependencias, protección del contacto y pipeline de despliegue continúa pendiente según `PENDIENTES-VERIFICADOS.md`; este repaso no sustituye esas tareas ni confirma el estado productivo.

## Archivos relevantes para la siguiente fase

- `src/app/terms/terms/terms.component.html` y `.scss`: lector y presentación legal.
- `src/app/models/Terms.ts`: modelo actual limitado a título/contenido.
- `firestore.rules`: lectura pública actual de `terms` y autorización de escrituras.
- Componentes de tarjetas/detalle de proyectos y galería: modal, imágenes y navegación.
- Componentes de contacto y certificados: contraste, etiquetas y proporciones.

## Key Learnings:

1. El lector legal actual conserva HTML estructural, pero los estilos en línea de RunningApp no llegan al DOM renderizado; hace falta un sistema de estilos permitido, no desactivar la sanitización.
2. Los borradores legales deben quedar fuera de la colección pública `terms`; ocultarlos en la interfaz no protege su lectura.
3. Ausencia de desbordamiento horizontal no equivale a accesibilidad: el modal de proyectos pierde el recorrido de foco y contacto presenta contraste insuficiente.
4. El inventario comprobado corresponde a referencias públicas, no al bucket completo; disponibilidad HTTP y presentación visual son comprobaciones distintas.
