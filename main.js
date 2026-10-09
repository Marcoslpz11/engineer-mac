const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const https = require("https");

// Endpoint del Worker de Cloudflare que crea los issues en GitHub.
// Se rellena con la URL del Worker tras desplegarlo. Vacío = solo log local.
const ERROR_REPORT_ENDPOINT = "https://engineer-error-reporter.marcos-49a.workers.dev";
// Clave compartida simple (debe coincidir con el secret APP_KEY del Worker).
const ERROR_REPORT_KEY = "7df736c922a65035b4c5e2dd52502b78";

// Se inicializa de forma diferida dentro de app.whenReady() (ver initAutoUpdater),
// porque electron-updater necesita que la app de Electron ya esté lista.
let autoUpdater = null;

// Pre-load all modules at startup (avoids re-requiring on every IPC call)
const { convertToWebp } = require(path.join(__dirname, "renderer", "modules", "convertWebp.js"));
const { changeSvgColors } = require(path.join(__dirname, "renderer", "modules", "svgFill.js"));
const { optimizeSvgs } = require(path.join(__dirname, "renderer", "modules", "optimizeSvg.js"));
const { beautifyFiles } = require(path.join(__dirname, "renderer", "modules", "beautifyFiles.js"));
const { minifyFiles } = require(path.join(__dirname, "renderer", "modules", "minifyFiles.js"));
const { convertToWp } = require(path.join(__dirname, "renderer", "modules", "wpConvert.js"));
const { createTemplate } = require(path.join(__dirname, "renderer", "modules", "templateCreator.js"));
const { createWpTheme }  = require(path.join(__dirname, "renderer", "modules", "wpThemeCreator.js"));

const TEMPLATE_SRC = app.isPackaged
	? path.join(process.resourcesPath, "template", "template_code")
	: path.join(__dirname, "template", "template_code");

let mainWindow;
const tempDirs = new Set(); // Track temp dirs for cleanup on quit

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		icon: path.join(__dirname, "images", "logo.icns"),
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true,
		},
	});

	mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

	mainWindow.once("ready-to-show", () => {
		mainWindow.show();
		mainWindow.focus();
	});

	mainWindow.on("closed", () => (mainWindow = null));
}

app.whenReady().then(() => {
	if (process.platform === "darwin") {
		const icon = nativeImage.createFromPath(path.join(__dirname, "images", "logo.icns"));
		if (!icon.isEmpty()) app.dock.setIcon(icon);
	}
	initAutoUpdater();
	createWindow();

	// Comprobar actualizaciones automáticamente al arrancar (solo en la app instalada)
	if (app.isPackaged && autoUpdater) {
		autoUpdater.checkForUpdates().catch(() => {});
	}
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Clean up temp dirs on quit
app.on("before-quit", async () => {
	await Promise.all(
		[...tempDirs].map(dir =>
			fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {})
		)
	);
});

// ========================
// Auto Updater
// ========================
function sendUpdateStatus(data) {
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send("updater:status", data);
	}
}

function initAutoUpdater() {
	autoUpdater = require("electron-updater").autoUpdater;
	autoUpdater.autoDownload = false;           // No descargar hasta que el usuario pulse el botón
	autoUpdater.autoInstallOnAppQuit = true;    // Si se descargó, instalar al cerrar la app

	autoUpdater.on("checking-for-update", () => sendUpdateStatus({ state: "checking" }));
	autoUpdater.on("update-available", (info) => sendUpdateStatus({ state: "available", version: info.version }));
	autoUpdater.on("update-not-available", () => sendUpdateStatus({ state: "not-available" }));
	autoUpdater.on("download-progress", (p) => sendUpdateStatus({ state: "progress", percent: Math.round(p.percent) }));
	autoUpdater.on("update-downloaded", (info) => sendUpdateStatus({ state: "downloaded", version: info.version }));
	autoUpdater.on("error", (err) => sendUpdateStatus({ state: "error", message: err == null ? "unknown" : (err.message || String(err)) }));
}

ipcMain.handle("updater:get-version", () => app.getVersion());

ipcMain.handle("updater:check", async () => {
	if (!app.isPackaged || !autoUpdater) return { dev: true };
	try {
		await autoUpdater.checkForUpdates();
		return { ok: true };
	} catch (err) {
		return { error: err.message };
	}
});

ipcMain.handle("updater:download", async () => {
	if (!autoUpdater) return { error: "updater not ready" };
	try {
		await autoUpdater.downloadUpdate();
		return { ok: true };
	} catch (err) {
		return { error: err.message };
	}
});

ipcMain.handle("updater:install", () => {
	if (autoUpdater) autoUpdater.quitAndInstall();
});

