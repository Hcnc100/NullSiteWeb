# Plan de evolución de NullSiteWeb

## 1. Objetivo y alcance

Conservar la identidad visual actual y evolucionar el portafolio hacia un sitio administrable desde web y móvil. Preparar un blog privado hasta que decidas publicarlo, con edición visual y HTML seguro. Incorporar acceso en español e inglés y descarga pública del currículum.

El análisis inicial se basa en código, modelos y reglas Firebase locales; no se inspeccionaron los documentos ni las reglas desplegadas en producción. Posteriormente se verificó el login y la actualización de perfil de la app móvil, y se implementó localmente la fase 1. Las propuestas visuales del portafolio siguen pendientes; el login nuevo sí se revisó en navegador a ancho de escritorio y 390 px.

## Estado por fases

| Fase | Entrega | Estado |
|---|---|---|
| 1 | Login unificado, autorización, panel y edición de perfil/redes | Implementada localmente; pendiente aceptación con cuenta real |
| 2 | Proyectos, galerías, habilidades, base español/inglés y descarga del CV | Implementada localmente; ver FASE-2-RESULTADO.md |
| 3 | Blog privado con editor visual/HTML y previsualización | Implementada localmente; ver FASE-3-RESULTADO.md; pendiente aceptación con cuenta real |
| 4 | Mejoras de distribución, animación y accesibilidad del portafolio | Implementada localmente; revisión de seguridad y pendientes en FASE-4-RESULTADO.md |
| 5 | Publicación del blog y SEO | Implementada localmente; activación y despliegue pendientes, ver FASE-5-RESULTADO.md |

La fase 0 del desglose técnico es una verificación previa, no una entrega adicional: se revisó compatibilidad local sin migrar datos. Inventario de producción y respaldo siguen siendo prerrequisitos de futuras migraciones.

### Fase 1 — alcance implementado

- `/admin/login` reutiliza Firebase Auth configurado en `main.ts`, correo/contraseña y claim booleano `admin`.
- Sesión web por pestaña, guards de entrada y rutas hijas, denegación de cuentas sin permiso y logout.
- Layout separado del menú público; no se muestra login ni controles de edición en el portafolio anónimo.
- `/admin/profile`: nombre, profesión, descripción, foto por URL HTTPS y redes; validación, estados de carga/guardado/error y aviso de cambios sin guardar.
- Transacción sobre `infoProfile/nullPointer` con comparación de los campos editables, escritura parcial y `updatedAt` del servidor. No se modifican contadores ni campos desconocidos del móvil.
- Perfil público consume `socialLinks` de forma reactiva, con fallback a enlaces históricos si el campo no existe.
- Durante una renovación del token se oculta el panel sin destruir un formulario en edición; pérdida confirmada de autorización elimina su estado privado.
- Verificado móvil: `UserApiServices` usa `update` para documentos existentes, `PersonalInfoDTO` coincide con los cuatro campos base y el ID configurado es `nullPointer`. No fue necesario editar la app móvil.

**Validación:** 63 pruebas focalizadas exitosas (55 nuevas y 8 de regresión de portada/perfil); build de producción exitoso; ESLint focalizado sin errores ni advertencias. Los fixtures públicos existentes emiten una advertencia AngularFire por inicialización fuera de contexto de inyección, sin fallos. Acceso anónimo a `/admin` redirige a login y correo inválido muestra error sin enviar credenciales. No se inició sesión con una cuenta real, ni se ejecutó escritura multi-dispositivo o prueba de reglas en Emulator. No hubo despliegue, cambios de claims ni cambios de reglas.

**Aceptación pendiente:** entrar con tu cuenta del móvil y probar perfil/redes; validar permisos desplegados y comportamiento real web/móvil antes de publicar. Blog y subida de imágenes aún no se implementan.

## 2. Diagnóstico de la estructura actual

### Sitio

