# Engineer — guía del proyecto (para Claude Code)

App de **Electron** ("Engineer", nombre interno `webp-converter`): herramientas de desarrollo
web (conversión WebP, form estático → Contact Form 7, minificar/formatear JS·CSS, convertir
a WordPress, crear plantillas, crear temas WP) con interfaz bilingüe **EN/JP**.

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
- Build Mac **solo arm64** (Apple Silicon). Para x64 Mac hace falta runner propio.
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

## Windows (unificado)
La antigua copia de Windows (`engineer-app0604`, backup zip en `案件/`) era el **Initial
commit** + cambios de empaquetado; no tenía código propio. Portado: `images/logo.ico`,
`win.icon`, accesos directos NSIS. El job `release-win` (windows-latest, `needs: release-mac`
para que ambos suban a la misma release borrador) publica `Engineer Setup X.Y.Z.exe` +
`latest.yml`. Sin firma de código en Windows → SmartScreen avisa en el primer install.
- Build local en Windows: `npx electron-builder --win --publish never`.
- Diferencias descartadas a propósito: la copia vieja metía `template/template_code/node_modules`
  dentro de la app y usaba Electron 32; aquí seguimos con `extraResources` (sin node_modules,
  el usuario hace `npm install` en el proyecto generado) y Electron 25, igual que en Mac.

## Convertidor Form → CF7 (hecho)
Pestaña "Form → CF7" (`renderer/cf7converter.js`): convierte los forms estáticos de la
empresa (estructura `.p-form__item` > `.p-form__title` + `.p-form__content`) a Contact
Form 7. Soporta **Multi-Step Forms** (form principal + confirm + estilos de botones) y
**Confirm Plus** (un solo form + clases `title-contactform7 for-{nombre}` en cada `<dt>` +
estilos `#wpcf7cpcnf`). Tipos: text/email/tel/textarea/radio/checkbox/select/address
(YubinBango: `p-postal-code`/`p-region`/… + span `p-country-name`)/file. DTX (post title o
taxonomy+slug). Privacy (`.p-form__privacy`) se deja intacta; `c-fontB` solo si ya estaba.

## Parte 2 — export JSON + plugin de WordPress (hecho)
En el resultado del convertidor: **"JSON を書き出す"** (export) y **"WordPress プラグインを
ダウンロード"** (abre `…/releases/latest/download/engineer-cf7-importer.zip`).
Reparto: **la app construye todo** (markup de los forms, mails y その他の設定); el plugin
(`wp-plugin/engineer-cf7-importer/`, un solo PHP) solo lo aplica. Motivo: el plugin vive en
cada WordPress y se actualiza a mano; la app se auto-actualiza. Cambiar textos de mails =
release de la app, no del plugin.
- JSON: `{format:"engineer-cf7", version:1, plugin, category, forms:[{role, title, form,
  mail?, mail_2?, additional_settings}]}`. Si cambia el formato, subir `EXPORT_VERSION`
  (cf7converter.js) y `ENGINEER_CF7_VERSION` (plugin) a la vez.
- Multi-Step: `main` (`do_not_store: true`, mails por defecto de CF7, no envía) + `confirm`
  (mails + `flamingo_subject: "{form}から"`). Confirm Plus: un `single` con mails + flamingo.
- Mails: 送信先/送信元 `info@platin.co.jp`, Reply-To, cuerpo = todos los campos
  `{label}：[tag]` (address `〒[zip] [addr]`, textarea con el tag en la línea siguiente).
  ファイル添付 = campo "File attachments" de CF7 con los `[file-NN]`. Textos según tipo
  お問い合わせ / エントリー (`MAIL_TEXTS` en cf7converter.js).
- Plugin: página bajo el menú de CF7 → subir JSON → crea forms (si el título ya existe,
  crea otro y avisa) → muestra un snippet `do_shortcode` por form con `html_class="h-adr"`.
- CI: el job `release-mac` comprime `wp-plugin/` y lo sube a la release (`gh release upload`).
- Avisos de CF7 esperables: Multi-Step confirm marca "Invalid mailbox syntax" en
  `[your-email]` (allí es `[multiform]`); Confirm Plus marca "Unsafe email config" en el
  mail 2 si la web no tiene reCAPTCHA/Turnstile/Akismet.
- Probar el plugin sin PHP local: WordPress Playground CLI (`@wp-playground/cli`, necesita
  Node ≥ 24 → `npx -p node@24 -p @wp-playground/cli …`).
