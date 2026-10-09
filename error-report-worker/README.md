# Engineer — Worker de reporte de errores

Pequeño Cloudflare Worker que recibe los reportes de error de la app Engineer
y crea un **issue** en el repositorio de GitHub `Marcoslpz11/engineer-mac`.

El token de GitHub vive aquí (en el Worker), **no** dentro de la app distribuida.

## Despliegue (una sola vez)

Requisitos: una cuenta de Cloudflare (gratis) y Node instalado.

1. **Crear un token de GitHub** (fine-grained):
   - https://github.com/settings/tokens?type=beta → *Generate new token*
   - Resource owner: tu cuenta · Repository access: *Only select repositories* → `engineer-mac`
   - Permisos: **Issues → Read and write**
   - Copia el token (empieza por `github_pat_...`).

2. **Desplegar el Worker** (desde esta carpeta):
   ```bash
   cd error-report-worker
   npx wrangler@3 login          # abre el navegador para autorizar Cloudflare
   npx wrangler@3 deploy         # sube el Worker
   ```
   > Nota: usamos `wrangler@3` porque wrangler 4 requiere Node 22 (aquí hay Node 20).
   > YA DESPLEGADO en: https://engineer-error-reporter.marcos-49a.workers.dev
   Al final te dará una URL tipo:
   `https://engineer-error-reporter.<tu-subdominio>.workers.dev`

3. **Añadir los secrets** (no se guardan en el código):
   ```bash
   npx wrangler secret put GH_TOKEN   # pega el token de GitHub
   npx wrangler secret put APP_KEY    # inventa una clave (anota cuál)
   ```

4. **Conectar la app**: pásame la **URL del Worker** y la **APP_KEY**, y las pongo en
   `main.js` (`ERROR_REPORT_ENDPOINT` y `ERROR_REPORT_KEY`). Luego lanzamos una release.

## Probar el Worker (opcional)

```bash
curl -X POST "https://engineer-error-reporter.<tu-subdominio>.workers.dev" \
  -H "Content-Type: application/json" \
  -H "X-App-Key: TU_APP_KEY" \
  -d '{"message":"prueba de reporte","reporter":"Marcos","version":"0.1.4","platform":"darwin"}'
```

Debería aparecer un issue nuevo con la etiqueta `error-report` en el repo.

## Dónde ves los reportes

En los **Issues** del repo: https://github.com/Marcoslpz11/engineer-mac/issues
(filtra por la etiqueta `error-report`). Cierra el issue cuando lo soluciones.
