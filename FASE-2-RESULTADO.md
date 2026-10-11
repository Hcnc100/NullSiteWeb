# Fase 2 — Implementación local

## Estado

Implementadas 2A (ES/EN), 2B (proyectos y habilidades) y 2C (currículum). No se ha desplegado código ni reglas, ni escrito contenido en Firebase de producción. El blog no tiene rutas ni editor en esta entrega: corresponde a la fase 3.

## Funciones disponibles

- Selector ES/EN; rutas `/es/home`, `/en/home` y equivalentes para secciones públicas. URLs antiguas redirigen al idioma elegido. Se conserva sección, query y fragmento al cambiar idioma; `html.lang` y preferencia local se actualizan.
- Navegación, títulos públicos, formulario de contacto, validaciones y avisos traducidos. Los textos editoriales de Firebase no se traducen automáticamente: se usan `translations.es/en` opcionales o el texto original. Certificados y términos conservan su contenido original. La demo de conciliación conserva su interfaz existente.
- `/admin/profile`: traducciones opcionales de profesión y descripción, además del perfil y redes de la fase 1.
- `/admin/projects`: crear, editar y eliminar proyectos; portada y galería mediante URL HTTPS o subida JPEG/PNG/WebP/GIF hasta 10 MiB; repositorio, demo/tienda, enlaces adicionales y tecnologías. Se mantienen `gallery: string[]`, `urlImg`, `urlRepo` y `urlPlay` del móvil; se añaden metadatos ordenados `galleryItems`.
- `/admin/skills`: CRUD, categoría, iconos existentes, color, orden, publicación y traducciones. Primero usar **Importar habilidades actuales sin sobrescribir**: incorpora únicamente IDs ausentes y activa `siteSettings/public.skillsManaged`. No hay migración automática. Mientras no se active, el sitio conserva las nueve habilidades históricas.
- `/admin/resume`: subir/reemplazar/retirar PDF por idioma con confirmación. Se verifica extensión, MIME, tamaño y cabecera `%PDF-`; no es un análisis antivirus. Cambio de idioma evita reutilizar accidentalmente un archivo seleccionado.
- Descarga de CV desde portada y contacto, sin login; usa la versión del idioma elegido o indica el idioma alternativo. Sin PDF publicado no aparece un botón roto. No se inventó ni subió ningún currículum.

## Autenticación y compatibilidad

El panel mantiene Firebase Authentication del mismo proyecto y correo/contraseña de la app móvil; no se creó una segunda cuenta ni backend. Cada dispositivo inicia su propia sesión: compartir identidad no significa transferir automáticamente la sesión móvil al navegador. Editar requiere custom claim booleano `admin: true`, no basta estar autenticado.

Los guardados usan transacciones, comparación de campos editables y actualizaciones parciales; conservan contadores y campos desconocidos. Se detectan cambios concurrentes antes de sobrescribir. Las traducciones se actualizan por ruta de campo para conservar propiedades adicionales. La app móvil actualiza parcialmente el perfil existente; falta una prueba manual de ida y vuelta con una cuenta real autorizada antes de lanzar.

**Los proyectos guardados son públicos**, como en las reglas históricas. No se promete privacidad mediante un checkbox. Las habilidades no publicadas sí están restringidas. El borrado de un proyecto no elimina automáticamente imágenes potencialmente compartidas con el móvil. Las imágenes subidas antes de guardar pueden quedar huérfanas si se cancela: revisar y limpiar explícitamente, no borrar recursos compartidos a ciegas.

## Seguridad de archivos

`storage.rules` separa `resumes`, `projects` y rutas heredadas, sin wildcard que anule las restricciones de PDF. Sólo administradores suben/borran. El PDF público debe coincidir con el puntero activo en `siteSettings/public.resume[idioma]`; retirarlo o reemplazarlo revoca nuevas lecturas SDK del objeto anterior. No se publica una URL con token para el CV. Las copias descargadas y enlaces con token previamente divulgados no se pueden revocar con estas reglas.

