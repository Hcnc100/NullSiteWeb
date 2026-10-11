# Panel: rojo y vistas previas

- Panel y selector ES/EN con acentos rojos. El menú público usa rojo puro; para botones se utiliza rojo oscuro con texto blanco y foco rojo claro para mantener legibilidad.
- Perfil: vista previa de foto, nombre, profesión y descripción mientras editas; usa el idioma activo y el texto original si falta traducción.
- Proyectos: portada en la lista, vista previa del contenido y galería durante la edición.
- Capturas: miniatura incluso con el apartado cerrado y una imagen mayor al abrirlo, junto a los campos de descripción.
- Distribución de dos columnas en pantallas grandes; una columna hasta 1000 px, con vista previa arriba para facilitar su acceso.
- Las vistas previas son una aproximación del contenido, no una réplica exacta de la página pública. No escriben en Firebase; guardar sigue siendo explícito. Subir archivos conserva su comportamiento anterior.
- Texto mediante interpolación, sin HTML ejecutable; las imágenes de vista previa solo aceptan HTTPS y no envían referrer. No se cambian reglas ni permisos.

## Verificación

- TypeScript: correcto.
- Pruebas dirigidas: 4 archivos, 19 pruebas correctas, incluida actualización de vista previa y rechazo de URL no HTTPS.
- Build: correcto.
- No se ha realizado una revisión visual interactiva del panel autenticado ni un despliegue. Queda comprobar visualmente con imágenes reales y en móvil antes de publicar.

## Key Learnings:
1. El usuario prefiere el rojo del menú público frente al acento violeta del panel y selector de idioma.
2. Las capturas deben identificarse visualmente desde el editor, no solo por número o descripción.
3. Las vistas previas se alimentan del formulario y no requieren nuevas escrituras ni cambios en el contrato móvil.
