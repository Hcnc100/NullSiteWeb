# Recomendación tras las pruebas: Tiptap

**Integraría Tiptap para blog y documentos legales.** Kolkov también supera el caso de guardado/recuperación, pero Tiptap encaja mejor con nuestras reglas de contenido e imágenes privadas.

## Por qué

- **Formato controlado:** permite configurar el esquema y ofrecer únicamente fuentes, tamaños y colores que nuestro sanitizador conserva. Evita mostrar opciones que luego desaparecen al guardar.
- **Resultado verificado:** en el caso probado, su HTML normalizado conserva el formato aprobado al recuperar y mostrar en la web; también se comprobó reabrir en Tiptap manteniendo el tamaño.
- **Imágenes privadas:** su extensibilidad permite implementar un nodo propio para representar las rutas autorizadas, en lugar de adaptar una inserción genérica de imágenes. Esta integración aún está pendiente.
- **Diseño propio:** podemos reutilizar Font Awesome, los rojos y los controles ES/EN del panel sin depender de la apariencia de una barra prefabricada.

## Cuándo elegiría Kolkov

Si la prioridad fuera tener la barra completa con el menor desarrollo inicial. Funciona en las pruebas, y el sanitizador personalizado ya permite conservar el formato aprobado. Sin embargo, habría que limitar/traducir su barra y adaptar el flujo de imágenes. Su configuración por defecto no conservaba los estilos del ejemplo en el DOM inicial.

## Qué falta para integrarlo de verdad

1. Sustituir los editores sencillos de blog y legales por un componente Angular compartido con Tiptap.
2. Ofrecer solo el vocabulario aprobado; probar selección, deshacer/rehacer, pegado y reapertura de todos los formatos, no solo el ejemplo.
3. Integrar imágenes privadas del blog sin ampliar permisos ni habilitar imágenes legales accidentalmente.
4. Mantener guardado/publicación explícitos, conflictos web↔móvil y lectores seguros.
5. Validar documentos heredados, estilos del lector móvil y accesibilidad responsive; retirar Kolkov y el laboratorio de la versión definitiva.

**No elegiría ambos para producción.** Mantendría Tiptap como único motor y los sanitizadores compartidos como frontera de seguridad. Las pruebas actuales respaldan esta recomendación, pero no certifican todavía una integración completa ni compatibilidad visual móvil.

## Key Learnings:
1. Tras la comparación experimental, Tiptap es la recomendación para la integración definitiva por su esquema configurable y adaptación a imágenes privadas; Kolkov queda como alternativa de implementación rápida.