// ========================
// Reporte de errores
// ========================
function writeLocalErrorLog(entry) {
	try {
		const logPath = path.join(app.getPath("userData"), "error-reports.log");
		fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf-8");
		return logPath;
	} catch (err) {
		console.error("No se pudo escribir el log local:", err);
		return null;
	}
}

function postJson(endpoint, data, key) {
	return new Promise((resolve, reject) => {
		const body = JSON.stringify(data);
		const u = new URL(endpoint);
		const req = https.request({
			hostname: u.hostname,
			path: u.pathname + u.search,
			port: u.port || 443,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(body),
				"X-App-Key": key,
			},
		}, (res) => {
			let resp = "";
			res.on("data", (c) => (resp += c));
			res.on("end", () => {
				if (res.statusCode >= 200 && res.statusCode < 300) resolve(resp);
				else reject(new Error(`HTTP ${res.statusCode}: ${resp}`));
			});
		});
		req.on("error", reject);
		req.write(body);
		req.end();
	});
}

ipcMain.handle("submit-error-report", async (_event, { message, reporter } = {}) => {
	const entry = {
		message: (message || "").trim(),
		reporter: (reporter || "").trim(),
		version: app.getVersion(),
		platform: process.platform,
		osRelease: os.release(),
		arch: process.arch,
		timestamp: new Date().toISOString(),
	};

	if (!entry.message) return { error: "empty" };

	// Guardar siempre una copia local (fallback)
	const logPath = writeLocalErrorLog(entry);

	// Sin endpoint configurado -> solo local
	if (!ERROR_REPORT_ENDPOINT) {
		return { localOnly: true, logPath };
	}

	// Enviar al Worker
	try {
		await postJson(ERROR_REPORT_ENDPOINT, entry, ERROR_REPORT_KEY);
		return { ok: true };
	} catch (err) {
		console.error("Error enviando el reporte:", err);
		return { sentFailedSavedLocal: true, logPath, detail: err.message };
	}
});

// ========================
// IPC Handlers
// ========================

ipcMain.handle("is-directory", async (_event, filePath) => {
	const stat = await fs.promises.lstat(filePath);
	return stat.isDirectory();
});

ipcMain.handle("read-dir-images", async (_event, folderPath) => {
	const imageExts = new Set([".jpg", ".jpeg", ".png"]);
	async function walk(dir) {
		const entries = await fs.promises.readdir(dir, { withFileTypes: true });
		const results = await Promise.all(entries.map(entry => {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) return walk(fullPath);
			if (imageExts.has(path.extname(entry.name).toLowerCase())) return [fullPath];
			return [];
		}));
		return results.flat();
	}
	return walk(folderPath);
});

// Seleccionar archivos o carpeta
ipcMain.handle("select-files-or-folder", async (_event, type) => {
	const fileOnlyTypes = {
		minify:   { filters: [{ name: "CSS / SCSS / JS", extensions: ["css", "scss", "js"] }] },
		beautify: { filters: [{ name: "JS / CSS", extensions: ["js", "css"] }] },
		svg:      { filters: [{ name: "SVG", extensions: ["svg"] }] },
	};

	const config = fileOnlyTypes[type];

	if (config) {
		const result = await dialog.showOpenDialog(mainWindow, {
			title: "Seleccionar archivos",
			properties: ["openFile", "multiSelections"],
			filters: config.filters,
		});
		if (result.canceled) return null;
		return result.filePaths;
	}

	const result = await dialog.showOpenDialog(mainWindow, {
		title: "Seleccionar carpeta o archivos",
		properties: ["openFile", "openDirectory", "multiSelections"],
	});
	if (result.canceled) return null;
	return result.filePaths;
});

// Convertir a WebP
ipcMain.handle("convert-to-webp", async (_event, options) => {
	try {
		return { files: await convertToWebp(options) };
	} catch (err) {
		console.error("Error convertToWebp:", err);
		return { error: err.message };
	}
});

// Descargar WebP
ipcMain.handle("download-webp", async (_event, convertedFiles) => {
	try {
		const result = await dialog.showOpenDialog(mainWindow, {
			title: "Seleccionar carpeta de destino",
			properties: ["openDirectory"]
		});
		if (result.canceled || !result.filePaths.length) return false;
		const destDir = result.filePaths[0];

		await Promise.all(convertedFiles.map(file =>
			fs.promises.copyFile(file, path.join(destDir, path.basename(file)))
		));
		return true;
	} catch (err) {
		console.error("Error al descargar WebP:", err);
		return false;
	}
});

// ========================
// SVG Fill
// ========================
ipcMain.handle("change-svg-fill", async (_event, filePaths, fillColor, strokeColor) => {
	try {
		const result = await changeSvgColors(filePaths, fillColor, strokeColor);
		if (result.tempDir) tempDirs.add(result.tempDir);
		return { files: result.files };
	} catch (err) {
		console.error("Error changeSvgColors:", err);
		return { error: err.message };
	}
});

