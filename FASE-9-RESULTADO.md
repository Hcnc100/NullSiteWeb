# Fase 9 — Contenido bilingüe y medios

## Estado

**Base técnica implementada localmente; cierre editorial pendiente de revisión y archivos del propietario.** No se desplegó, publicó, subió ni modificó contenido en Firebase de producción. No se alteró autenticación ni se crearon cuentas.

Esta fase no puede darse por completamente cerrada sin los PDF definitivos del CV y sin aprobar los textos/descripciones. No se sustituyeron con datos ficticios.

## Implementado

### Proyectos y galerías

- Campos de descripción accesible de portada: original, español e inglés.
- Miniatura de portada opcional por URL HTTPS o subida con el mecanismo de imágenes existente.
- Editor de metadatos para cada URL de galería: descripción original/ES/EN y miniatura HTTPS opcional.
- Los metadatos siguen a la **URL**, no a la posición: reordenar capturas no intercambia sus descripciones. Cambiar de proyecto limpia los metadatos del anterior aunque compartan una imagen.
- Se mantiene `gallery: string[]` para la app móvil. `galleryItems` agrega metadatos sin reemplazar esas URLs.
- El listado usa la miniatura de portada si existe. La galería usa miniaturas para sus botones, pero el visor conserva siempre la imagen original. Si falla una miniatura, se intenta el original.
- Las descripciones cambian con ES/EN, con fallback al texto original o a la identificación básica de la captura. No se inventa lo que muestra una imagen no revisada.
- Guardar ya no regenera y sobrescribe las descripciones personalizadas de galería. La detección de conflictos incluye portada, miniaturas y `galleryItems` para proteger cambios concurrentes desde móvil u otro editor.

### Revisión editorial y CV

- Checklist de traducciones faltantes en Perfil, Proyectos y Habilidades. En proyectos incluye descripciones de portada/galería. Son avisos, no bloqueos que impidan guardar documentos históricos.
- Estado de CV español/inglés en el editor existente. La selección exige que cada entrada apunte a `resumes/{idioma}/...pdf` y tenga tamaño válido; metadatos con idioma cruzado o tamaño fraccionario se rechazan.
- Se conserva el fallback al otro PDF, **indicando el idioma real en el botón de descarga**, sin traducir el currículum ni publicarlo automáticamente.
- La lectura localizada tolera campos de traducción malformados sin romper la página.

### Blog

- La primera imagen permitida del cuerpo publicado se usa como miniatura de la tarjeta. El editor explica cómo elegirla mediante el orden del contenido y recuerda revisar `alt`, resumen e idioma.
- Se carga únicamente al acercarse al viewport, una sola vez por artículo, usando el acceso público ya validado. No usa rutas privadas ni URLs con tokens de descarga.
- Marco 16:9 para reservar espacio, proporción de imagen conservada y manejo de fallo sin ocultar el título/resumen.
- Valida MIME/tamaño del blob y revoca URLs temporales al desactivar el blog, cambiar de artículo o destruir el componente. Descarta respuestas tardías.
- No activa el blog. No genera archivos redimensionados: son miniaturas de presentación; para reducir bytes hace falta aportar variantes ligeras o una futura canalización de imágenes.

## Contenido preparado para aprobar

[content/phase9-editorial-review.json](content/phase9-editorial-review.json) contiene propuestas ES/EN para el perfil y los **10 proyectos públicos**, basadas solo en sus descripciones existentes. Conserva nombres, IDs y alcance; no agrega experiencia, tecnologías, credenciales o funciones no verificadas.

Incluye propuestas de descripción para la portada y **7 capturas de MoviesCompose** revisadas visualmente. Las restantes imágenes requieren revisión visual antes de redactar sus descripciones. Verificar el orden actual de las capturas antes de copiar las propuestas por índice.

El archivo tiene `reviewedByOwner: false` y **no tiene importación automática**. Para aplicar: revisar cada propuesta, copiar los campos aprobados al editor correspondiente, revisar ES/EN y guardar deliberadamente. Perfil/proyectos siguen publicándose al guardar; el blog conserva su publicación separada.

## Auditoría de producción — solo lectura

Lectura pública de Firestore y comprobación HTTP HEAD de los medios referenciados:

- Perfil público y 10 proyectos: no se encontraron traducciones editoriales explícitas en los documentos consultados.
- Los proyectos no tenían `coverAlt` ni `galleryItems` con descripciones en esos documentos.
- **10 portadas + 75 referencias de galería = 85 referencias, 84 URLs únicas.** Las 84 respondieron HTTP 200, tipo declarado `image/png`, sin incidencias HTTP en esta ejecución.
- Tamaño máximo declarado: **761.481 bytes**; total declarado de las imágenes únicas: **10.444.283 bytes**. Se comprobaron cabeceras, no se certificó el contenido visual ni se decodificaron todas las imágenes.
- `siteSettings/public` devolvió **403** sin sesión: no se pudo verificar el estado real del CV ni del blog. Esto no demuestra que no existan PDFs o publicaciones y no se debilitaron permisos para consultarlos.
- No hay PDFs en `src/assets`. Falta recibir o localizar los PDF definitivos del propietario; no se exploraron carpetas personales externas al proyecto.