- Angular organizado por funcionalidades: perfil, habilidades, proyectos, certificados, contacto, términos y una demo. Las rutas cargan componentes bajo demanda.
- El sitio usa navegación entre páginas; no es actualmente una landing con todas las secciones apiladas. No propongo cambiar ese patrón sin necesidad.
- La portada combina foto y enlaces personales con nombre, profesión y descripción. Conservaremos el fondo y la composición existentes.
- Las tarjetas de proyectos muestran imagen cuadrada de 180 px y título superpuesto; el acceso al proyecto está conectado por clic en el componente.
- Ya existen efectos hover y recursos Lottie. La mejora debe unificar el movimiento, no añadir animaciones por todas partes.
- Al inicio no había rutas de blog ni administración; la fase 1 añadió `/admin/login` y `/admin/profile`. Blog sigue pendiente.

### Firebase y datos

| Recurso local | Uso actual | Implicación para el plan |
|---|---|---|
| `infoProfile/nullPointer` | Nombre, profesión, descripción, imagen y contadores | Reutilizar documento; agregar campos opcionales |
| `last-projects` | Lectura pública; escritura con claim `admin` | No renombrar colección ni cambiar permisos sin migración |
| `last-certificates` | Lectura pública; escritura administrativa | Integrarlo al panel respetando su contrato |
| `skills` | Reglas con lectura sólo si `published == true` | El componente actual usa listas locales; conectar datos con fallback durante migración |
| `terms` | Lectura pública y escritura administrativa | Administración posterior, si la necesitas |
| `emails` | Creación pública con validación básica; lectura administrativa | Posible bandeja privada; revisar prevención de abuso |
| Storage | Lectura pública global; escritura administrativa de imágenes menores a 10 MiB | Separar recursos públicos de futuros recursos privados |

Hallazgos concretos:

1. `Project` ya contiene `urlImg`, `description`, `urlRepo`, `urlPlay` y `gallery: string[]`: no hace falta inventar de nuevo las imágenes o enlaces existentes.
2. La consulta de proyectos ordena por `createdAt desc`, pero el modelo TypeScript no declara `createdAt`. Debe formalizarse el tipo y verificarse que todos los documentos lo tengan antes de cualquier migración.
3. `published` es opcional en proyectos, pero las reglas y consultas actuales no lo usan para ocultarlos. No asumir que hoy existen borradores privados.
4. Las habilidades y enlaces sociales están definidos en código. Guardar un objeto FontAwesome en Firestore no es el contrato adecuado: usar una clave de icono y resolverla en cada cliente.
5. La regla de lectura de habilidades no da acceso especial al administrador a borradores. El panel necesitará esa excepción.
6. Storage valida `request.resource` para todas las escrituras. El borrado debe tener una regla administrativa independiente, pues no dispone del nuevo recurso que se valida al subir.

## 3. Mejoras de distribución, sin rediseño

### Portada

- Mantener foto, fondo, nombre y profesión.
- Dar mayor prioridad a una frase breve sobre qué haces y qué aportas.
- Colocar debajo del resumen dos acciones: **Ver proyectos** y **Contactar**. Redes sociales como acciones secundarias junto a la foto o después de los botones en móvil.
- Opcional: una pequeña fila de tecnologías principales y un proyecto destacado, sin convertir la portada en un catálogo.
- Mantener un solo título principal y una lectura clara: nombre → propuesta profesional → acciones → descripción ampliada.

### Proyectos

- Conservar la identidad de las tarjetas, pero dar al nombre una zona estable y legible fuera de la imagen o sobre una franja de contraste suficiente.
- Mostrar descripción breve y hasta tres etiquetas tecnológicas; no depender del hover para información importante.
- La tarjeta lleva al detalle; acciones de repositorio, demo o tienda tienen controles propios, sin clics anidados ambiguos.
- Detalle: portada → resumen → tecnologías → galería → explicación del problema/solución → enlaces.
- Galería con miniaturas, navegación por teclado, textos alternativos, imágenes con dimensiones reservadas y carga diferida cuando corresponda.
- Conservar el orden cronológico; agregar un destacado en portada no implica reordenar toda la colección.

### Habilidades y navegación

- Agrupar habilidades por categorías como móvil, frontend, backend y herramientas, adaptadas a las categorías reales que ya tengas.
- Preferir contexto y proyectos relacionados a porcentajes arbitrarios de dominio.
- Mantener el menú actual. Blog no aparecerá hasta activación; cuando se publique, situarlo después de Proyectos o Certificados y antes de Contacto.
- Acceso a administración mediante `/admin`, sin ocupar una posición protagonista del portafolio.