ipcMain.handle("download-svg-fill", async (_event, files, newName) => {
	try {
		const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
			title: "Seleccionar carpeta de destino",
			properties: ["openDirectory"]
		});
		if (canceled || !filePaths.length) return null;

		const destDir = filePaths[0];
		await Promise.all(files.map(file => {
			const ext = path.extname(file.name);
			const fileName = newName ? `${newName}${ext}` : file.name;
			return fs.promises.copyFile(file.out, path.join(destDir, fileName));
		}));
		return destDir;
	} catch (err) {
		console.error("Error download-svg-fill:", err);
		return null;
	}
});

// ========================
// SVG Optimizer
// ========================
ipcMain.handle("optimize-svgs", async (_event, filePaths) => {
	try {
		return { files: await optimizeSvgs(filePaths) };
	} catch (err) {
		console.error("Error optimizeSvgs:", err);
		return { error: err.message };
	}
});

// ========================
// Beautify
// ========================
ipcMain.handle("beautify-files", async (_event, filePaths) => {
	try {
		return { files: await beautifyFiles(filePaths) };
	} catch (err) {
		console.error("Error beautifyFiles:", err);
		return { error: err.message };
	}
});

ipcMain.handle("download-beautified", async (_event, files) => {
	try {
		const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
			title: "Seleccionar carpeta de destino",
			properties: ["openDirectory"]
		});
		if (canceled || !filePaths.length) return null;

		const destDir = filePaths[0];
		await Promise.all(files.map(file =>
			fs.promises.copyFile(file, path.join(destDir, path.basename(file)))
		));
		return destDir;
	} catch (err) {
		console.error("Error download-beautified:", err);
		return null;
	}
});

// ========================
// Minify
// ========================
ipcMain.handle("minify-files", async (_event, filePaths) => {
	try {
		return { files: await minifyFiles(filePaths) };
	} catch (err) {
		console.error("Error minifyFiles:", err);
		return { error: err.message };
	}
});

// ========================
// WP Convert
// ========================
ipcMain.handle("read-dir-php", async (_event, folderPath) => {
	async function walk(dir) {
		const entries = await fs.promises.readdir(dir, { withFileTypes: true });
		const results = await Promise.all(entries.map(entry => {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) return walk(fullPath);
			if (path.extname(entry.name).toLowerCase() === ".php") return [fullPath];
			return [];
		}));
		return results.flat();
	}
	return walk(folderPath);
});

ipcMain.handle("convert-to-wp", async (_event, filePaths) => {
	try {
		const result = await convertToWp(filePaths);
		if (result.tempDir) tempDirs.add(result.tempDir);
		return result;
	} catch (err) {
		console.error("Error convertToWp:", err);
		return { error: err.message };
	}
});

ipcMain.handle("download-wp", async (_event, files) => {
	try {
		const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
			title: "Seleccionar carpeta de destino",
			properties: ["openDirectory"]
		});
		if (canceled || !filePaths.length) return null;

		const destDir = filePaths[0];
		await Promise.all(files.map(file =>
			fs.promises.copyFile(file.out, path.join(destDir, file.name))
		));
		return destDir;
	} catch (err) {
		console.error("Error download-wp:", err);
		return null;
	}
});

// ========================
// WP Theme Creator
// ========================
ipcMain.handle("create-wp-theme", async (_event, options) => {
	try {
		return await createWpTheme(options);
	} catch (err) {
		console.error("Error createWpTheme:", err);
		return { error: err.message };
	}
});

// ========================
// Template Creator
// ========================
ipcMain.handle("select-save-folder", async (_event) => {
	const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
		title: "Seleccionar carpeta de destino",
		properties: ["openDirectory", "createDirectory"]
	});
	if (canceled || !filePaths.length) return null;
	return filePaths[0];
});

ipcMain.handle("create-template", async (_event, options) => {
	try {
		return await createTemplate({ ...options, templateSrc: TEMPLATE_SRC });
	} catch (err) {
		console.error("Error createTemplate:", err);
		return { error: err.message };
	}
});

ipcMain.handle("download-minified", async (_event, files) => {
	try {
		const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
			title: "Seleccionar carpeta de destino",
			properties: ["openDirectory"]
		});
		if (canceled || !filePaths.length) return null;

		const destDir = filePaths[0];
		await Promise.all(files.map(file =>
			fs.promises.copyFile(file, path.join(destDir, path.basename(file)))
		));
		return [destDir];
	} catch (err) {
		console.error(err);
		return null;
	}
});
