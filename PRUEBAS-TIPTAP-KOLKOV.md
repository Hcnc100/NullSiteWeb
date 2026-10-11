# Ramas y pruebas de Tiptap/Kolkov

> Actualización: se amplió el sanitizado en esta misma rama. El formato aprobado ya se conserva en el caso probado de ambos editores; ver [SANITIZADO-ENRIQUECIDO-RESULTADO.md](SANITIZADO-ENRIQUECIDO-RESULTADO.md). Lo siguiente documenta el experimento inicial.

## Trabajo guardado

- **Respaldo:** `backup/panel-antes-editores`, commit `38863a9`. Conserva el trabajo previo del sitio/panel, configuración y documentación, sin instalar editores nuevos.
- **Experimento activo:** `experiment/comparar-tiptap-kolkov`, derivado de ese respaldo. Contiene ambos editores en un laboratorio aislado; no sustituye todavía los editores de blog/legales.
- Ramas locales, **sin push ni deploy**. Se excluyeron `.serena`, entornos ignorados, secretos y respaldos de dependencias del commit. La comprobación acotada de patrones sensibles no encontró coincidencias; no equivale a una auditoría completa de secretos.

## Pruébalo tú

La comparación está abierta en el navegador y el servidor local quedó iniciado:

**http://127.0.0.1:4300/editor-lab**

1. Alterna Tiptap/Kolkov; cada editor mantiene su contenido independiente.
2. Escribe y selecciona texto para probar títulos, formatos y tipografía.
3. Pulsa **Guardar local**, recarga la página y pulsa **Recuperar local**.
4. Compara el HTML almacenado con el lector real de legales y la salida del sanitizador público del blog. Ambos se muestran bajo el editor.

Si cierras el servidor:

```powershell
git switch experiment/comparar-tiptap-kolkov
npm ci
npx --no-install ng serve --host 127.0.0.1 --port 4300
```

Para volver al trabajo previo, detén el servidor, cambia a `backup/panel-antes-editores` y ejecuta `npm ci`. No cambies ramas con cambios nuevos sin guardarlos.

## Resultado importante

| Comprobación | Tiptap 3.31.4 | Kolkov 3.4.0 |
|---|---|---|
| Editor montado en Angular 20 | Correcto | Correcto; requiere HttpClient, tema global e iconos locales |
| HTML guardado y recuperado localmente | Correcto | Correcto |
| HTML guardado y recuperado en Firestore emulado | Correcto | Correcto |
| Texto recuperado visible en el lector real de legales | Correcto | Correcto |
| Texto recuperado visible en BlogComponent público real, en prueba aislada | Correcto | Correcto |
| Múltiples títulos, negrita y texto básico | Conservados | Conservados |
| Colores, fuentes y tamaños en la web actual | **Se eliminan por el sanitizado actual** | **Se eliminan por el sanitizado actual** |
| Tipografía al reabrir el editor | Tiptap conserva el tamaño del caso probado en su HTML | El sanitizado por defecto de Kolkov elimina estilos del DOM inicial, aunque el modelo inicial aún los contenga |

**Sí se guarda y sí se recupera texto que puede verse en la web. No está resuelto todavía que se vea con todos los colores, fuentes y tamaños elegidos.** Este límite está probado, no se ha ocultado desactivando sanitizadores.

Las tablas legales del ejemplo se conservan en el lector legal. En blog, el sanitizador actual mantiene su texto pero elimina la estructura de tabla. El laboratorio permite ver esta diferencia.

## Evidencia y alcance

- Suite completa: **61 archivos, 271 pruebas correctas**, Chromium real.
- Pruebas con Firestore emulado: **11 correctas**, incluidas las dos persistencias reales Tiptap/Kolkov y renderizado recuperado.
- Build de producción y TypeScript correctos.
- Auditoría del árbol de dependencias instalado: **0 vulnerabilidades reportadas**.
- Navegador: ambos editores abiertos; guardado/recuperación Tiptap y escritura/formato/guardado/recuperación Kolkov verificados desde la interfaz. Revisión visual en el panel estrecho del navegador; no se certifica una matriz completa de dispositivos/navegadores.

Firestore usa exclusivamente `127.0.0.1:8185`, proyecto `demo-nullsite-phase2`, documento sintético `editor-lab/roundtrip`, con acceso administrativo del emulador. **Esto prueba serialización/persistencia, no las reglas de autorización ni la publicación real del blog.** Los emuladores de prueba se cerraron al terminar.

No hubo escritura en Firebase de producción, publicación de artículos/documentos ni cambios en usuarios o permisos. El laboratorio solo se registra en desarrollo; el build puede emitir su chunk, por lo que **esta rama experimental no debe desplegarse**.

Las imágenes/subidas están fuera de esta prueba: no se ha conectado el flujo privado real ni habilitado imágenes legales. El caso público de blog utiliza datos recuperados locales con el servicio de lectura sustituido en la prueba; no afirma haber publicado un artículo real.

## Conclusión

Mantengo **Tiptap** como preferencia para la integración definitiva: en este caso conserva la tipografía en su modelo/HTML y permite controlar el esquema. Kolkov ofrece una barra completa más rápido, pero su sanitizado inicial y la normalización del HTML necesitan especial atención.

Antes de fusionar una solución: adaptar el vocabulario seguro compartido de fuentes/tamaños/colores y sus estilos públicos, comprobar HTML móvil real, integrar imágenes privadas, probar documentos heredados más amplios y revisar accesibilidad/contraste. No usar `bypassSecurityTrustHtml` ni desactivar seguridad para conservar apariencia.

## Repetir la prueba del emulador

Con Java 21 disponible y el puerto 8185 libre:

```powershell
$env:VITE_EDITOR_EMULATOR = '1'
npx --yes firebase-tools@15.22.1 emulators:exec --config firebase.emulators.legal.json --project demo-nullsite-phase2 --only firestore "npx --no-install vitest run src/app/admin/editor-lab/editor-lab.component.spec.ts"
Remove-Item Env:VITE_EDITOR_EMULATOR
```

## Key Learnings:
1. El trabajo previo está preservado en backup/panel-antes-editores; la comparación de ambas librerías vive en experiment/comparar-tiptap-kolkov.
2. Ambos motores superan persistencia de HTML y lectura de texto recuperado; los sanitizadores actuales impiden conservar toda la tipografía enriquecida en la web.
3. Kolkov necesita proveedor HttpClient e iconos locales; su tema debe llegar a los componentes hijos. El import Sass por nombre de paquete falló en Vitest y se resolvió con ruta relativa al tema.
4. Las pruebas administrativas de persistencia en Firestore emulado no certifican reglas ni publicación real.
