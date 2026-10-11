# Fase 5 — Publicación controlada del blog y SEO

## Estado

Implementada y validada **localmente**. No hubo despliegue, cambio de cuentas/claims, activación de producción ni publicación de artículos reales. Se mantiene Firebase Auth del móvil y autorización administrativa existente; no hay otro login.

## Uso desde el panel

1. Entra en `/admin/blog` con tu cuenta autorizada y guarda el borrador.
2. «Publicar versión guardada» requiere confirmación. Copia únicamente el contenido permitido y las imágenes referenciadas a una versión pública independiente.
3. «Activar blog» es otra acción confirmada. Publicar **no** activa automáticamente el sitio. Sin `blogEnabled: true` confirmado por servidor, el lector permanece cerrado y no aparece el enlace público.
4. Puedes seguir editando y guardando: la versión pública no cambia hasta volver a publicar. El listado indica la revisión publicada.
5. «Retirar publicación» elimina el snapshot público y conserva el borrador. Desactivar el blog bloquea nuevas lecturas públicas de todos los artículos e imágenes. Eliminar el borrador también retira su snapshot, con advertencia explícita.

No se publican cambios sin guardar. Las operaciones detectan conflictos contra el borrador de referencia y colisiones de slug. Cambiar slug/idioma y republicar retira el snapshot anterior en la misma transacción.

## Contrato y privacidad

| Recurso | Acceso |
|---|---|
| `blog-drafts/{id}` y sus imágenes | Exclusivamente administrativo, siempre |
| `blog-slugs/{locale}-{slug}` | Índice privado de reservas |
| `blog-posts/{locale}-{slug}` | Snapshot público sólo con blog habilitado y estado publicado; escritura administrativa con whitelist |
| `blog-public/{postKey}/{assetVersion}/{file}` | Lectura individual sólo de la versión actualmente publicada con blog habilitado; sin listado público |
| `siteSettings/public.blogEnabled` | Lectura pública, modificación administrativa; ausente equivale a deshabilitado |

La copia pública omite `authorUid` y propiedades desconocidas/privadas. HTML sanitizado al publicar y nuevamente al leer; no se compila como plantilla Angular, ni se utiliza bypass de sanitización. Las rutas de imágenes privadas, URLs externas, tokens y versiones ajenas se rechazan en el lector.

Las imágenes se copian primero a un UUID de versión nuevo; sólo la transacción final hace accesible esa versión. Si falla una copia o hay conflicto, la publicación anterior se conserva. Archivos huérfanos se mantienen sin acceso público para limpieza posterior, no se borran automáticamente. Las imágenes activas no se pueden sobrescribir; una actualización crea otra versión. La subida pública usa `Cache-Control: private, no-store, max-age=0`.

Se usa `getBlob`, no URLs permanentes con token. Los object URLs se revocan al retirar/cambiar el artículo, desactivar el blog o destruir el componente. La configuración cacheada no basta para abrir el blog: se espera una confirmación del servidor.

**Límite de revocación:** desactivar o retirar bloquea nuevas lecturas autorizadas por reglas; no puede borrar copias, capturas o archivos ya descargados por visitantes.

## Lectores y SEO

- `/es/blog` y `/en/blog`: últimas 50 publicaciones del idioma, ordenadas por publicación; tarjetas, etiquetas, estados de carga/vacío/error.
- `/{locale}/blog/{slug}`: artículo seguro, enlaces y recursos versionados. Los artículos en otro idioma se crean por separado: no se inventan traducciones ni alternates de artículos inexistentes.
- Navegación pública condicional; panel siempre privado. URLs antiguas sin idioma redirigen conservando el slug.
- Título y descripción por página, canonical sin query/hash, `hreflang` ES/EN en páginas generales/listado, Open Graph, Twitter summary y JSON-LD `BlogPosting` del artículo disponible.
- Admin, blog deshabilitado, errores y artículos inexistentes: `noindex,nofollow`, sin canonical/JSON-LD de un artículo anterior.
- `robots.txt` excluye administración; no es un mecanismo de autorización.

### Límites SEO pendientes de lanzamiento

El sitio sigue siendo una SPA: metadatos y artículos se generan en el cliente. No se añadió SSR/prerender ni respuestas HTTP 404 reales; crawlers sin JavaScript y previews sociales pueden ver sólo el HTML base. No se afirma indexación ni vistas previas completas. Para SEO de producción avanzado hay que incorporar renderizado de snapshots publicados y validar su estrategia de retirada/caché.

