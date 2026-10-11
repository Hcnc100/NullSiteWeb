# Conservar formato sin desactivar seguridad

**Sí.** Podemos ampliar el formato permitido sin aceptar HTML o CSS arbitrarios. No significa riesgo cero: hay que validar cada ampliación y probarla.

## Enfoque recomendado

1. **Lista cerrada de formatos:** encabezados H2–H6, negrita, cursiva, subrayado, listas y alineación. Scripts, eventos `onclick`/`onerror`, iframes y elementos ejecutables siguen prohibidos.
2. **Estilos controlados:** interpretar solo color, tamaño, familia y alineación; convertir valores reconocidos en clases propias, por ejemplo `rt-size-large` o `rt-font-serif`. Descartar todo el CSS original después de la conversión.
3. **Valores limitados:** fuentes locales aprobadas, tamaños acotados y paleta con contraste para el tema de la web. No permitir `url()`, posiciones, selectores, fuentes externas ni CSS libre. No analizar CSS con simples sustituciones de texto.
4. **Misma política en editor, guardado y lectores:** las clases deben sobrevivir al guardado y tener estilos equivalentes en la vista previa y en la web pública. Los sanitizadores de blog y legales pueden compartir el formato, conservando sus políticas diferentes de imágenes.
5. **Imágenes por separado:** mantener rutas privadas del blog y su publicación autorizada. No habilitar imágenes arbitrarias, base64 o SVG por añadir opciones tipográficas.

Ejemplo de salida controlada:

```html
<h2>Mi sección</h2>
<p><span class="rt-color-red rt-font-serif rt-size-large">Texto destacado</span></p>
```

Las clases también se validan por lista cerrada: no se acepta cualquier clase pegada por el usuario.

## Lo que no haría

- Desactivar los sanitizadores para que se vea igual.
- Usar `bypassSecurityTrustHtml` como solución para conservar estilos.
- Confiar en que un usuario administrador o el editor produzcan siempre HTML seguro: también hay pegado externo y escrituras desde móvil.
- Reescribir todos los documentos existentes automáticamente.

## Cómo comprobarlo

- Guardar → recuperar → editar de nuevo → mostrar en los lectores reales, verificando colores/fuentes/tamaños admitidos.
- Probar ataques por atributos, protocolos, SVG, CSS, pegado malicioso y HTML profundamente anidado; aplicar límites de longitud, nodos y profundidad.
- Comprobar idempotencia: sanitizar dos veces no debe seguir cambiando el contenido.
- Validar documentos antiguos y el lector móvil antes de publicar. Firestore Rules controlan acceso y estructura, pero no sustituyen un sanitizador de HTML.
- Mantener sanitizado en cada punto de lectura; cualquier ruta de publicación o validación de servidor debe aplicar una política equivalente.

**Recomendación para la rama experimental:** crear primero este vocabulario compartido y sus pruebas, luego conectar Tiptap. Así conservamos formato intencional sin abrir la puerta a CSS libre.

No se ha modificado código en esta respuesta.

## Key Learnings:
1. El formato enriquecido debe normalizarse a un vocabulario de clases y valores limitado, sin conservar CSS arbitrario.
2. El sanitizado del HTML y la autorización de imágenes son políticas separadas; ampliar tipografía no debe ampliar acceso a archivos.
