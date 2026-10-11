# Fase 4 — UX y revisión de seguridad

## Entrega local

- Conservados fondos negros/rojos, navegación por páginas y datos actuales.
- Portada con dos columnas en escritorio, composición apilada en móvil, mejor tipografía y acciones «Ver proyectos» / «Contactar» junto al CV cuando esté habilitado.
- Tarjetas con títulos siempre visibles, rejillas adaptables e imágenes diferidas; hover discreto sin ampliar tarjetas sobre sus vecinas.
- Menú con botones nativos, estado expandido, Escape y devolución del foco. Enlace para saltar al contenido y foco visible; un único landmark principal.
- Entrada suave de secciones y servicio reactivo de movimiento reducido. En modo reducido se sustituyen Lottie de carga por contenido estático. Foto sin demora artificial y fallback si falla.
- Formulario con campo de email estilizado, foco visible y textarea redimensionable.
- Blog sin publicar y edición protegida por la misma identidad Firebase del móvil y claim administrativo.

## Seguridad: hallazgos y correcciones

| Prioridad | Hallazgo | Resultado |
|---|---|---|
| Alta | Términos públicos usaban `bypassSecurityTrustHtml` con HTML de Firestore | Eliminado el bypass; Angular sanitiza. Regresión comprueba conservación de títulos y eliminación de scripts/eventos |
| Alta | Contacto enviaba campos que las reglas rechazaban | Payload explícito, reglas con whitelist, límites y timestamps del servidor; lectura privada. Siete nuevas pruebas de reglas |
| Media | Servicio público de contacto mantenía suscripción innecesaria a mensajes privados | Eliminada; no se expone bandeja pública |
| Media | Error de contacto podía registrar detalles del SDK en Analytics | Sustituido por evento genérico sin mensaje de error ni datos del formulario |
| Media | Faltaban encabezados de protección en Hosting | Añadidos nosniff, política de referente, DENY para frames, permisos restrictivos y CSP parcial |
| Crítica (herramienta de build) | Piscina vulnerable por prototype pollution/RCE | Override explícito a 5.3.2; build y pruebas vuelven a pasar |

Los encabezados sólo tendrán efecto después de desplegar Firebase Hosting. La CSP limita objetos, base y framing; **no** es una política completa de scripts/conexiones. No se endureció a ciegas para evitar romper Firebase, reCAPTCHA y animaciones.

## Riesgos pendientes antes de publicar

1. **Alta: dependencias.** Auditoría inicial: 70 alertas (5 críticas). Tras actualizaciones compatibles y override: 34 (0 críticas, 30 altas, 3 moderadas, 1 baja). Sólo dependencias de ejecución: 14 (13 altas, 1 moderada). Angular y dependencias Firebase siguen señaladas. La actualización explícita de Angular 20.3 a parches recientes falló por resolución de peers (`ERESOLVE`); no se usó `--force` ni se aceptaron downgrades sugeridos por audit. Resolver el conjunto Angular/AngularFire y repetir auditoría/pruebas es trabajo pendiente, no un riesgo cerrado. Los conteos incluyen paquetes afectados indirectamente y no equivalen a 34 vulnerabilidades explotables confirmadas.
2. **Alta: abuso del contacto.** El CAPTCHA se exige en la interfaz, pero no se valida en un backend. Un cliente puede omitirlo y escribir directamente. Implementar endpoint que valide el token, límites por origen/usuario y App Check; luego cerrar la creación directa pública. No activar enforcement sin preparar también el móvil.
3. **Producción no verificada.** Revisar reglas realmente desplegadas, claims `admin: true`, dominios autorizados, CORS de Storage y autenticación con tu cuenta real. No se desplegó, publicaron artículos ni cambiaron cuentas o claims.
4. Aplicar una CSP completa primero en report-only, con inventario real de recursos. Revisar las imágenes legacy públicas antes de guardar contenido privado en rutas antiguas.

## Verificación

- Build de producción correcto tras override de Piscina.
- **131 pruebas Angular exitosas**, incluida sanitización y cambios/limpieza del listener de movimiento reducido. Se estabilizaron fixtures administrativos fijando español, evitando dependencia del idioma persistido por otras pruebas.
- **45 pruebas de reglas exitosas** en Firestore/Storage Emulator: borradores e imágenes privadas, claim booleano, CV publicado/revocado, mensajes válidos y rechazo de escritura adulterada/lectura anónima.
- Navegador: portada a 1280×720 y 390×844; menú móvil abre/cierra con Escape y conserva foco; cambio ES→EN mantiene página y traduce controles. No se realizó aceptación autenticada del panel ni pruebas de envío real.
- ESLint focalizado de servicio de movimiento, términos y email: sin errores, cinco advertencias de formato. Lint global agotó memoria (salida 134); no se considera aprobado.
- Escaneo de patrones de claves privadas/bypass sobre fuentes locales, incluidos archivos no rastreados: sin claves privadas detectadas fuera de entornos; única mención restante de bypass en un comentario del sanitizador del blog, sin invocación. No sustituye un análisis de secretos del historial. La configuración web Firebase no es una credencial administrativa.
- Persisten advertencias Sass `mixed-decls` no bloqueantes.

## Siguiente paso

Aceptar visualmente los cambios y cerrar dependencias/antispam antes de desplegar. La fase 5 (publicación del blog y SEO) sigue pendiente y no activa contenido privado automáticamente.

## Key Learnings:

1. La sanitización de Angular no debe saltarse para HTML editorial almacenado.
2. Un CAPTCHA sólo en frontend no protege una colección con creación pública directa.
3. Movimiento reducido debe detener también animaciones JavaScript, no sólo transiciones CSS.

## Archivos relevantes

- `src/styles.scss`, `src/app/scss/_mixin_globals.scss`: foco, movimiento, secciones y hover.
- `src/app/profile/`, `src/app/projects/`, `src/app/skills/`, `src/app/certificates/`, `src/app/navigation/`: composición, tarjetas y navegación.
- `src/app/services/motion/`: preferencia del sistema y prueba.
- `src/app/terms/terms/`: sanitización pública y regresión.
- `src/app/contact/`, `firestore.rules`, `tests/firebase-rules.mjs`: contrato del formulario y privacidad.
- `firebase.json`: encabezados locales de Hosting.
- `package.json`, `package-lock.json`: actualizaciones compatibles y override Piscina.
