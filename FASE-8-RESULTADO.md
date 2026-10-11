# Fase 8 — Editor legal privado

## Estado

Implementada y probada localmente en **`/admin/legal`**. No se desplegó ni publicó contenido real. Las escrituras de verificación se hicieron únicamente en emuladores y dobles de prueba, nunca en Firebase de producción. No se crearon cuentas ni se cambiaron credenciales o claims.

## Qué incluye

- Nueva entrada **Documentos legales** en el panel existente. Reutiliza `AdminAuthService`, `adminGuard` y el claim booleano `admin: true`; no hay un segundo login ni otro directorio de usuarios. Mismas credenciales/proyecto que la app móvil, no una sesión compartida entre dispositivos.
- Listado de documentos públicos y borradores privados, con identificador permanente y enlace público solo cuando ya existe una publicación.
- Crear documentos con ID automático y editar los existentes **sin cambiar sus URLs**.
- Edición **HTML y visual**, títulos, énfasis, listas y enlaces validados. Estructura básica vacía y ejemplos de formato; no se inventan cláusulas, traducciones, fechas de vigencia ni plantillas jurídicas.
- Normalización explícita con aviso de formatos eliminados/adaptados. Vista previa mediante el mismo lector seguro de la fase 7. El título se recorta en sus extremos al normalizar; el texto legal no se reescribe.
- **Guardar borrador** y **Publicar versión guardada** son acciones separadas. Publicar exige confirmación, una versión guardada y ausencia de cambios pendientes.
- Historial de publicaciones, incluyendo copia de la versión pública anterior. El portal muestra las últimas 20; copiarlas al editor no guarda ni publica automáticamente.
- Advertencia al salir con cambios, controles deshabilitados durante operaciones, errores recuperables, limpieza de datos privados al revocarse acceso y protección frente a respuestas tardías.
- Etiquetas ES/EN y vista previa embebida sin un segundo H1. Comprobación de desbordamiento en contenedores de 320, 768 y 1440 px con texto largo y tabla.

## HTML y seguridad

El editor nunca enlaza HTML crudo directamente al DOM: el modo visual empieza desde HTML reconstruido mediante la lista permitida y Angular lo sanitiza de nuevo. El pegado visual inserta **solo texto**, bloqueando la inserción nativa de HTML/recursos; se bloquean arrastres y navegación accidental por enlaces del editor. Para pegar formato rico, se usa el textarea HTML y se normaliza antes de guardar.

El servicio vuelve a validar y sanear antes de escribir. No permite contenido vacío/activo solamente, títulos inválidos, rutas inseguras ni documentos por encima de los límites. Hay un límite adicional de **900.000 bytes UTF-8** para los objetos con contenido nuevo y copia anterior, dejando margen bajo el límite de documento Firestore. No se usa `bypassSecurityTrustHtml`.

Las reglas nuevas validan estructura, tamaños, revisiones y tiempo de servidor. **No analizan HTML**: un cliente administrador alternativo puede escribir HTML fuera del editor; por eso el lector público siempre vuelve a sanearlo. La app móvil no fue modificada en esta fase. Ningún análisis equivale a una garantía de riesgo cero.

## Persistencia y compatibilidad móvil

| Ruta Firestore | Uso | Acceso |
| --- | --- | --- |
| `terms/{id}` | Publicación compatible `title` / `content` | Lectura pública; escritura admin existente |
| `legal-drafts/{id}` | Borrador, revisión, revisión publicada y copia base pública | Solo admin; sin borrado desde clientes |
| `legal-drafts/{id}/history/{version}` | Snapshot publicado y versión anterior | Solo admin; creación únicamente, sin actualización/borrado desde clientes |

Publicar es una transacción: actualiza `title`/`content` con merge (conservando otros metadatos móviles), archiva la versión anterior y actualiza el estado del borrador. Un borrador nuevo no crea un documento público.

Las transacciones comparan la revisión y contenido del borrador, además del título/contenido públicos de referencia. Así se detectan cambios móviles aunque la app no use revisiones web. En un conflicto no se sobrescribe ni se publica parcialmente; las ediciones locales permanecen disponibles. No se capturan automáticamente todas las modificaciones históricas realizadas fuera del portal.

Para reconciliar: conserva tus cambios, recarga para comparar y usa **Partir de versión pública** tras confirmar. Esa acción copia la publicación actual al editor; al guardar se verifica otra vez que esa base no haya cambiado. Después aplica tus cambios, normaliza, guarda y publica explícitamente. No existe combinación automática ni borrado de documentos legales.

## Pruebas y límites de aceptación

