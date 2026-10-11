# HTML legal permitido

## Propósito

Dar formato a documentos legales sin permitir que el HTML de Firebase cambie la navegación, ejecute código o introduzca CSS global. No se modifica el sentido jurídico ni se traducen automáticamente las cláusulas.

El lector público usa `LegalDocumentComponent` y `sanitizeLegalHtml`. **La futura vista previa del portal debe reutilizar ambos**, no otro renderizador que se vea distinto. El modelo existente sigue siendo `terms/{id}` con `title` y `content`; esta fase no crea un editor ni cambia reglas o documentos.

## Ejemplo de formato, no de contenido jurídico

El título de la aplicación/documento se toma del campo `title`. En `content`, utiliza encabezados H2 y H3:

```html
<div lang="es">
  <h2>Nombre de la sección</h2>
  <p class="legal-lead">[Introduce aquí el texto revisado del documento.]</p>
  <h3>Subsección</h3>
  <p>Texto con <strong>énfasis</strong> y <em>cursiva</em>.</p>
  <ul><li>[Primer punto revisado.]</li><li>[Segundo punto revisado.]</li></ul>
  <p class="legal-note">[Nota aclaratoria revisada.]</p>
  <p><a href="https://example.com">Referencia HTTPS</a></p>
  <p><a href="mailto:contact@example.com">Contacto de ejemplo</a></p>
</div>
```

Los marcadores y direcciones del ejemplo son ficticios: no publicar esta muestra como política real.

## Elementos y atributos

- Párrafos, bloques, spans, encabezados H2–H6, negrita, cursiva, subrayado, tachado, listas y listas de definiciones.
- Citas, código, saltos de línea, separadores, abreviaturas, superíndices, subíndices y fechas `time` con `datetime` acotado.
- Tablas con `caption`, grupos, filas, celdas, `scope` aprobado y `colspan`/`rowspan` entre 1 y 99.
- Enlaces HTTPS sin credenciales incrustadas; `mailto:` de un destinatario simple, sin parámetros, fragmentos ni escapes. Los demás destinos dejan de ser enlaces activos, conservando su texto.
- `target="_blank"` solo en enlaces válidos, con `rel="noopener noreferrer"` impuesto por el lector.
- Idioma `es`, `en` y variantes regionales de dos letras, por ejemplo `es-MX` o `en-US`. No se infiere el idioma a partir del selector de interfaz.

Un H1 pegado se convierte en H2 porque la página ya tiene su H1. Los niveles que saltan jerarquías se normalizan. Contenedores como `article`, `section` o `header` pasan a bloques neutros. El navegador normaliza etiquetas mal cerradas; no se compila el HTML como plantilla Angular.

## Estilos disponibles

Clases permitidas, siempre dentro del documento:

| Clase | Presentación |
|---|---|
| `legal-note` | Nota destacada. |
| `legal-warning` | Aviso destacado. |
| `legal-lead` | Párrafo introductorio. |
| `legal-align-left`, `legal-align-center`, `legal-align-right` | Alineación. |
| `legal-strong`, `legal-emphasis`, `legal-underline` | Énfasis tipográfico. |

Por compatibilidad, `text-align: left/center/right`, `font-weight: bold/700` y `font-style: italic` pegados en `style` se convierten en clases. También se reconoce la alineación HTML histórica. **Ningún atributo `style` se conserva.** No se aceptan tamaños, colores, familias, posiciones, imágenes de fondo ni CSS libre; los colores y tamaños los controla el tema para mantener legibilidad.

## Protección y límites

- Se eliminan scripts, hojas de estilos, iframes, SVG/MathML, objetos, formularios, controles, multimedia, imágenes y otros recursos externos embebidos. Los cinco documentos existentes no contienen imágenes. Si más adelante hacen falta imágenes legales, definir primero un contrato de assets controlados.
- No se conservan eventos, IDs/nombres aportados, atributos ocultos, `aria-hidden`, estilos globales ni clases de otros componentes.
- El HTML se reconstruye en un documento inerte, sin activar sus recursos. Angular vuelve a sanitizar `[innerHTML]`; **no se usa `bypassSecurityTrustHtml`**.
- Límites actuales: 500,000 caracteres de entrada/salida, 20,000 nodos procesados, profundidad 80 y 200 encabezados indexados. Se eligieron con amplio margen frente a los documentos actuales, de menos de 9,000 caracteres.
- Si se rechaza el documento, el lector muestra un aviso: **no se presenta una política truncada**. El cuerpo no se recorta silenciosamente. Solo se acotan etiquetas duplicadas del índice y nombres accesibles de tablas; las cláusulas permanecen completas.
- Los estilos y contenedores de tablas quedan acotados al renderizador. Tablas y bloques largos no deben ensanchar la página.

Estas defensas reducen riesgos, pero no representan garantía de riesgo cero ni revisión de cumplimiento jurídico.

## Índice y enlaces a secciones

Se genera índice cuando hay más de un encabezado. Es plegable en móvil y lateral en escritorio amplio. Las anclas son creadas por el renderizador, no por el HTML guardado: `legal-section-1`, `legal-section-2`, etc.

Angular elimina los IDs suministrados en `[innerHTML]`. Por eso se asignan únicamente IDs controlados después de su sanitización, junto con el foco y los contenedores accesibles de tablas. No se elude la protección de Angular.

Las anclas se pueden compartir y funcionan al abrir directamente un documento. Son deterministas para el mismo orden de encabezados; añadir o reordenar secciones puede renumerarlas. **Las URLs e IDs de los documentos existentes no cambian.** Para una vista previa adicional, proporcionar un `anchorPrefix` distinto, como `legal-preview`, y evitar IDs duplicados.

## Contrato para la fase 8

Implementación local: `/admin/legal`. Flujo visual/HTML, borradores privados, historial, compatibilidad móvil y requisitos de despliegue en [FASE-8-RESULTADO.md](FASE-8-RESULTADO.md). En modo visual se pega texto plano; para formato rico utiliza HTML y normaliza. La estructura inicial está vacía y no contiene cláusulas legales ficticias.

1. Usar este saneador y el mismo componente para Visual/HTML/Vista previa.
2. Avisar al autor cuando `changed` sea verdadero y mostrar la versión normalizada antes de publicar.
3. Bloquear publicación si `rejected` no es `null`; conservar su borrador y la publicación anterior.
4. Validar también las escrituras del cliente móvil. Sanear de nuevo al leer, porque un escritor autorizado podría guardar HTML fuera del editor web.
5. Guardar borradores e historial fuera de `terms`, que actualmente es pública, y mantener las URLs publicadas.
6. No cambiar cláusulas, fechas de vigencia o traducciones sin revisión del autor. La sanitización técnica no sustituye esa revisión.

## Key Learnings:

1. El formato legal debe conservar `mailto:` y el idioma del contenido, aunque el saneador del blog tenga otro contrato.
2. El HTML normalizado debe ser idempotente para no acumular contenedores ni degradarse en ciclos de edición/vista previa.
3. Anclas y contenedores accesibles se agregan con valores controlados después de la sanitización Angular, sin confiar en IDs o CSS suministrados.
