# Qué falta — verificación después de las fases 1–5

## Conclusión

Las funciones principales están implementadas **en el código local**, pero todavía no está cerrado el lanzamiento. Quedan bloqueadores de seguridad, integración real y despliegue. «Implementada localmente» no significa «publicada y aceptada en producción».

Esta revisión contrastó los requisitos originales, rutas, servicios, reglas, formularios, workflow y resultados de fases anteriores. Se ejecutó una auditoría de dependencias nueva. No se modificó funcionalidad ni se desplegó nada.

## Prioridad 0 — antes de publicar

### 1. Resolver dependencias vulnerables

Auditoría actual:

- Total: **34 alertas**, 30 altas, 3 moderadas y 1 baja; ninguna crítica.
- Sólo ejecución: **14 alertas**, 13 altas y 1 moderada.
- Entre los paquetes directos afectados están Angular y Firebase/AngularFire.

Falta resolver versiones compatibles Angular/AngularFire y sus dependencias; la actualización anterior encontró conflictos de peers. No usar `--force` para ocultarlos. Después: instalación reproducible, pruebas, build y auditoría nueva. Estos conteos incluyen dependencias afectadas indirectamente: no equivalen a 34 ataques confirmados.

Evidencia: `package.json`, `package-lock.json`, `npm audit --json`, `npm audit --omit=dev --json`.

### 2. Proteger realmente el formulario contra spam

El formulario escribe directamente con `addDoc` en `emails`. Las reglas validan campos y mantienen privados los mensajes, pero no verifican el CAPTCHA ni limitan frecuencia. Un cliente puede saltarse la interfaz.

Falta un endpoint backend que valide CAPTCHA y aplique límites; luego cerrar la creación pública directa. Evaluar App Check con compatibilidad del móvil antes de exigirlo. Verificar además el envío/notificación real de Cloud Functions: no se inspeccionó ni desplegó ese backend en estas fases.

Evidencia: `src/app/contact/services/email.service.ts`, `firestore.rules`, integración externa referida en README.

### 3. Cerrar el despliegue de Firebase: el workflow actual no despliega reglas

**Hallazgo verificado en esta revisión:** `.github/workflows/deploy-firebase.yml` ejecuta `firebase deploy --only hosting`. Subir la web por ese flujo **no actualiza** reglas Firestore/Storage ni índices.

Falta definir un despliegue controlado de reglas e índices, con revisión y aprobación, antes de activar el blog. No basta con hacer push a `main`: podría desplegar una interfaz nueva contra permisos viejos. Mantener `blogEnabled` desactivado hasta terminar la aceptación.

También faltan comprobaciones de reglas realmente desplegadas, índice compuesto de blog listo, integración Storage→Firestore, CORS, dominios autorizados y respaldo/inventario de datos reales.

## Prioridad 1 — aceptación funcional y contenido

### 4. Probar con tu cuenta real del móvil

El código reutiliza el proyecto Firebase, correo/contraseña y claim booleano `admin: true`; no crea otra cuenta. Cada dispositivo conserva su propia sesión, lo cual es normal.

Falta comprobar con tu identidad real:

- Login y logout; visitante y usuario sin claim bloqueados.
- Edición web y móvil del mismo perfil sin perder campos.
- Conflictos de edición, renovación/revocación de permisos y cambios sin guardar.
- Proyectos, galerías, habilidades y PDFs con Storage/CORS reales.
- Blog: guardar privado → publicar sin activar → activar → editar sin republicar → republicar → retirar → desactivar.

Las pruebas aisladas/Emulator no sustituyen esta aceptación. En la última comprobación de navegador de fase 5 no se pudo consultar la configuración real del blog: la web permaneció cerrada y `noindex`. Falta diagnosticar en el entorno desplegado; no se atribuye una causa sin comprobarla.

### 5. Completar contenido bilingüe y currículums

