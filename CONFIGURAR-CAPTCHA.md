# Corregir el comando de CAPTCHA

El argumento después de `functions:secrets:set` es el **nombre del secreto**, no su valor. No aceptes la conversión a mayúsculas del valor: alteraría la clave.

**La clave privada quedó expuesta en la captura y en el mensaje. Rótala o reemplázala en reCAPTCHA antes de usarla.** Si para reemplazarla generas un nuevo par, actualiza también `SITE_KEY` en GitHub con la nueva clave pública y verifica sus dominios autorizados.

Después ejecuta:

```powershell
firebase functions:secrets:set CONTACT_RECAPTCHA_SECRET --project nullpointer-716ae
```

Cuando la CLI solicite el valor, pega **la nueva clave secreta** conservando exactamente mayúsculas y minúsculas. No la pegues aquí ni la escribas como argumento del comando.

El error mostrado corresponde a un nombre inválido; ese intento no guardó el secreto. Guardarlo correctamente tampoco despliega la función: queda pendiente el despliegue coordinado.

Referencia: [configuración de secretos en Firebase](https://firebase.google.com/docs/functions/config-env?hl=es-419).

## Key Learnings:
1. `functions:secrets:set` recibe un nombre estable; el valor privado se introduce en la solicitud interactiva.
2. Una clave secreta expuesta debe reemplazarse antes de utilizarse; nunca se transforma a mayúsculas.