Canonical usa el origen del sitio visitado; falta confirmar el dominio de producción único y redirigir aliases/previews para evitar duplicados. No se inventó un dominio ni se generó un sitemap incompleto con datos privados: tras confirmar el dominio, generar sitemap **sólo** de snapshots publicados/habilitados y añadir su URL absoluta a `robots.txt`.

## Verificación

- **151 pruebas Angular exitosas** (20 añadidas respecto a fase 4): separación público/privado, whitelist, HTML hostil, rutas/versiones inválidas, activación confirmada, guardado sin publicar, retiro, limpieza de URLs, cierre ante caché/error y SEO.
- **67 pruebas Firestore/Storage Emulator exitosas** (22 nuevas): activación, consulta real por idioma/estado/fecha, lectura directa, borradores privados aun con blog habilitado, claims, whitelist, imágenes versionadas, rechazo de sobrescritura activa y revocación por desactivación/retiro.
- Build de producción correcto, incluido `robots.txt`. ESLint TypeScript focalizado: 0 errores y 38 advertencias de formato; plantillas modificadas sin errores ni advertencias. No se considera lint global aprobado. `git diff --check` correcto.
- Navegador local: error de configuración permanece cerrado y `noindex`; cambio ES→EN en 390 px; acceso anónimo a `/admin/blog` redirige a login. Portada inglesa con canonical/alternates correctos y sin overflow horizontal. No se publicó contra Firebase real para probar el estado habilitado: éste se cubre con fixtures Angular y Emulator.
- El índice compuesto está definido, pero Emulator no garantiza disponibilidad del índice en producción; debe desplegarse y quedar listo.
- Siguen las advertencias Sass y los pendientes de dependencias/antispam documentados en [fase 4](FASE-4-RESULTADO.md). No se solucionaron por añadir publicación.

## Checklist antes de activar producción

1. Cerrar alertas de dependencias y prevención de abuso del contacto de fase 4; respaldar/inventariar los datos reales.
2. Desplegar reglas Firestore/Storage, índice de `blog-posts` y aplicación **sin** activar `blogEnabled` automáticamente. Verificar acceso cruzado Storage→Firestore y CORS de Storage.
3. Con tu cuenta real, crear un borrador de prueba y comprobar que otro usuario autenticado y un visitante no pueden leerlo ni sus imágenes.
4. Publicar una copia y confirmar que continúa inaccesible mientras el blog está apagado.
5. Activar explícitamente y verificar lista, detalle e imágenes en ES/EN; probar guardado privado, republicación, retiro y desactivación.
6. Confirmar dominio, sitemap y estrategia de renderizado/previews si son requisito del lanzamiento.

## Archivos relevantes

- `src/app/admin/blog/`: publicación/retiro, activación y preservación de referencias al guardar.
- `src/app/blog/`: servicio público con límite de caché, lector y SEO; pruebas aisladas.
- `src/app/models/blog-post.ts`, `blog-draft.ts`: contrato de snapshots y sanitización por namespace.
- `src/app/app.routes.ts`, `navigation/navbar/`, `admin/layout/`: rutas y navegación.
- `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `tests/firebase-rules.mjs`: permisos e índice.
- `src/robots.txt`, `angular.json`, `src/index.html`: rastreo y empaquetado.

## Key Learnings:

1. Guardar borradores y publicar snapshots deben ser operaciones distintas para no filtrar ediciones inacabadas.
2. El namespace público de Storage debe excluirse del wildcard legacy; sus permisos dependen de activación y versión vigente.
3. Una regla `allow update: false` no bastó en el Emulator al sobrescribir mediante upload; se añadió una comprobación explícita de versión activa en la condición de creación, verificada con regresión. Existe un antecedente en [Firebase JS SDK #5079](https://github.com/firebase/firebase-js-sdk/issues/5079).
4. Las reglas de Storage pueden consultar documentos Firestore para decidir acceso; requieren verificación de la integración desplegada. [Documentación Firebase](https://firebase.google.com/docs/storage/security/rules-conditions#enhance_with_cloud_firestore).
5. Metadatos SEO de una SPA no equivalen a HTML de artículos renderizado en servidor ni garantizan previews de crawlers sin JavaScript.