## 4. Animación propuesta

| Elemento | Movimiento | Duración orientativa |
|---|---|---|
| Contenido al entrar a una página | Opacidad + desplazamiento vertical de 8–12 px | 220–320 ms |
| Tarjetas visibles por primera vez | Entrada escalonada, máximo pocas tarjetas | 40–60 ms entre tarjetas |
| Hover y foco en tarjetas | Elevación de 2–4 px y sombra discreta | 150–200 ms |
| Botones | Cambio de color y presión breve | 120–180 ms |
| Galería o diálogo | Fundido, sin grandes zooms | 180–240 ms |
| Guardado en panel | Estado “Guardando”, confirmación y error claro | Sin bloquear artificialmente |

Reglas: animar principalmente `transform` y `opacity`; evitar movimiento continuo de fondo, paralaje invasivo y animaciones de dimensiones. No ocultar contenido hasta que una animación termine. Añadir soporte global para `prefers-reduced-motion`, también para Lottie. Dar feedback equivalente a teclado y táctil; hover no debe ser un requisito.

## 5. Panel web

### Acceso y visibilidad — aclaración del alcance

Actualmente la página no tiene login; incorporarlo es parte de la primera fase, no una capacidad existente. El portafolio publicado seguirá siendo público y no requerirá iniciar sesión.

- El login estará en una ruta dedicada `/admin/login`, sin formulario ni botón protagonista en la portada y sin registro público de usuarios.
- Sólo después de autenticar y verificar el claim `admin` se mostrarán Panel, Editar, Crear, Eliminar, ajustes del blog y previsualizaciones privadas. Estar autenticado sin autorización administrativa no basta.
- Esperar a que Firebase resuelva la sesión y los permisos antes de renderizar controles privados, evitando que aparezcan brevemente a visitantes.
- El acceso directo a `/admin` sin sesión llevará al login; una sesión sin permisos mostrará acceso denegado. Las reglas de Firestore y Storage también rechazarán las operaciones no autorizadas.
- Al cerrar sesión se limpiará el estado privado en memoria y se ocultarán inmediatamente los controles; no habilitar caché persistente de borradores sin evaluar su limpieza y riesgo en equipos compartidos.
- La sesión de la app móvil no inicia automáticamente una sesión en el navegador: ambos clientes compartirán la identidad Firebase, pero cada uno autenticará su propia sesión.

**Aceptación adicional:** visitante sin login ve únicamente el sitio público; usuario autenticado sin claim no ve ni usa edición; administrador autenticado sí puede administrar; después del logout no quedan vistas privadas accesibles.

### Autenticación unificada con la app móvil — verificada

Se revisó la app actual en `C:/Users/ricar/AndroidStudioProjects/NullSiteApp`, no sólo el repositorio antiguo `Android/NullSiteAdmin`.

- `data/auth/remote/AuthApiServices.kt`, método `login`, utiliza `Firebase.auth.signInWithEmailAndPassword(email, password)` y devuelve el UID y correo de Firebase.
- `domain/auth/AuthRepoImpl.kt` delega el login al origen remoto y conserva los datos de autenticación localmente. Esa copia local no sustituye una sesión Firebase válida ni la autorización del servidor.
- `AuthApiServices.logout` llama a `auth.signOut()`.
- `app/google-services.json` móvil y `src/environments/environment*.ts` web apuntan a **`nullpointer-716ae`**. Por tanto, la propuesta reutiliza el mismo directorio Firebase Authentication, no otro backend de usuarios.

**Plan concreto:**