- **33 pruebas nuevas del editor/modelo/servicio**, aprobadas; el servicio usa un límite de transacción sustituible para comprobar efectos sin contactar Firebase.
- **233 pruebas Angular totales**, aprobadas, incluyendo las del lector público.
- **90 pruebas de reglas Firestore/Storage**, aprobadas en proyecto demo aislado: anonimato/usuario móvil/claim falso rechazados, borradores e historial privados, historial inmutable, límites de estructura y publicación transaccional sin escrituras parciales no autorizadas.
- Build de producción aprobado. ESLint de las áreas verificadas: **0 errores y 108 advertencias**; no se afirma que todo el repositorio esté libre de advertencias.
- Navegador real sin sesión: `/admin/legal` redirige a `/admin/login`, sin textarea ni contenido privado.
- **No se inició sesión con una cuenta real ni se publicó un documento real.** La inspección visual del panel autenticado, teclado/lector de pantalla/zoom y prueba entre móvil y web con la cuenta existente siguen siendo una puerta de aceptación antes de producción. Las mediciones de contenedores no sustituyen esa inspección.

## Emuladores y reproducción

Los puertos habituales estaban ocupados por procesos ajenos; no se detuvieron. Se añadió `firebase.emulators.legal.json` con puertos 8185/9295 y hub/log separados. Requiere Java 21 o superior disponible en el entorno del proceso, sin cambiar la configuración global de Java.

```powershell
firebase emulators:exec --config firebase.emulators.legal.json --project demo-nullsite-phase2 --only firestore,storage "node tests/firebase-rules.mjs"
npx ng test --watch=false --browsers=ChromeHeadless --include="src/app/admin/legal/**/*.spec.ts"
npm run build
```

## Antes de usar en producción

1. Revisar y desplegar las nuevas reglas junto con el frontend mediante el procedimiento controlado de fase 10. Si las reglas aún no existen, el panel mostrará un error de permisos; no se debe abrir acceso público para solucionarlo.
2. Probar con la cuenta administradora existente: crear borrador, comprobar que no aparece públicamente, normalizar, publicar de forma deliberada y revisar historial/URL en móvil y web.
3. Revisar el texto jurídico antes de publicarlo. Las ayudas del editor son de formato, no asesoría legal.
4. Continuar **fase 9**: contenido editorial ES/EN, CV real por idioma, portadas/miniaturas y descripciones. **Fase 10** mantiene pendientes dependencias, antispam, permisos y despliegue/aceptación integral de las fases anteriores.

## Archivos relevantes

- `src/app/admin/legal/` — editor visual/HTML, modelo, servicio transaccional y pruebas.
- `src/app/admin/layout/admin-shell.component.html`, `src/app/app.routes.ts` — entrada y ruta privada bajo los guards existentes.
- `src/app/terms/legal-document/` — vista previa embebida reutilizada sin duplicar H1.
- `src/app/i18n/translations.ts` — mensajes ES/EN.
- `firestore.rules`, `tests/firebase-rules.mjs` — permisos y pruebas ampliadas.
- `firebase.emulators.legal.json` — verificación aislada sin interferir con emuladores existentes.

## Key Learnings:

1. Guardar borradores fuera de `terms` evita filtrarlos porque esa colección sigue siendo pública para compatibilidad móvil.
2. Comparar título/contenido públicos en la transacción detecta cambios desde clientes móviles que no conocen revisiones web.
3. Las copias anterior/nueva necesitan un presupuesto UTF-8 conjunto para no superar el límite Firestore aunque cada texto cumpla su límite de caracteres.
4. Pegar texto plano en el editor visual evita activar recursos antes de sanear; el HTML rico se introduce exclusivamente en el textarea y pasa por normalización explícita.
5. La normalización visual no debe recapturar inmediatamente el DOM previo a su renderizado: podría restaurar atributos eliminados en el formulario.

## Session handoff

**Goal:** implementar fase 8 sin separar autenticación ni romper HTML/rutas existentes. **Instructions:** mantener identidad visual, privacidad administrativa y compatibilidad móvil; no publicar ni desplegar automáticamente. **Discoveries:** revisiones móviles ausentes requieren comparación de contenido, límites Firestore se miden en bytes y puertos de emuladores estaban ocupados. **Accomplished:** editor, transacciones, reglas y verificaciones descritas arriba. **Next Steps:** aceptación autenticada real, fase 9 y preparación de despliegue fase 10. **Relevant Files:** lista anterior. Registro durable en este archivo; no se realizaron escrituras de memoria atribuidas a una identidad de sesión no registrada.