Se conservan las lecturas públicas heredadas de imágenes: **no almacenar allí recursos privados del futuro blog**. La fase 3 necesitará un namespace privado propio y reglas acotadas.

## Verificación

- Compilación Angular de producción correcta.
- 107 pruebas Angular completas correctas, incluyendo fase 1, idioma, validación de contenido, PDF y nuevos editores. Fixtures públicos mantienen una advertencia AngularFire de inicialización fuera de contexto, sin fallos.
- ESLint del código revisado sin errores (`--quiet`); quedan advertencias de longitud de línea.
- 20 pruebas de reglas Firestore/Storage correctas en emuladores locales con proyecto ficticio `demo-nullsite-phase2`: anónimo/usuario normal/admin, claim incorrecto, habilidades borrador, escrituras, PDF no publicado/publicado/retirado, MIME, listado y borrado de imágenes/PDF.
- CLI instalada 15.22 requiere Java 21; el equipo tiene Java 17. Se ejecutó la suite con `npx --yes firebase-tools@14.27.0 emulators:exec --config firebase.emulators.json --project demo-nullsite-phase2 --only firestore,storage "node tests/firebase-rules.mjs"`. Salió con código 0; el runtime antiguo emitió una advertencia de cierre posterior a las 20 comprobaciones correctas. No se modificó Java global.
- Navegador local: navegación EN → ES conserva portada, etiquetas cambian, CV ausente no aparece, `/admin/projects` anónimo redirige al login. Corregido y revisado el solapamiento del selector con navegación de escritorio. Pendiente revisión responsive completa y descarga real en Safari/iOS/Android.

## Antes de publicar

1. Respaldar y revisar reglas frente a las desplegadas. Desplegar reglas y frontend únicamente con autorización; las funciones nuevas dependen de `siteSettings/public` y permisos PDF.
2. La consulta de Storage a Firestore puede requerir habilitar los permisos de servicio entre productos durante el despliegue; comprobarlo en staging.
3. Configurar/verificar CORS del bucket para los dominios reales: la descarga usa `getBlob`, que necesita CORS. No se alteró la configuración de producción. Ver [documentación Firebase de descarga web](https://firebase.google.com/docs/storage/web/download-files#cors_configuration).
4. Entrar con la cuenta administradora existente; probar web/móvil sin pérdida de campos. Las pruebas de componentes usan mocks y las de reglas un proyecto ficticio, no credenciales reales.
5. Importar habilidades deliberadamente; cargar PDFs públicos reales y completar traducciones editoriales. Comprobar descargar/reemplazar/retirar en escritorio y móvil.
6. Revisar dependencias antes del lanzamiento: `npm install` reportó 70 vulnerabilidades (5 críticas) en el árbol instalado. No se ejecutó `npm audit fix --force` ni actualizaciones mayores ajenas a esta fase.

## Archivos principales

- `src/app/i18n/` — diccionario, idioma reactivo, pipe, selector y pruebas.
- `src/app/admin/content/` — editor compartido y transacciones de proyectos/habilidades.
- `src/app/admin/resume/`, `src/app/resume/` — publicación administrativa y descarga pública.
- `src/app/models/managed-content.ts`, `resume.ts` — contratos y validaciones.
- `firestore.rules`, `storage.rules` — autorización y namespaces de archivos.
- `firebase.emulators.json`, `tests/firebase-rules.mjs` — suite de seguridad aislada.

## Key Learnings:

1. Firebase Storage combina reglas coincidentes con OR: las restricciones de CV deben quedar fuera del wildcard público heredado.
2. Las habilidades necesitan activación explícita para que el cambio de fuente no vacíe el sitio ni sobrescriba datos existentes.
3. Compartir Firebase Auth entre móvil y web unifica cuentas, no sesiones entre dispositivos.
4. Un PDF retirado puede dejar de descargarse por SDK, pero no revoca copias ya descargadas ni tokens divulgados previamente.