1. Añadir Firebase Auth al cliente web usando la instancia del proyecto ya configurado.
2. Implementar `/admin/login` con correo y contraseña mediante `signInWithEmailAndPassword`, igual que móvil. No usar `createUserWithEmailAndPassword`, no agregar registro público ni una colección de contraseñas.
3. Usar tu cuenta existente: mismo correo, contraseña, UID y custom claim `admin`. No duplicar cuentas por plataforma.
4. Resolver sesión con el SDK y verificar `admin` desde el ID token para habilitar el panel. Las reglas siguen siendo la autoridad. El método móvil revisado autentica y devuelve identidad, pero no comprueba ese claim allí; incluir una verificación equivalente en móvil como parte de la alineación de permisos, no asumir que ya existe.
5. Añadir recuperación de contraseña mediante Firebase, si se desea: actualizaría las credenciales de la misma cuenta para ambos clientes.
6. Configurar persistencia de sesión web explícitamente: por sesión como base para el panel; recordar dispositivo sólo como opción deliberada. Cerrar sesión en web será local al navegador; no prometer cierre global del móvil.
7. Probar con la cuenta existente en ambos clientes y comparar UID/proyecto/claim, sin almacenar ni registrar contraseñas o tokens.

**Qué significa unificado:** un solo sistema de identidad, una sola cuenta y una misma política de permisos. La pantalla de entrada se adapta a cada plataforma y las sesiones son independientes; no se copiarán tokens del móvil al navegador.

Si además quieres acceder al panel aprobándolo desde el móvil sin escribir contraseña, sería una fase opcional de vinculación por QR, con backend confiable, desafío de corta duración y uso único, confirmación explícita y credencial de sesión emitida por servidor. No es necesario para reutilizar la cuenta actual ni se incluye en la primera versión.

**Pendiente antes de implementar:** verificar proveedor habilitado y cuenta/claim actuales en Firebase desplegado, inicialización Auth web, dominio autorizado y restauración de sesión móvil. Esta revisión verificó código/configuración local; no inició sesiones ni modificó usuarios.

