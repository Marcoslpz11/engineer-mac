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
