# Qué falta para publicar

Según tu confirmación, ya guardaste los secretos y la variable de orígenes. No se han verificado sus valores ni el estado remoto desde este chat.

1. **Integrar los cambios locales en GitHub mediante commit y PR**, incluido el workflow nuevo. El pipeline remoto revisado antes seguía siendo el de Hosting.
2. **Verificar permisos de producción:** WIF para desplegar el backend nuevo, acceso de la función a los secretos y APIs/facturación necesarias. Confirmar también el entorno `production`.
3. **Ejecutar la validación del pipeline y el primer despliegue completo (`full`)**, no solo Hosting: backend de contacto primero; después reglas, índices, Storage y Hosting. Respetar la aceptación manual del workflow; no marcarla sin completar las comprobaciones que exige.
4. **Validar en el entorno publicado:** CAPTCHA/contacto y límites, login compartido con móvil, permisos de administrador, edición web↔móvil y que el blog permanezca oculto. Si falla, no dar la publicación por terminada.

Antes de publicar, confirmar que reemplazaste las claves que aparecieron en las capturas. CV y traducciones pueden seguir deshabilitados hasta aprobar su contenido.

Las pruebas locales anteriores pasaron y la auditoría de dependencias quedó en cero vulnerabilidades; eso no sustituye una ejecución real de Actions ni las pruebas de producción.

**Siguiente acción recomendada:** revisar el estado actual de GitHub y permisos sin modificar producción, y preparar el PR. No se ha hecho commit, push ni despliegue desde este chat.

## Key Learnings:
1. El usuario confirma haber configurado los secretos y la variable; sigue pendiente verificar su integración efectiva, sin inspeccionar valores privados.
2. El primer despliegue requiere el backend además de Hosting y debe respetar el control de aceptación manual.
