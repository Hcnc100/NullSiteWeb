# NullSiteWeb

My simple website

## Panel web — fase 1

- Ejecutar `npm start` y abrir `/admin/login` (sin enlace de login en el menú público).
- Usar el mismo correo y contraseña de NullSiteApp: ambos clientes apuntan a Firebase `nullpointer-716ae`.
- No hay registro público ni usuarios duplicados. El panel exige el custom claim booleano `admin: true`;
  estar autenticado sin ese permiso no habilita edición. El claim se administra desde un entorno de confianza,
  nunca desde el cliente web.
- La sesión web dura la sesión de la pestaña; es independiente de la sesión del móvil.
- `/admin/profile` edita nombre, profesión, descripción, URL HTTPS de foto y cinco redes sociales.
- Se actualiza parcialmente `infoProfile/nullPointer`, conservando campos móviles y contadores;
  `updatedAt` usa timestamp del servidor. Se detectan cambios concurrentes de los campos editables.
- `socialLinks` es opcional: array de `{ platform, url }`, con plataformas
  `github`, `facebook`, `instagram`, `twitter`, `whatsapp`. Si falta, se conservan los enlaces históricos;
  un array vacío oculta todas las redes. No guardar información privada en este documento público.
- El código móvil revisado usa `update` para un perfil existente y conserva estos campos adicionales.
  La subida de imágenes, proyectos, habilidades y blog corresponden a las fases siguientes.
- No se han desplegado cambios ni probado credenciales reales. Antes de publicar, verificar login con la
  cuenta existente, reglas desplegadas y edición real entre web y móvil. Las reglas locales existentes
  ya restringen escritura de `infoProfile` al claim `admin`; no se modificaron en esta fase.

Pruebas focalizadas sin autenticar ni escribir en producción:

```sh
npx --no-install playwright install chromium
npx --no-install vitest run src/app/admin src/app/models/profile-editor.model.spec.ts src/app/app.component.spec.ts src/app/profile
npm run build
```

Ver fases y estado en [PLAN-MEJORAS-SITIO.md](PLAN-MEJORAS-SITIO.md).


This only one of three components for admin:

<p>
  <a href="https://github.com/Hcnc100/NullSiteApp" target="_blank">NullSiteApp</a>
</p>
<p>
  <a href="https://github.com/Hcnc100/NullSiteWeb" target="_blank">NullSiteWebApp</a>
</p>
<p>
  <a href="https://github.com/Hcnc100/NullSiteFunctions" target="_blank">NullSiteCloudFunctions</a>
</p>



### Screenshots

### Phase 2 — bilingual portfolio and editable content

Phase 3 added the private blog editor at `/admin/blog`; see [FASE-3-RESULTADO.md](FASE-3-RESULTADO.md) for HTML limits and draft/image permissions. Phase 5 now adds explicit publication, withdrawal, public readers and client-side SEO; see [FASE-5-RESULTADO.md](FASE-5-RESULTADO.md). No production blog was activated. Deploy and verify the new Firestore/Storage rules and index before enabling it.

See [FASE-2-RESULTADO.md](FASE-2-RESULTADO.md) for ES/EN routes, project/skill editors, PDF resume publication, compatibility and release checklist. These local phases do not deploy or activate production automatically.

Run Angular tests with `npm test -- --watch=false` (Vitest + Playwright Chromium; install the browser once with `npx --no-install playwright install chromium`). Type-check tests with `npx --no-install tsc --project tsconfig.spec.json --noEmit`. Run isolated Firestore/Storage rules tests with `npm run test:rules` (Firebase CLI + Java 21). Never point this suite at production.

### Home

![image](https://user-images.githubusercontent.com/46488277/198367467-ed0bc2e8-af43-4b9b-82a8-bb5194844244.png)

### Skills

![image](https://user-images.githubusercontent.com/46488277/198367892-aa4fd1a8-68e1-4040-ac41-c2b8b5d8b3b6.png)


### Certificates

![image](https://user-images.githubusercontent.com/46488277/198368033-f05c937d-5972-43d8-9f14-14ea3ffb2c6e.png)

### Projects

![image](https://user-images.githubusercontent.com/46488277/198368211-0dd48a9e-b7de-4215-8bd6-af4af9b97318.png)

### Contact
![image](https://user-images.githubusercontent.com/46488277/198368393-926a27ef-0625-4a3d-b745-9e0f5fe7dadb.png)


### Import

Revisión local de UX, accesibilidad y seguridad: [Fase 4](FASE-4-RESULTADO.md). Incluye riesgos pendientes antes del despliegue.

Lector legal responsive y HTML seguro: [Fase 7](FASE-7-RESULTADO.md). Formatos admitidos y ejemplos: [HTML-LEGAL-SEGURO.md](HTML-LEGAL-SEGURO.md). Editor visual/HTML privado en `/admin/legal`, borradores, publicación explícita e historial: [Fase 8](FASE-8-RESULTADO.md). Desplegar las nuevas reglas antes de usarlo en producción; estos cambios no despliegan automáticamente.

Gestión de descripciones ES/EN, miniaturas y revisión editorial: [Fase 9](FASE-9-RESULTADO.md). La [propuesta bilingüe](content/phase9-editorial-review.json) no se aplica automáticamente; faltan aprobación editorial y PDFs definitivos del CV.

Seguridad y release manual: [Fase 10](FASE-10-RESULTADO.md), con [cambios predeploy y configuración necesaria](CAMBIOS-PREDEPLOY.md). [Avisos resueltos](AVISOS-RESUELTOS.md): auditoría completa a cero y 258 pruebas con Vitest/Chromium. Backend de contacto preparado en codebase separada, cliente HTTP y reglas server-only: desplegar coordinadamente, nunca solo las reglas. Faltan aceptación/configuración remota e integración del workflow; no desplegar todavía.

For enable notification in your app when send new email in contact for your website, see
the <a href="https://github.com/Hcnc100/NullSiteFunctions" target="_blank">NullSiteCloudFunctions</a> and 
<a href="https://github.com/Hcnc100/NullSiteApp" target="_blank">NullSiteApp</a>


