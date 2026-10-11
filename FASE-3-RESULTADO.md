# Fase 3 — Blog privado

## Estado y acceso

Implementada **localmente**. La entrada está en `/admin/blog`, dentro del panel existente y protegida por la misma cuenta Firebase y claim booleano `admin: true`. No hay enlace Blog en navegación pública, lector anónimo, botón Publicar ni interruptor que pueda hacer públicos los borradores. La publicación corresponde a la fase 5.

No se desplegaron código ni reglas, no se crearon cuentas y no se escribió contenido en producción. Las reglas locales nuevas **deben desplegarse y validarse antes de usar imágenes o borradores reales**: el wildcard Storage anterior permitía lectura pública y no es apropiado para recursos confidenciales.

## Editor

- Crear, editar y eliminar entradas privadas; título, slug, resumen, idioma ES/EN y etiquetas separadas del HTML.
- Pestañas **Visual**, **HTML** y **Vista previa privada**.
- Visual básico sin nueva dependencia: párrafos, H2/H3, negritas, cursivas, listas, citas, enlaces HTTPS y código. Seleccionar texto y aplicar formato; se pueden seguir editando textos directamente.
- El pegado visual inserta texto plano para evitar contenido activo. Para conservar formato pegado, usar HTML. El formato admitido pasa por Visual → HTML sin perder títulos, listas, código escapado o referencias de imágenes.
- El título genera el H1 en la vista previa. El HTML del cuerpo admite H2/H3; no ejecutar scripts ni pegar un documento completo con estilos.
- Imágenes JPEG/PNG/WebP/GIF hasta 10 MiB, con descripción alternativa obligatoria al subir. Se almacenan como `blog-drafts/{id}/{archivo}`; se muestran como marcadores en Visual y como imágenes completas en Vista previa.
- Validaciones: título 180 caracteres, slug 100, resumen 500, HTML 200 000 y hasta 20 etiquetas de 40 caracteres. La vista previa carga hasta 20 imágenes por entrada.
- Protección de cambios sin guardar, confirmación de eliminación, estados de operación y conservación del formulario ante errores o conflictos.

## Datos y concurrencia

`blog-drafts/{id}` contiene `title`, `slug`, `excerpt`, `locale`, `tags`, `contentHtml`, `contentFormat: html`, `contentVersion: 1`, `status: draft`, `revision`, `authorUid`, `createdAt` y `updatedAt`.

`blog-slugs/{idioma}-{slug}` reserva el slug para un ID. Crear, cambiar slug y borrar usan transacciones; la reserva anterior se libera sólo si pertenece al mismo borrador. El índice es privado. La comparación de revisión y contenido evita sobrescribir cambios de otro dispositivo. Se preservan campos desconocidos al actualizar y autor/fecha originales. La reserva se aplica en el servicio del panel; cualquier futuro cliente móvil de blog debe adoptar ese mismo protocolo transaccional.

No se añade historial completo: `revision` sirve para detectar concurrencia, no para recuperar versiones. La eliminación es definitiva para el documento. Los objetos de imagen no se borran automáticamente, para evitar destrucción de referencias; subidas canceladas y archivos sin uso necesitan limpieza administrativa posterior.

## HTML e imágenes privadas

El sanitizador reconstruye una lista pequeña de elementos y atributos en un documento **inerte**; elimina scripts, eventos, estilos, SVG/MathML, iframes, formularios y embeds. No acepta imágenes externas, data URLs, blob URLs persistidas, paths de otro borrador ni URLs con tokens. Los enlaces admiten sólo HTTPS sin credenciales y reciben `rel="noopener noreferrer"`.

Se avisa cuando se retira o normaliza HTML. No se promete conservar HTML arbitrario. Ejemplos de código deben escaparse dentro de `<pre><code>`. Se mantiene `[innerHTML]` con sanitización Angular, sin `bypassSecurityTrustHtml`, compilación de plantillas dinámicas ni binding bidireccional de HTML.

La vista previa descarga imágenes con `getBlob` autenticado y crea URLs temporales locales; las revoca al cambiar de entrada, perder permisos o destruir el componente. No llama a `getDownloadURL` ni guarda enlaces públicos con token. CORS del bucket debe permitir los dominios del panel para estas descargas; no se modificó CORS de producción.

Esto protege los accesos SDK probados; no revoca copias descargadas ni convierte en privadas imágenes previamente expuestas en otros namespaces. Firebase puede generar tokens en metadatos: un administrador debe evitar divulgar URLs con token, que son capacidades de acceso independientes de la lectura SDK ordinaria. No se publican desde este editor.

## Reglas

