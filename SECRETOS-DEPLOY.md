# Secretos y configuración pendientes

## ¿De dónde salen?

**No he obtenido ni generado sus valores.** Son nombres que utiliza el backend nuevo.

1. **`CONTACT_RECAPTCHA_SECRET`:** entra en la [consola de reCAPTCHA](https://www.google.com/recaptcha/admin), selecciona el registro correspondiente a tu `SITE_KEY` actual y copia su **clave secreta**, no la clave del sitio. Google permite consultar ambas en la [configuración de reCAPTCHA](https://developers.google.com/recaptcha/docs/settings). No necesitas crear otro CAPTCHA si ya tienes ese par compatible.
2. **`CONTACT_RATE_LIMIT_KEY`:** no se obtiene de Firebase: es una clave privada nueva que tú generas aleatoriamente. Por ejemplo, en tu terminal local con Node: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Genera 64 caracteres hexadecimales; guarda el resultado directamente como secreto, sin compartirlo aquí ni versionarlo.
3. **`CONTACT_ALLOWED_ORIGINS`:** son las direcciones reales desde las que se enviará el formulario, por ejemplo `https://tu-dominio.com,https://nullpointer-716ae.web.app` **solo si ambos se usan**. No lleva rutas ni barra final. Se configura como variable de GitHub Actions, no como secreto.

Los dos secretos privados se guardan con estos comandos, introduciendo cada valor cuando la CLI lo solicite:

```powershell
firebase functions:secrets:set CONTACT_RECAPTCHA_SECRET --project nullpointer-716ae
firebase functions:secrets:set CONTACT_RATE_LIMIT_KEY --project nullpointer-716ae
```

Guardar los secretos no despliega la función: después debe publicarse el backend para utilizarlos, según la [documentación de Firebase](https://firebase.google.com/docs/functions/config-env?hl=es-419). Estos comandos son instrucciones; no se han ejecutado.

El pipeline anterior podía funcionar correctamente: desplegaba Hosting. El cambio nuevo añade el backend seguro de contacto; por eso aparecen requisitos adicionales, no porque los secretos anteriores estén mal.

## Lo que ya existía

En la revisión anterior de GitHub estaban los nombres `SITE_KEY` y los ocho `FIREBASE_*` usados por el workflow. No hace falta duplicarlos ni crear otro login. Sus valores no fueron inspeccionados ni se han vuelto a comprobar en esta respuesta.

La autenticación del despliegue usa el proveedor WIF y la cuenta de servicio ya indicados en el workflow. No requiere una nueva clave JSON. `FIREBASE_SERVICE_ACCOUNT` no se usa en el workflow local nuevo; no eliminarlo sin revisar otros consumidores.

## Lo nuevo que falta confirmar/configurar

| Nombre | Dónde | Para qué |
|---|---|---|
| `CONTACT_RECAPTCHA_SECRET` | Secret Manager de Firebase/Google Cloud, proyecto `nullpointer-716ae` | Validar CAPTCHA en el servidor; debe corresponder a `SITE_KEY`. |
| `CONTACT_RATE_LIMIT_KEY` | Secret Manager del mismo proyecto | Clave aleatoria privada de al menos 32 caracteres para las cuotas por IP. |
| `CONTACT_ALLOWED_ORIGINS` | Variable de GitHub Actions, preferentemente en el entorno `production` | Orígenes HTTPS exactos separados por comas, sin rutas ni comodines. **No es un secreto.** |

No está confirmado que los dos secretos nuevos existan en producción. No deben ponerse en Angular, en archivos versionados ni compartirse por chat.

## Además de secretos

- Integrar el workflow local nuevo en GitHub: el remoto revisado seguía siendo el anterior.
- Crear/verificar el entorno `production` y sus protecciones; asegurar que pueda acceder a los secretos existentes.
- Verificar permisos mínimos de WIF para desplegar Functions y acceso de la función a sus secretos, además de APIs/facturación necesarias.
- Hacer el primer despliegue completo coordinado y probar contacto/CAPTCHA real, login compartido y edición web↔móvil. Hosting solo no instala el backend nuevo.

No se ha cambiado configuración remota ni ejecutado un despliegue.

## Key Learnings:
1. Los requisitos nuevos provienen del backend de contacto; los secretos del pipeline de Hosting se reutilizan.
2. Los secretos privados del contacto viven en Secret Manager; los orígenes permitidos son una variable de GitHub, no un secreto.
