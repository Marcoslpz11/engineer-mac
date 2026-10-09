# Engineer — guía del proyecto (para Claude Code)

App de **Electron** ("Engineer", nombre interno `webp-converter`): herramientas de desarrollo
web (conversión WebP, optimizar/colorear SVG, minificar/formatear JS·CSS, convertir a
WordPress, crear plantillas, crear temas WP) con interfaz bilingüe **EN/JP**.

Repo único: `Marcoslpz11/engineer-mac` (público). **Un solo codebase** sirve para macOS y
Windows (Electron es multiplataforma); las diferencias van con `process.platform` y en la
config de build (`mac`/`win`) de `package.json`. NO crear repos separados por plataforma.

## Desarrollo
- `npm start` — lanza la app con el código local (no hace falta build para probar cambios).
- Cambios en `renderer/` → recargar con Cmd+R. Cambios en `main.js` → reiniciar `npm start`.
- `npm run dist:unsigned` — build local sin firmar para probar el empaquetado.

## Publicar una versión (auto-update)
1. Subir `version` en `package.json` (p.ej. 0.1.5).
2. `git commit` + `git push origin main`.
3. `git tag vX.Y.Z && git push origin vX.Y.Z` → dispara GitHub Actions
   (`.github/workflows/release.yml`): construye, **firma + notariza** (Mac) y publica un
   **borrador** de release.
4. Publicar: `gh release edit vX.Y.Z -R Marcoslpz11/engineer-mac --draft=false --latest`.
   (El auto-update solo ve releases PUBLICADAS, no borradores.)

El auto-update usa **electron-updater** + **GitHub Releases** (no usa Cloudflare). Funciona
de una versión a la siguiente; el primer install de una build se hace a mano.

### Gotchas del CI (no re-romper)
- Runner fijado a `macos-15` (NO `macos-latest`: macOS 26 rompe electron-builder 24 al firmar).
- Build **solo arm64** (Apple Silicon). Para añadir x64/Windows hace falta runner propio.
- El `.p12` de firma debe generarse con `openssl ... -legacy` (OpenSSL 3 lo rechaza si no).
- `notarize.teamId` va **hardcodeado** en `package.json` (electron-builder 24 no expande el
  macro de env ni lo lee de env).
- El workflow necesita `permissions: contents: write` o la publicación de la release da 403.
- Secrets de Apple en GitHub Actions: `APPLE_ID`, `APPLE_TEAM_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, `CSC_LINK`, `CSC_KEY_PASSWORD`.

## Reporte de errores (pestaña エラー報告)
La app envía el reporte a un **Cloudflare Worker** (`error-report-worker/`) que crea un
**issue** en el repo (label `error-report`). El token de GitHub vive en el Worker, no en la
app. Endpoint y clave en `main.js` (`ERROR_REPORT_ENDPOINT`, `ERROR_REPORT_KEY`).
Para redeploy del Worker: `cd error-report-worker && npx wrangler@3 deploy`
(usar **wrangler@3**: wrangler 4 requiere Node 22 y aquí hay Node 20).

## PENDIENTE: unificar la versión de Windows
La versión de Windows existe **solo en el PC de Windows del usuario** (sin repo ni backup).
Cuando se trabaje desde ese PC:
1. **Backup** primero de los archivos actuales de Windows (zip).
2. `git clone` de este repo en una carpeta nueva.
3. Comparar los archivos de Windows con este codebase y **portar** las diferencias
   (detrás de `if (process.platform === "win32")` donde haga falta).
4. Activar el job `release-win` (está preparado y comentado en el workflow).
5. Tag de release → CI construye y publica Mac + Windows en la misma Release
   (electron-updater sirve `latest-mac.yml` y `latest.yml` desde una sola release).
Pregunta a resolver entonces: ¿los archivos de Windows son este mismo proyecto (solo
compilado allí) o tienen cambios propios? Eso determina cuánto hay que portar.

## Convertidor Form → CF7 (hecho)
Pestaña "Form → CF7" (`renderer/cf7converter.js`): convierte los forms estáticos de la
empresa (estructura `.p-form__item` > `.p-form__title` + `.p-form__content`) a Contact
Form 7. Soporta **Multi-Step Forms** (form principal + confirm + estilos de botones) y
**Confirm Plus** (un solo form + clases `title-contactform7 for-{nombre}` en cada `<dt>` +
estilos `#wpcf7cpcnf`). Tipos: text/email/tel/textarea/radio/checkbox/select/address
(YubinBango: `p-postal-code`/`p-region`/… + span `p-country-name`)/file. DTX (post title o
taxonomy+slug). Privacy (`.p-form__privacy`) se deja intacta; `c-fontB` solo si ya estaba.

## PENDIENTE: Parte 2 — plugin de WordPress
Objetivo: la app Engineer exporta un **JSON** con los datos de los forms del convertidor, y
un **plugin de WordPress** lo importa y: (1) crea los forms de Contact Form 7 (CPT
`wpcf7_contact_form` + meta `_form`, `_mail`, `_mail_2`, `_messages`,
`_additional_settings`), (2) deja Flamingo listo (captura automática al estar instalado),
(3) escribe las plantillas de correo (`_mail`/`_mail_2`: destinatario, asunto, cuerpo con
`[campos]`). Es viable.
Decisiones a tomar al empezar: ¿el JSON lleva el markup CF7 ya generado (plugin solo lo
guarda) o datos estructurados (plugin construye el markup)? · cómo llega el JSON al plugin
(subirlo en una página de admin del plugin es lo más fácil) · hay que añadir **export a
JSON** en el convertidor de la Parte 1.