No se publican URLs con tokens de Storage en este informe ni en la propuesta editorial.

## Verificación y corrección visual

- **254 pruebas Angular aprobadas**, frente a 233 al terminar la fase 8: 21 pruebas adicionales.
- Build de producción aprobado. ESLint de áreas verificadas: **0 errores, 128 advertencias**. No equivale a lint limpio de todo el repositorio.
- Pruebas de conservación/reordenamiento de metadatos, conflictos, descripciones ES/EN, URLs inseguras, fallbacks de miniaturas, CV por idioma, carga diferida del blog y limpieza de blobs.
- Navegador con datos públicos reales: **390, 768, 1024, 1440 y 1920 px**, 10 tarjetas/10 portadas cargadas y sin desbordamiento horizontal de página.
- Galería MoviesCompose inspeccionada a 1440 y 390 px: 7 capturas, labels de botones y sin desbordamiento horizontal del diálogo móvil.
- Se detectó que el selector ES/EN (`z-index: 2000`) quedaba sobre los diálogos CDK (`1000`), interfiriendo visualmente con el cierre móvil. Se corrigió a `900`, se agregó prueba de regresión y se verificó el resultado en navegador.
- No se probó el panel con una cuenta real ni se activó el blog para generar una captura de las nuevas miniaturas públicas. Esos flujos están cubiertos por pruebas con límites simulados y quedan como aceptación autenticada antes de producción.
- No se cambiaron reglas Firestore/Storage en esta fase. Las 90 pruebas de reglas de fase 8 no se presentan como una nueva ejecución de fase 9.

## Qué falta para cerrar fase 9

1. Aprobar o ajustar la propuesta editorial ES/EN y aplicarla desde el panel con la cuenta existente.
2. Proporcionar los **PDF definitivos ES y EN**, revisar datos privados y publicar cada idioma explícitamente desde Currículum.
3. Completar descripciones accesibles de las portadas/capturas restantes; aprobar las propuestas de MoviesCompose antes de usarlas.
4. Aportar miniaturas ligeras de las mismas imágenes si se desean; no es obligatorio reemplazar los originales actuales.
5. Revisar resumen, idioma y descripciones de imágenes de cada artículo antes de su publicación explícita. El blog sigue sin activarse automáticamente.
6. Aceptación autenticada móvil/web, zoom/lector de pantalla y despliegue controlado siguen ligados a fase 10 junto con los riesgos de dependencias, antispam y pipeline ya documentados.

## Archivos relevantes

- `src/app/models/project-media.ts` — contrato y fallbacks de medios/idiomas.
- `src/app/models/managed-content.ts`, `src/app/models/Project.ts` — persistencia compatible, validación y conflictos.
- `src/app/admin/content/`, `src/app/admin/profile/`, `src/app/admin/resume/` — edición y checklist.
- `src/app/projects/` — lectura de portadas/galería localizada y miniaturas con fallback.
- `src/app/blog/blog-thumbnail.component.*`, `src/app/blog/blog.component.*`, `src/app/admin/blog/admin-blog.component.html` — miniaturas y ayuda editorial.
- `src/app/models/resume.ts`, `src/app/i18n/` — validación de CV, textos y capas.
- `content/phase9-editorial-review.json` — propuesta revisable, no publicada.

## Key Learnings:

1. `contentPatch` regeneraba `galleryItems.alt` al guardar y perdía descripciones personalizadas; ahora se conservan por URL y forman parte del fingerprint de conflicto.
2. Conservar las URLs originales y añadir miniaturas separadas mantiene compatible el visor y la app móvil.
3. Una entrada CV debe validar el idioma de su ruta, no solo aceptar cualquier ruta `resumes/es|en`.
4. El selector de idioma debe quedar por debajo de los overlays CDK; `2000` superponía controles sobre el cierre del diálogo móvil.
5. Una comprobación HTTP 200/MIME no demuestra el contenido de una captura; solo se redactaron propuestas visuales de las imágenes realmente inspeccionadas.

## Session handoff

### Goal
Avanzar fase 9 con contenido bilingüe y gestión de medios, preservando autenticación, rutas y datos móviles.
### Instructions
No inventar datos profesionales ni publicar automáticamente. Mantener responsive/accesibilidad y no introducir HTML activo.
### Discoveries
Metadatos de galería se sobrescribían; idioma CV requería validación cruzada; 84 imágenes únicas públicas accesibles; configuración pública no consultable anónimamente; selector de idioma superpuesto a modales.
### Accomplished
Base técnica, correcciones, propuesta editorial y pruebas descritas arriba. Sin escrituras/despliegue de producción.
### Next Steps
Recibir PDFs, aprobar contenido, completar revisión visual de imágenes y hacer aceptación autenticada antes de fase 10/despliegue.
### Relevant Files
Lista anterior. Este documento conserva el handoff sin escrituras de memoria atribuidas a una identidad no registrada.