- Firestore: sólo administrador lee/lista/escribe borradores e índice de slugs. Crear/actualizar exige formato/version/idioma admitidos y `status: draft`. Incluso un administrador no cambia a `published` en esta colección.
- Storage: namespace `blog-drafts` sólo administrativo, validación de formato/tamaño y permisos separados de borrado.
- El wildcard público heredado excluye expresamente `blog-drafts`. Las reglas coincidentes se combinan con OR; una regla privada por sí sola no neutraliza un permiso público más amplio.
- Un hipotético `siteSettings/public.blogEnabled: true` no modifica el acceso: no hay regla que use ese campo en fase 3. `blog-posts` sigue denegado por defecto.

## Verificación realizada

- **129 pruebas Angular completas correctas**, incluidas 22 nuevas de blog: HTML malicioso, URLs peligrosas, paths privados, límites, ida y vuelta Visual/HTML, conflictos, slug ocupado, cancelación, revocación de sesión y respuestas tardías.
- **38 comprobaciones Firebase Emulator correctas**, incluyendo 18 nuevas de blog: lectura directa/listado anónimo y usuario normal denegados, escritura administrativa, prohibición de publicación, índice privado e imágenes privadas. Regresión de proyectos, habilidades y CV incluida.
- Compilación de producción correcta y ESLint del nuevo código sin errores (`--quiet`; quedan advertencias de longitud de línea).
- Navegador local: `/admin/blog` anónimo redirige a login; `/en/blog` no habilita un lector y redirige a la portada; la navegación pública no muestra Blog.
- Corregidos durante las pruebas: cambios falsos por el orden de atributos de imágenes en el viaje Visual/HTML y solicitudes de imágenes durante reconstrucción DOM; ahora la reconstrucción completa permanece inerte y la suite no produce esas solicitudes 404.

Las pruebas de UI usan mocks, las de reglas un proyecto ficticio. **Pendiente aceptación manual con tu cuenta administradora**, edición real, subida/vista previa en escritorio y móvil y CORS de staging. No se utilizó tu contraseña ni se fingió una sesión real para dar por validada la integración completa.

### Reproducir

```powershell
npx ng test --watch=false --browsers=ChromeHeadless
npm run build
npx --yes firebase-tools@14.27.0 emulators:exec --config firebase.phase3.emulators.json --project demo-nullsite-phase2 --only firestore,storage "node tests/firebase-rules.mjs"
```

Se usa una configuración de puertos separada (8185/9295) porque 8085 estaba ocupado; no se interrumpió el emulador preexistente. El CLI global 15 requiere Java 21; la suite se ejecutó con CLI 14.27 y Java 17, código de salida 0. El runtime antiguo emitió un aviso de cierre después de completar las 38 comprobaciones. Conviene Java 21 y CLI actual para futuras ejecuciones; no se cambió Java global.

## Antes de lanzar

1. Revisar y respaldar reglas/configuración desplegadas; aplicar las nuevas reglas sólo con autorización. Probar primero en staging y nunca subir información privada con las reglas antiguas.
2. Verificar CORS y probar tu flujo guardar → recargar → Visual/HTML → subir imagen → vista previa, con ES/EN y móvil.
3. Revisar las vulnerabilidades del árbol de dependencias documentadas en fase 2; estas pruebas no equivalen a una auditoría integral. No se ejecutaron actualizaciones mayores automáticas.
4. En fase 5, crear snapshots publicados y promoción controlada de imágenes a otro namespace. Nunca abrir la colección de borradores para lanzar el blog.

## Archivos relevantes

- `src/app/admin/blog/` — editor, persistencia, renderizador y pruebas.
- `src/app/models/blog-draft.ts` — contrato, validación y reconstrucción HTML permitida.
- `src/app/app.routes.ts`, `src/app/admin/layout/` — acceso exclusivo desde panel.
- `firestore.rules`, `storage.rules`, `tests/firebase-rules.mjs` — permisos y regresiones de seguridad.
- `firebase.phase3.emulators.json` — emuladores aislados en puertos alternativos.

## Referencias

- [Seguridad Angular](https://angular.dev/best-practices/security): conservar sanitización de HTML y evitar bypass de confianza.
- [Descargas Storage web](https://firebase.google.com/docs/storage/web/download-files): descargas autenticadas mediante SDK y requisitos CORS.

## Key Learnings:

1. Elementos img separados del DOM activo pueden iniciar descargas; reconstruir contenido en el ownerDocument inerte de un template evita peticiones durante sanitización.
2. Comparar HTML canónico evita marcar cambios inexistentes por el orden de atributos en imágenes.
3. Borradores e imágenes requieren namespaces privados excluidos de cualquier wildcard público coincidente.
4. La publicación futura debe copiar una versión revisada, nunca abrir al público la colección de trabajo.