- **CV:** el editor/subida/descarga por idioma ya existen. Falta subir o verificar tus PDFs reales ES/EN y descargar ambos como visitante. No se publicaron archivos reales durante estas fases; no se afirma que producción carezca de ellos.
- **ES/EN editorial:** cargar/revisar profesión, descripción, proyectos y habilidades en ambos idiomas. El fallback conserva el original, no traduce automáticamente; una página `/es` puede mostrar texto histórico inglés si falta traducción.
- **ES/EN del panel:** aún hay ayudas/errores de perfil escritos sólo en español; la traducción de administración no es exhaustiva. Ejemplo: `admin-profile.component.html` conserva textos de validación y ayuda sin pasar por el diccionario.
- **Blog:** crear las versiones por idioma y revisar título, slug, resumen, etiquetas y alt. Cambiar idioma conserva el slug; si no existe ese artículo en el otro idioma, aparece «Artículo no disponible».

### 6. Cerrar SEO de lanzamiento

Ya existen metadatos dinámicos, canonical, hreflang general, Open Graph, JSON-LD y robots. Falta:

- Confirmar dominio canónico y redirigir aliases/previews.
- Sitemap de publicaciones habilitadas y su referencia absoluta en robots.
- SSR/prerender si se requiere contenido indexable sin JavaScript o previews sociales fiables.
- Respuestas HTTP 404 reales para artículos inexistentes; hoy sigue siendo SPA.
- Validar indexación y retirada/caché, sin exponer borradores.

No se puede considerar terminado el SEO de producción sólo porque las etiquetas del cliente estén correctas.

### 7. Automatizar validación antes del deploy

El workflow actual instala, compila y despliega Hosting, pero **no ejecuta pruebas Angular, Emulator ni lint**. Falta incorporarlas como gate, con versiones reproducibles de Node/Java/Firebase CLI.

`npm run test:rules` usa `firebase` del entorno y la configuración base; las pruebas anteriores requirieron una CLI compatible con Java 17 y puertos alternativos. Normalizar esto para CI y desarrollo, preferiblemente con Java compatible con la CLI fijada.

Última validación de fase 5: **151 pruebas Angular + 67 de reglas exitosas**, build correcto y lint focalizado sin errores. No se repitieron estas suites en esta revisión documental porque no cambió el código. Lint global sigue sin aprobación; había agotamiento de memoria, advertencias de formato y Sass pendientes.

## Prioridad 2 — completar propuestas, no bloqueadores del pedido principal

- **Imágenes:** hoy se verifica MIME/peso (máximo 10 MiB); falta decodificación/dimensiones, compresión y optimización. En galerías el alt se genera con nombre y posición: falta edición individual de alt y reordenado más cómodo.
- **Limpieza de Storage:** publicaciones/subidas canceladas conservan objetos huérfanos. Falta limpieza segura con comprobación de referencias; no borrar a ciegas.
- **Administración adicional:** certificados, términos y bandeja de mensajes no tienen editor web. Son ampliaciones opcionales; perfil, proyectos, habilidades, CV y blog sí tienen panel.
- **Foto de perfil:** se edita por URL HTTPS, no mediante subida directa desde su editor.
- **Blog grande:** lista limitada a 50 publicaciones recientes; paginación/búsqueda todavía no implementadas.
- **Endurecimiento:** CSP completa en report-only antes de enforcement, revisión del namespace legacy público, escaneo de secretos del historial y revisión final de accesibilidad/móviles reales.
- **Entrega:** revisar y organizar los cambios locales, preparar una versión recuperable y un plan de rollback antes del despliegue. No se hicieron commits ni push en esta revisión.

## Orden recomendado

1. Dependencias y compatibilidad reproducible.
2. Backend antispam y gate de pruebas/CI.
3. Despliegue controlado de reglas/índices, con blog apagado.
4. Aceptación con tu cuenta móvil + pruebas públicas reales + CV/traducciones.
5. Dominio/SEO y activación explícita del blog.
6. Pulido adicional de imágenes, administración y limpieza.

## Key Learnings:

1. El workflow actual sólo despliega Hosting: reglas e índices locales no llegarán a producción automáticamente.
2. La interfaz bilingüe y el contenido editorial traducido son entregas distintas; el fallback no garantiza que todos los textos correspondan al idioma de la URL.
3. Las funciones locales están desarrolladas, pero seguridad pendiente y aceptación real impiden declarar cerrado el lanzamiento.
