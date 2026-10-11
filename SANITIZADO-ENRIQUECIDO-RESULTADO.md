# Formato enriquecido seguro — rama experimental

Rama: `experiment/comparar-tiptap-kolkov`. El respaldo `backup/panel-antes-editores` permanece intacto. No hubo push, deploy ni escrituras en Firebase de producción.

## Cambio aplicado

- Vocabulario compartido de clases `rt-*` para los sanitizadores de blog privado/público y documentos legales.
- Conversión de estilos reconocidos y etiquetas `font` heredadas a clases controladas. Se elimina todo el CSS original.
- Fuentes: Arial, Georgia y monospace. Tamaños: 14, 16, 18, 24 y 32 px equivalentes en rem. Colores: rojo, azul y verde de la paleta oscura, más herencia del color del documento.
- Los rojos reconocidos se normalizan a `#ff8585` para legibilidad en el tema oscuro; no se pretende conservar cualquier color exacto elegido. Colores y tamaños fuera de la lista se descartan.
- Clases de alineación controladas; se conserva la compatibilidad de alineación legal existente.
- Blog admite ahora span, encabezados H4–H6, subrayado y tachado, además del vocabulario anterior. Se añadieron límites de longitud, profundidad y nodos al sanitizador de blog.
- CSS de estas clases limitado a los contenedores de contenido/editor, sin selectores suministrados por el usuario.

## Comparación repetida

El laboratorio guarda ahora **HTML normalizado**. Kolkov usa un sanitizador personalizado que aplica la política cerrada, manteniendo `sanitize: true`. Al reabrir Tiptap se convierten únicamente nuestras clases conocidas en valores fijos de formato para su motor, después de sanitizar el documento.

En ambos casos se verificó guardar → recuperar → lector legal real y lectura en BlogComponent público real en una prueba aislada. También se comprobó visualmente desde la interfaz local y leyendo los estilos computados del lector:

| Propiedad recuperada | Tiptap | Kolkov |
|---|---|---|
| Texto visible | Sí | Sí |
| Tamaño del ejemplo | 24 px | 24 px |
| Fuente del ejemplo | Georgia, serif | Georgia, serif |
| Color del ejemplo | rgb(255, 133, 133) | rgb(255, 133, 133) |
| Estilos inline en el lector | Ninguno | Ninguno |

La prueba del lector público de blog sustituye el servicio de datos con el HTML recuperado; no publica un artículo real. La persistencia de Firestore usa solo el emulador y un documento sintético con acceso administrativo: no certifica permisos o publicación real.

## Seguridad y pruebas

- **62 archivos / 276 pruebas correctas** en Chromium.
- Firestore emulado: **11 pruebas correctas**, incluida persistencia y recuperación con ambos editores.
- Build y TypeScript correctos; auditoría npm: **0 vulnerabilidades reportadas**.
- Casos específicos: CSS con URL/posición, fuentes remotas/no admitidas, valores extremos, clases arbitrarias, eventos, scripts/SVG, protocolos peligrosos, nombres de prototipo, profundidad/longitud excesivas e idempotencia.
- Los tests previos que exigían borrar incluso el rojo permitido se actualizaron para exigir exactamente la nueva clase segura, manteniendo el rechazo de atributos ejecutables.
- Las reglas de imágenes no se ampliaron: legales siguen sin imágenes y blog conserva sus rutas privadas/públicas autorizadas.

Esto es evidencia de pruebas acotadas, no una certificación de ausencia de vulnerabilidades. No se usó `bypassSecurityTrustHtml` ni se habilitó CSS arbitrario.

## Cómo verlo

**http://127.0.0.1:4300/editor-lab** — el servidor local quedó iniciado.

Alterna editor → Guardar local → Recuperar local. Puedes recargar la página entre guardar y recuperar, y usar “Volver a editar lo recuperado”. Los colores/tamaños ajenos a la lista se descartan intencionalmente.

## Pendientes antes de fusionar/publicar

- Integrar el editor elegido en los formularios reales, no solo el laboratorio.
- Hacer que sus controles ofrezcan únicamente el vocabulario aprobado; la barra genérica de Kolkov aún muestra opciones que pueden descartarse.
- Probar el lector móvil: HTML con clases necesita estilos equivalentes o un adaptador allí; no se afirma compatibilidad visual móvil con el formato nuevo.
- Ampliar revisión visual, contraste en todos los fondos y pruebas de documentos heredados. Imágenes y publicación reales siguen fuera del experimento.

## Relevant Files

- `src/app/models/rich-text-format.ts` — valores y clases controlados; adaptador para reabrir el editor.
- `src/app/models/blog-draft.ts` — vocabulario seguro y límites de blog.
- `src/app/terms/legal-html.ts` — aplica tipografía segura conservando el contrato legal.
- `src/app/scss/_rich-text.scss` — presentación compartida y acotada.
- `src/app/admin/editor-lab/` — comparación, normalización al guardar y pruebas de lectores/emulador.
- `src/app/models/rich-text-format.spec.ts` — regresiones de seguridad y normalización.

## Key Learnings:
1. El formato enriquecido del caso probado sobrevive al guardado y recuperación mediante clases permitidas, sin estilos inline en los lectores públicos.
2. Kolkov permite inyectar un sanitizador cerrado; Tiptap necesita reconstruir valores fijos desde las clases para reabrir sin perder formato.
3. Mantener acceso y políticas de imágenes separados de la tipografía evita ampliar permisos al añadir estilos.
