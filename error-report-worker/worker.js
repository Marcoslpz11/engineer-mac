/**
 * Cloudflare Worker: recibe reportes de error de la app Engineer
 * y crea un issue en el repositorio de GitHub.
 *
 * Variables de entorno (secrets) necesarias (ver README.md):
 *   - GH_TOKEN  : token fine-grained de GitHub con permiso Issues: write en el repo
 *   - GH_OWNER  : dueño del repo (p.ej. Marcoslpz11)
 *   - GH_REPO   : nombre del repo (p.ej. engineer-mac)
 *   - APP_KEY   : clave compartida que debe coincidir con la de la app
 */
export default {
	async fetch(request, env) {
		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		// Clave compartida (anti-abuso básico)
		if (env.APP_KEY && request.headers.get("X-App-Key") !== env.APP_KEY) {
			return new Response("Forbidden", { status: 403 });
		}

		let data;
		try {
			data = await request.json();
		} catch {
			return new Response("Bad JSON", { status: 400 });
		}

		const message = (data.message || "").toString().slice(0, 5000);
		if (!message.trim()) {
			return new Response("Empty message", { status: 400 });
		}

		const reporter = (data.reporter || "匿名 / anonymous").toString().slice(0, 100);
		const firstLine = message.split("\n")[0].slice(0, 80);
		const title = `[Error report] ${firstLine}`;
		const body = [
			message,
			"",
			"---",
			`- Reporter: ${reporter}`,
			`- Version: ${data.version || "?"}`,
			`- Platform: ${data.platform || "?"} ${data.arch || ""} (${data.osRelease || "?"})`,
			`- Timestamp: ${data.timestamp || new Date().toISOString()}`,
		].join("\n");

		const ghResp = await fetch(
			`https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/issues`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.GH_TOKEN}`,
					Accept: "application/vnd.github+json",
					"User-Agent": "engineer-error-reporter",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ title, body, labels: ["error-report"] }),
			}
		);

		if (!ghResp.ok) {
			const detail = await ghResp.text();
			return new Response("GitHub error: " + detail, { status: 502 });
		}

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	},
};
