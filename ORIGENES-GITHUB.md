# Dominios para GitHub

Sí: agrega una **variable**, no un secreto, en GitHub:

**Repositorio → Settings → Environments → production → Environment variables → Add environment variable**.

Nombre:
```text
CONTACT_ALLOWED_ORIGINS
```

Valor, en una sola línea:
```text
https://ricardopajarocoatl.com,https://nullpointer-716ae.web.app
```

No incluyas `localhost` en esta variable de producción. Puede permanecer en la configuración de reCAPTCHA para desarrollo local: esa lista contiene dominios, mientras que el backend requiere orígenes completos con `https://`, sin rutas ni barra final.

Si también usarás `www.ricardopajarocoatl.com` para enviar el formulario, agrega explícitamente `https://www.ricardopajarocoatl.com` a la variable. No lo añadas si solo redirige al dominio principal.

Si todavía no existe el entorno `production`, créalo con ese nombre: el workflow local lo utiliza. Guardar esta variable no despliega los cambios.

No se ha modificado GitHub desde este chat.

## Key Learnings:
1. La lista de producción para contacto incluye los dos orígenes HTTPS indicados, sin localhost.
2. CONTACT_ALLOWED_ORIGINS es una variable de Actions, no un secreto; los dominios de reCAPTCHA y los orígenes del backend usan formatos diferentes.
