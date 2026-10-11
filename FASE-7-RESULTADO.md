# Fase 7 — Presentación legal y HTML seguro

## Estado

Implementada y verificada localmente. No se desplegó, publicó ni escribió contenido en Firebase. No se modificaron cuentas, reglas, IDs, URLs existentes ni el modelo móvil `title`/`content`. Esta fase mejora el lector público; el editor privado corresponde a la fase 8.

## Cambios

- Lector reutilizable con título único, tipografía legible, ancho de lectura limitado e índice de secciones: lateral en escritorio y desplegable en móvil.
- Navegación por teclado, foco visible, anclas y enlaces profundos compatibles con las rutas actuales. Tablas en regiones desplazables sin ensanchar la página; bloques de código y enlaces largos ajustados al contenedor.
- Interfaz ES/EN. Se conserva el idioma declarado del contenido; no se traduce ni reescribe automáticamente el texto legal.
- Estados separados de carga, documento inexistente y error, con reintento y cancelación de solicitudes anteriores al cambiar de ruta.
- Una ausencia en la caché no se presenta como un 404 confirmado: se espera la respuesta del servidor. El primer resultado válido tiene un límite de espera de 15 segundos; documentos válidos almacenados en caché pueden mostrarse.

## HTML sin romper la página

El contenido se analiza en un documento inerte y se reconstruye con una lista explícita de etiquetas y atributos permitidos. Después pasa también por la sanitización de Angular, sin `bypassSecurityTrustHtml`.

- Permite títulos, párrafos, listas, énfasis, citas, código, tablas y enlaces HTTPS o correo simple.
- Elimina scripts, eventos, formularios, iframes, SVG, imágenes y otros recursos activos. No permite CSS arbitrario, IDs ajenos ni atributos que oculten contenido.
- Convierte formatos compatibles pegados (alineación, negrita y cursiva) en clases controladas. Incluye estilos predefinidos para notas, advertencias y entradillas.
- Genera IDs y regiones de tabla exclusivamente desde el lector después de la sanitización. Reprocesar HTML no acumula contenedores de tablas.
- Límites: 500.000 caracteres, 20.000 nodos, profundidad 80 y hasta 200 entradas de índice. Un documento rechazado muestra un aviso, nunca una política parcialmente recortada.

Contrato y ejemplos: [HTML-LEGAL-SEGURO.md](HTML-LEGAL-SEGURO.md). Estas defensas reducen riesgos; no constituyen una garantía de ausencia total de vulnerabilidades ni sustituyen validación al guardar en la fase 8.

## Verificación

- **43 pruebas legales** y **200 pruebas Angular totales** aprobadas en ChromeHeadless.
- Compilación de producción aprobada. ESLint del área modificada: **0 errores, 38 advertencias**; no se afirma lint completamente limpio.
- Cinco documentos públicos existentes (NullSiteApp, NurseApp, Dogedex, BaseConverter y RunningApp): texto normalizado y destinos únicos de enlaces conservados frente al HTML original. Lecturas únicamente, sin modificar documentos.
- **30 casos responsive:** cinco documentos a 320, 390, 768, 1024, 1440 y 1920 px, sin desbordamiento horizontal de página y con un solo H1.
- Inspección visual móvil/escritorio, índice, foco en destino, enlace profundo, etiquetas inglesas y redirección de URL antigua verificadas. Recarga real de NurseApp verificada después del ajuste final del servicio Firebase.
- Pruebas de HTML malicioso, atributos, URLs, contenido malformado, límites, normalización repetida y estados de carga/error. La política caché/servidor tiene pruebas unitarias; no se realizó una certificación end-to-end sin conexión ni con lector de pantalla.

## Pendientes por fase

1. **Fase 8:** crear/editar documentos desde el panel privado con la autenticación unificada existente, vista previa usando este mismo lector, validación al guardar, borradores/historial y publicación explícita conservando URLs.
2. **Fase 9:** completar contenido bilingüe, currículum y revisión editorial/media pendiente. Esta fase no modifica textos legales ni inventa fechas o versiones.
3. **Fase 10:** cerrar riesgos de seguridad y dependencias previamente documentados, comprobar reglas/permisos, aceptación con zoom/tecnologías asistivas y despliegue controlado. No se consideran resueltos por mejorar el lector.

## Archivos relevantes

- `src/app/terms/legal-html.ts` y pruebas — contrato de normalización y seguridad.
- `src/app/terms/legal-document/` — lector reutilizable y pruebas de presentación.
- `src/app/terms/legal-snapshot.ts` y pruebas — distinción entre caché vacía y ausencia confirmada.
- `src/app/terms/terms.service.ts` — escucha Firebase con metadatos, limpieza de suscripción y tiempo de espera.
- `src/app/terms/terms/` — estados de ruta y manejo de errores.
- `src/app/i18n/translations.ts` — etiquetas legales ES/EN.

## Key Learnings:

1. Angular elimina IDs del HTML insertado: las anclas se asignan después únicamente a títulos sanitizados y con identificadores controlados.
2. Una caché Firestore vacía no demuestra que el documento no exista; la respuesta del servidor debe distinguirse mediante metadatos.
3. La versión instalada de `docSnapshots` no admite opciones de metadatos; se usa `onSnapshot` dentro de un Observable cuyo teardown desuscribe.
4. La comparación de compatibilidad debe usar HTML parseado, no contar etiquetas mediante expresiones regulares: la normalización del navegador puede cambiar el número de enlaces sin perder destinos.

## Handoff

Objetivo completado: lector legal seguro y responsive local. Restricción conservada: evitar HTML activo y mantener compatibilidad móvil/rutas. Próximo trabajo: fase 8, sin asumir permiso para publicar contenido o desplegar. Registro durable en este archivo porque la identidad de sesión de memoria no está registrada.