Referencias: [login web por correo y contraseña](https://firebase.google.com/docs/auth/web/password-auth) y [persistencia de sesión web](https://firebase.google.com/docs/auth/web/auth-state-persistence).

### Rutas del panel

```text
/admin/login
/admin
/admin/profile
/admin/projects
/admin/projects/:id
/admin/skills
/admin/certificates
/admin/blog
/admin/blog/:id
/admin/settings
```

Usar un layout administrativo independiente del menú público y carga diferida.

### Primera versión

- Inicio de sesión con Firebase Authentication y acceso exclusivamente con claim `admin` existente. No crear un sistema paralelo de contraseñas ni permitir asignar ese claim desde el navegador.
- Editar perfil y enlaces sociales.
- Crear y editar proyectos, portada, galería, etiquetas y enlaces.
- Administrar habilidades y certificados.
- Crear entradas del blog, guardar borradores y ver una previsualización privada.
- Aviso al salir con cambios sin guardar, validaciones por campo, progreso de subida y confirmación al eliminar.
- Mostrar fecha de última modificación. Detectar cambios concurrentes: si móvil modificó un documento desde que se abrió en web, advertir antes de sobrescribir; una transacción con revisión funciona sólo si ambos clientes respetan el contrato.

Un guard de Angular protege la navegación, pero las reglas Firebase son la barrera real para los datos.

## 6. Blog preparado pero no visible

### Dos controles independientes

1. `siteSettings/public.blogEnabled = false`: desactiva navegación, sección de portada y acceso público al blog.
2. Cada entrada tiene `status: draft | published | archived`: controla su publicación individual.

Mientras `blogEnabled` sea falso, sólo administradores podrán leer las entradas, aunque una tenga estado publicado. La protección debe existir en Firestore, además de la interfaz. Una URL directa no debe revelar contenido.

### Modelo propuesto: `posts/{id}`

- `title`, `slug`, `excerpt`, `coverImage`.
- `contentHtml`, `contentFormat: html`, `contentVersion`.
- `tags: string[]`, `status`.
- `createdAt`, `updatedAt`, `publishedAt`, `authorUid`, `revision`.
- Metadatos SEO opcionales: `seoTitle`, `seoDescription`.

Definir unicidad de slug y acceso por slug antes de implementar; no confiar sólo en una validación visual del formulario. Para evitar que editar una entrada publicada cambie el texto público antes de pulsar Publicar, guardar la versión de trabajo separada de la versión publicada. Elegir ese flujo en la primera fase; no añadir un historial completo de revisiones si no se necesita.

### Editor visual y modo HTML

- Pestañas **Visual**, **HTML** y **Vista previa**.
- Soportar subtítulos `h2/h3`, párrafos, negritas, listas, citas, enlaces, imágenes y bloques de código. El título de la entrada genera el `h1`.
- Las etiquetas del artículo son metadatos separados de las etiquetas HTML.
- Definir HTML seguro como formato de intercambio; elegir el editor tras una prueba de ida y vuelta Visual → HTML → Visual para verificar que no destruye contenido admitido.
- HTML no significa ejecutar código: bloquear scripts, eventos `onclick/onerror`, URLs peligrosas y embeds arbitrarios. Aplicar una lista de elementos/atributos admitidos y conservar la sanitización de Angular; no usar `bypassSecurityTrustHtml` como atajo.
- Código de ejemplo se representa como texto escapado dentro de `pre/code`, no como HTML ejecutable.
- Mostrar qué contenido se eliminó o ajustó por seguridad; no prometer conservar cualquier HTML pegado.
- Vista previa con el mismo renderizador y estilos del lector público, sin acceso anónimo a borradores.

Antes del lanzamiento público: listado paginado, detalle, metadatos, enlaces compartibles, sitemap y decisión sobre prerenderizado/SSR para indexación. No es necesario resolver SEO público para el primer editor privado.

## 7. Evolución compatible de proyectos y habilidades

### Proyectos

Mantener `urlImg`, `urlRepo`, `urlPlay`, `description` y `gallery: string[]` durante la transición. Añadir opcionalmente:

- `summary`, `descriptionHtml`, `technologyIds: string[]`.
- `links: { label, url, type }[]` para demo, web, documentación u otras tiendas.
- `galleryItems: { url, storagePath?, alt, caption?, order }[]`.
- `featured`, `createdAt`, `updatedAt`, `revision`, `schemaVersion`.

La web debe leer primero el formato enriquecido y usar los campos anteriores como fallback. La app móvil deberá preservar campos que no conoce al guardar; un reemplazo completo del documento podría borrar las nuevas propiedades. Verificar esto antes de habilitar la edición web.

No activar borradores de proyectos cambiando directamente a `published == true`: documentos históricos sin ese campo podrían desaparecer. Primero inventariar y respaldar, migrar explícitamente, actualizar ambos clientes y probar reglas/consultas.

### Habilidades

Modelo sugerido: `name`, `category`, `iconKey`, `colorToken`, `description?`, `relatedProjectIds?`, `sortOrder`, `published`, `updatedAt`.

Migrar las listas locales a documentos de `skills`, conservando categorías y orden actuales. Cada cliente traduce `iconKey` a su librería de iconos. Mantener fallback local hasta confirmar que los datos migrados están completos.

## 8. Seguridad y archivos

- Reutilizar el claim administrativo y validar tipos, tamaños y campos permitidos en nuevas escrituras.
- Permitir al administrador leer borradores; visitantes sólo contenido publicado y blog habilitado. Las consultas públicas deben incluir los filtros coherentes con las reglas: Firestore no filtra automáticamente los resultados prohibidos.
- Reservar ajustes públicos para información no sensible; separar configuraciones privadas.
- Organizar nuevas imágenes por entidad: `projects/{id}/...` y `blog-drafts/{id}/...`; separar archivos públicos y privados.
- La lectura pública actual de todo Storage no sirve para borradores confidenciales. Revisar además los enlaces de descarga con token: no tratarlos como enlaces privados ni guardarlos en documentos públicos. La previsualización privada debe descargar con autenticación; al publicar se promueven los recursos a un espacio público.
- Límites de formato, dimensiones y peso, compresión antes de subida y textos alternativos. Los 10 MiB actuales son techo de seguridad, no un objetivo de peso por imagen.
- Regla específica de borrado administrativo; eliminación de imágenes con confirmación y comprobación de referencias para no romper contenido compartido.
- Revisar límites del formulario de contacto y mecanismos antiabuso antes de ampliar la bandeja administrativa.

## 9. Fases y criterios de aceptación

### Ampliación del alcance — español/inglés y currículum

Estas dos funciones se incorporan a la fase 2; no requieren esperar a publicar el blog. Por ahora sólo están planificadas.

#### A. Sitio en español e inglés

- Selector visible **ES / EN** en la navegación, también accesible en móvil, sin banderas como única identificación. Mantener la misma página al cambiar idioma y no exigir login.
- Propuesta de URLs compartibles: `/es/home`, `/en/home` y equivalentes para proyectos, habilidades, certificados y contacto. Mantener redirecciones de las URLs actuales para no romper enlaces. `/admin` conservará su ruta, con interfaz traducible sin crear otra sesión ni otro panel.
- Prioridad: idioma explícito en URL → elección guardada → idioma compatible del navegador → español. Una URL compartida siempre prevalece sobre la preferencia local.
- Separar traducciones de interfaz (menús, botones, formularios, validaciones, carga, errores y accesibilidad) del contenido editorial en Firebase. Elegir la solución Angular de internacionalización al implementar, verificando mantenimiento y cambio de idioma; no añadir dependencias sólo para el plan.
- Extender datos sin sustituir campos actuales: `translations.es` y `translations.en` para profesión/descripción de perfil, título/resumen/descripción de proyectos y textos de habilidades. Nombres propios, URLs e identificadores técnicos no se traducen automáticamente.
- En el panel, pestañas Español / English con estado de traducción por campo. Guardar únicamente los campos modificados y conservar los que edita el móvil, que inicialmente puede no conocer `translations`.
- Auditar el idioma de contenido histórico antes de asignar su idioma base: no asumir que todos los textos existentes están en español. Si falta una traducción, mostrar el contenido base disponible sin borrar ni inventar texto; el panel debe indicar qué falta.
- No realizar traducciones automáticas ni publicarlas sin revisión. El blog privado nacerá con metadatos de idioma; traducciones de artículos podrán ser opcionales y sólo se mostrarán cuando estén publicadas y autorizadas.
- Actualizar `html lang`, formatos de fecha y metadatos según idioma. Antes del lanzamiento público, decidir canonical/hreflang y sitemap por versión para evitar páginas duplicadas mal indexadas.

**Aceptación:** cambiar ES/EN conserva la sección; recargar o compartir URL conserva idioma; enlaces antiguos funcionan; formularios y mensajes cambian de idioma; contenido sin traducción tiene fallback definido; no se pierde información al editar desde móvil. Revisar textos largos en móvil y lectores de pantalla.

#### B. Descarga del currículum

- Añadir **Descargar CV** como acción secundaria en la portada, junto a Ver proyectos, sin competir con tres botones principales. Puede repetirse discretamente en Contacto. Descarga pública, sin autenticación.
- Admitir PDF en español y, si lo proporcionas, otro en inglés. Descargar la versión correspondiente al idioma del sitio; si sólo existe una, indicarlo expresamente, por ejemplo “Descargar CV (español)”. No traducir ni generar el documento sin una solicitud adicional.
- En el panel: subir/reemplazar PDF, identificar idioma, mostrar nombre/tamaño/fecha, previsualizar y activar o retirar su publicación. Si no existe un CV activo, ocultar el botón público en lugar de mostrar un enlace roto.
- Modelo propuesto: metadatos públicos en `siteSettings/public.resume.es` y `.en`, con `storagePath`, `fileName`, `sizeBytes`, `updatedAt` y `enabled`; mantener sólo información que pueda ser pública. Los archivos van en un espacio específico, por ejemplo `resumes/{locale}/{version}.pdf`.
- La regla Storage actual sólo admite imágenes: habrá que permitir PDFs **únicamente** en el espacio de currículums, con escritura/borrado administrativo, límite explícito de tamaño y lectura pública sólo para archivos destinados a publicación. No ampliar a cualquier archivo ni a cualquier ruta.
- Separar las reglas de rutas para que un permiso global más amplio no anule restricciones específicas. Los PDFs de trabajo privados no pueden usar la lectura pública global actual ni enlaces de descarga con token considerados secretos.
- Para la primera versión, subir exclusivamente PDFs preparados para publicación, con confirmación antes de hacerlos públicos. Si se necesitan borradores privados, implementar un espacio privado separado antes de aceptarlos.
- Validar extensión, MIME PDF y tamaño (propuesta: máximo 10 MiB); no usar el MIME como garantía de seguridad del contenido. Entregar como descarga con nombre controlado, sin depender sólo del atributo HTML `download` para archivos de otro origen.
- Reemplazo seguro: subir una nueva versión → confirmar éxito → actualizar referencia → retirar la anterior tras verificar que no está referenciada. Si falla la subida, mantener el CV publicado anterior.
- Antes de publicar, revisar que el CV no incluya datos personales que no quieras hacer públicos. Retirar el botón no garantiza revocar un archivo o enlace ya compartido; definir también la retirada del archivo cuando sea necesaria.

**Aceptación:** visitante descarga un PDF válido sin login; se selecciona idioma correcto o fallback indicado; ausencia de CV no produce botón roto; fallo al reemplazar conserva la versión anterior; usuario sin `admin` no sube, reemplaza ni elimina archivos. Verificar nombre, tipo de respuesta y descarga en móvil/escritorio.

### Fase 0 — Verificar contrato y respaldar

Inventario de campos reales, reglas desplegadas, Storage y operaciones de escritura móvil. Respaldo antes de migraciones. Confirmar qué campos editarás desde cada cliente.

**Aceptación:** contrato documentado, estrategia de compatibilidad y restauración; ninguna modificación de producción sólo para elaborar el plan.

### Fase 1 — Base administrativa y perfil

Autenticación, autorización, layout independiente, formularios de perfil y redes, estados de guardado.

**Aceptación:** visitante y usuario sin claim no leen datos privados ni escriben; administrador edita perfil; web y móvil reflejan cambios sin pérdida de campos.

### Fase 2 — Contenido editable, idiomas y currículum

**Estado: implementación local realizada.** Resultado, pruebas, limitaciones y checklist de lanzamiento en [FASE-2-RESULTADO.md](FASE-2-RESULTADO.md). Pendiente despliegue autorizado, PDFs reales y validación integrada web/móvil.

Dividir esta fase en entregas pequeñas:

1. **2A — Base ES/EN:** navegación y textos de interfaz, compatibilidad con URLs actuales y contrato de traducciones antes de ampliar los formularios.
2. **2B — Proyectos y habilidades:** CRUD, galería enriquecida, enlaces, tecnologías, migración gradual de habilidades, campos traducibles y control de concurrencia.
3. **2C — Currículum:** subida administrativa de PDF preparado para publicación, metadatos por idioma y descarga pública desde portada/contacto.

**Aceptación:** documentos antiguos siguen visibles, orden cronológico se conserva, enlaces se validan y la app móvil no elimina propiedades nuevas. Cumplir también los criterios ES/EN y CV del apartado de ampliación; estas funciones deben poder publicarse sin activar Blog.

### Fase 3 — Blog privado

**Estado: implementación local realizada.** Acceso `/admin/blog`, editor Visual/HTML, vista previa autenticada, borradores e imágenes restringidos a administrador. Sin publicación ni navegación pública. Pruebas y prerrequisitos en [FASE-3-RESULTADO.md](FASE-3-RESULTADO.md).

Modelo, reglas, editor visual/HTML, vista previa y activación global deshabilitada.

**Aceptación:** no aparece Blog en navegación; acceso anónimo directo y consultas a borradores se rechazan; cargas HTML maliciosas no se ejecutan; los recursos privados tampoco se filtran.

### Fase 4 — Pulido visual y movimiento

Aplicar acciones de portada, jerarquía de tarjetas, animaciones y accesibilidad, utilizando los estilos existentes.

**Aceptación:** revisión real en móvil/escritorio, teclado y movimiento reducido; sin saltos de imagen ni pérdida de información por hover.

### Fase 5 — Lanzamiento del blog, sólo cuando lo decidas

Activar navegación, lectores públicos, SEO y publicación de recursos.

Implementación local disponible: `/es/blog`, `/en/blog` y detalle por slug; snapshots públicos separados del borrador,
publicación/retiro explícitos en el panel y activación independiente `siteSettings/public.blogEnabled` (por defecto cerrada).
SEO cliente con canonical, hreflang de páginas generales, Open Graph y JSON-LD de artículos. No se activó producción.
Ver limitaciones de SPA, dominio/sitemap, pruebas y checklist en `FASE-5-RESULTADO.md`.

**Aceptación:** únicamente versiones publicadas son accesibles; borradores continúan privados y desactivar el blog revoca lectura pública de entradas.

Orden recomendado: contrato → panel → base ES/EN → contenido editable → descarga CV → blog privado → pulido visual → lanzamiento. Las mejoras visuales pequeñas pueden adelantarse sin cambiar el contrato de datos.

## 10. Pruebas previstas

- Idiomas: selección/persistencia/URL, cambio conservando sección, fallback editorial, traducciones de validaciones y compatibilidad con documentos móviles sin `translations`.
- Currículum: PDF por idioma, fallback explícito, botón ausente sin archivo, descarga anónima, reemplazo fallido y reglas de subida/borrado/privacidad.

- Firebase Emulator: visitante, usuario normal y administrador; blog habilitado/deshabilitado; entradas borrador/publicadas; subida y borrado de imágenes.
- Angular: guards, formularios, fallbacks, enlaces inválidos y renderizado seguro de HTML.
- Integración web/móvil: editar el mismo documento desde ambos clientes, preservar propiedades desconocidas y detectar conflicto de versiones.
- E2E: iniciar sesión → crear proyecto → subir imágenes → editar desde móvil → verificar web; crear blog → previsualizar → comprobar inaccesibilidad anónima.
- Accesibilidad: foco, teclado, diálogos, contraste y movimiento reducido.

## 11. Referencias técnicas

- [Seguridad y sanitización de Angular](https://angular.dev/best-practices/security): HTML editable no debe desactivar las protecciones XSS.
- [Consultas seguras de Firestore](https://firebase.google.com/docs/firestore/security/rules-query): consultas y reglas deben coincidir; las reglas no son filtros.

## Continuación acordada: fases 6–10

- **Fase 6 — Accesibilidad y responsive:** implementada localmente. Resultado, pruebas y límites de aceptación en `FASE-6-RESULTADO.md`.
- **Fase 7 — Presentación legal y HTML seguro:** implementada localmente; lector responsive, índice y HTML normalizado conservando URLs. Resultado y límites en `FASE-7-RESULTADO.md`; editor privado en fase 8.
- **Fase 8 — Documentos legales en el portal:** implementada localmente; estructura básica de formato, edición visual/HTML, borradores privados, vista previa compartida, publicación e historial con autenticación existente. Pruebas y aceptación/despliegue pendientes en `FASE-8-RESULTADO.md`.
- **Fase 9 — Contenido y medios:** base técnica implementada localmente y propuesta editorial ES/EN preparada. Pendiente aprobar/aplicar textos, aportar PDFs definitivos y completar descripciones visuales. Auditoría, pruebas y cierre editorial en `FASE-9-RESULTADO.md`.
- **Fase 10 — Seguridad y publicación:** dependencias y antispam implementados localmente. Los cuatro avisos se resolvieron con Vitest actualizado: auditoría completa a cero y 258 pruebas correctas (`AVISOS-RESUELTOS.md`). Falta integración del workflow y aceptación/configuración remota (`CAMBIOS-PREDEPLOY.md`). Sin deploy.

## Key Learnings (histórico):

1. Proyectos ya tiene galerías y enlaces; la ampliación debe conservar los campos que consume la app móvil.
2. Ocultar Blog exige permisos de datos y recursos, no únicamente quitar el enlace del menú.
3. Habilidades y redes aún dependen de código; volverlas editables implica migrar su fuente de datos.
4. Tras la fase 1, las redes ya admiten edición en Firestore con fallback histórico; habilidades siguen locales.
5. La renovación del token no debe destruir borradores: el panel se oculta temporalmente y conserva el editor hasta resolver permisos.
6. ES/EN debe separar textos de interfaz y contenido Firebase sin romper campos históricos que usa el móvil.
7. Descargar CV requiere un permiso Storage acotado a PDFs; la regla actual de imágenes no cubre esa función.
