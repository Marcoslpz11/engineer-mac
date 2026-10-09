// ========================
// Helpers
// ========================

// Traduce el error devuelto por un módulo: si trae una clave i18n (errorKey)
// la traduce según el idioma; si no, muestra el error crudo (p.ej. del sistema).
function errMsg(result) {
    if (result && result.errorKey) {
        let m = t(result.errorKey);
        if (result.errorParams) {
            for (const [k, v] of Object.entries(result.errorParams)) {
                m = m.replace("{" + k + "}", v);
            }
        }
        return m;
    }
    return (result && result.error) || "";
}

// ========================
// Variables y elementos UI
// ========================

// ---- Pestaña WebP ----
let selectedFolder = "";
let selectedFiles = [];
let convertedFiles = [];

const selectBtn = document.getElementById("selectFolder");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const previewContainer = document.getElementById("previewContainer");
const statusText = document.getElementById("status");
const selectedInfo = document.getElementById("selectedInfo");
const maxWidthInput = document.getElementById("maxWidth");
const resizeToggle = document.getElementById("resizeToggle");
const qualitySlider = document.getElementById("qualitySlider");
const qualityValue = document.getElementById("qualityValue");
const keepNameToggle = document.getElementById("keepNameToggle");

// ---- Pestaña Minify ----
let minifyFiles = [];
const selectFilesMinBtn = document.getElementById("selectFilesMin");
const minifyBtn = document.getElementById("minifyBtn");
const downloadMinBtn = document.getElementById("downloadMinBtn");
const minifyStatus = document.getElementById("minifyStatus");
const selectedMinFilesList = document.getElementById("selectedMinFiles");

// ========================
// Inicialización de botones
// ========================
convertBtn.disabled = true;
downloadBtn.disabled = true;
minifyBtn.disabled = true;
downloadMinBtn.disabled = true;

// ========================
// Slider calidad WebP
// ========================
qualitySlider.addEventListener("input", () => {
    qualityValue.textContent = qualitySlider.value;
});

// ========================
// Pestañas
// ========================
const tabButtons = document.querySelectorAll(".tabButton");
const tabContents = document.querySelectorAll(".tabContent");

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

// Sub-tabs
document.querySelectorAll(".subTabButton").forEach(btn => {
    btn.addEventListener("click", () => {
        const group = btn.closest(".tabContent");
        group.querySelectorAll(".subTabButton").forEach(b => b.classList.remove("active"));
        group.querySelectorAll(".subTabContent").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        group.querySelector("#" + btn.dataset.subtab).classList.add("active");
    });
});

// ========================
// Utilidades
// ========================
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ========================
// Funciones WebP
// ========================

// Selección de archivos o carpeta
selectBtn.addEventListener("click", async () => {
    try {
        const result = await window.electronAPI.selectFilesOrFolder("webp");
        if (!result || !result.length) return;

        const isFolder = await window.electronAPI.isDirectory(result[0]);
        if (isFolder) {
            selectedFolder = result[0];
            selectedFiles = [];
            selectedInfo.textContent = t("common.folderSelected") + result[0];
        } else {
            selectedFiles = result;
            selectedFolder = "";
            selectedInfo.textContent = result.length === 1
                ? t("common.fileSelected") + result[0]
                : result.length + t("common.filesSelected");
        }

        convertedFiles = [];
        statusText.textContent = "";
        convertBtn.disabled = false;
        downloadBtn.disabled = true;

        await updateWebPPreview();
    } catch (err) {
        statusText.textContent = t("common.errorSelect") + err.message;
        console.error(err);
    }
});

// Convertir a WebP
convertBtn.addEventListener("click", async () => {
    const maxWidth = parseInt(maxWidthInput.value);
    const resizeEnabled = resizeToggle.checked;
    const quality = parseInt(qualitySlider.value);
    const keepOriginalName = keepNameToggle.checked;

    const pathsToConvert = selectedFolder
        ? await window.electronAPI.readDirImages(selectedFolder)
        : selectedFiles;

    if (!pathsToConvert.length) {
        statusText.textContent = t("webp.noImages");
        return;
    }

    statusText.textContent = t("webp.converting");
    convertBtn.disabled = true;

    const webpResult = await window.electronAPI.convertToWebp({
        files: pathsToConvert,
        resizeEnabled,
        maxWidth,
        quality,
        keepOriginalName
    });

    if (webpResult.error) {
        statusText.textContent = t("common.error") + webpResult.error;
        convertBtn.disabled = false;
        return;
    }

    convertedFiles = webpResult.files.map(f => f.path);

    const totalOriginal = webpResult.files.reduce((acc, f) => acc + f.originalSize, 0);
    const totalConverted = webpResult.files.reduce((acc, f) => acc + f.convertedSize, 0);
    const saved = totalOriginal - totalConverted;
    const pct = ((saved / totalOriginal) * 100).toFixed(1);

    statusText.textContent = `${t("webp.done")} ${webpResult.files.length} · ${formatBytes(totalOriginal)} → ${formatBytes(totalConverted)} (−${pct}%)`;
    downloadBtn.disabled = false;
    convertBtn.disabled = false;

    await updateWebPPreview();
});

// Descargar WebP
downloadBtn.addEventListener("click", async () => {
    if (!convertedFiles.length) return;

    statusText.textContent = t("common.selectingDest");
    const success = await window.electronAPI.downloadWebp(convertedFiles);
    if (success) statusText.textContent = t("webp.downloadDone");
});

// Preview de imágenes
async function updateWebPPreview() {
    previewContainer.innerHTML = "";

    const paths = selectedFolder
        ? await window.electronAPI.readDirImages(selectedFolder)
        : selectedFiles;

    paths.forEach(file => {
        const img = document.createElement("img");
        img.src = "file://" + file;
        img.classList.add("previewImage");
        img.loading = "lazy";
        previewContainer.appendChild(img);
    });
}

// ========================
// Funciones Minify
// ========================

selectFilesMinBtn.addEventListener("click", async () => {
    const files = await window.electronAPI.selectFilesOrFolder("minify");
    if (!files || !files.length) return;

    minifyFiles = files.filter(f => /\.(css|scss|js)$/i.test(f));
    if (!minifyFiles.length) return;

    minifyBtn.disabled = false;
    downloadMinBtn.disabled = true;

    selectedMinFilesList.innerHTML = "";
    minifyFiles.forEach(f => {
        const li = document.createElement("li");
        li.textContent = f;
        selectedMinFilesList.appendChild(li);
    });

    minifyStatus.textContent = minifyFiles.length + t("minify.filesSelected");
});

minifyBtn.addEventListener("click", async () => {
    if (!minifyFiles.length) return;

    minifyStatus.textContent = t("minify.minifying");
    minifyBtn.disabled = true;

    const minifyResult = await window.electronAPI.minifyFiles(minifyFiles);

    if (minifyResult.error) {
        minifyStatus.textContent = t("common.error") + minifyResult.error;
        minifyBtn.disabled = false;
        return;
    }

    minifyStatus.textContent = minifyResult.files.length + t("minify.done");
    downloadMinBtn.disabled = false;
    minifyBtn.disabled = false;

    minifyFiles = minifyResult.files;
});

// ========================
// Funciones SVG Fill
// ========================

let svgFillFiles = [];
let svgFillResultFiles = [];

const selectSvgFillBtn = document.getElementById("selectSvgFillFiles");
const svgFillBtn = document.getElementById("svgFillBtn");
const downloadSvgFillBtn = document.getElementById("downloadSvgFillBtn");
const svgFillStatus = document.getElementById("svgFillStatus");
const svgFillFileList = document.getElementById("svgFillFileList");
const svgRenameName = document.getElementById("svgRenameName");
const svgFillColorPicker = document.getElementById("svgFillColor");
const svgFillHexInput = document.getElementById("svgFillHex");
const svgFillClearBtn = document.getElementById("svgFillClear");
const svgStrokeColorPicker = document.getElementById("svgStrokeColor");
const svgStrokeHexInput = document.getElementById("svgStrokeHex");
const svgStrokeClearBtn = document.getElementById("svgStrokeClear");

svgFillBtn.disabled = true;
downloadSvgFillBtn.disabled = true;

// Sincronizar fill picker <-> hex
svgFillColorPicker.addEventListener("input", () => {
    svgFillHexInput.value = svgFillColorPicker.value;
});
svgFillHexInput.addEventListener("input", () => {
    if (/^#[0-9a-fA-F]{6}$/.test(svgFillHexInput.value)) {
        svgFillColorPicker.value = svgFillHexInput.value;
    }
});
svgFillClearBtn.addEventListener("click", () => { svgFillHexInput.value = ""; });

// Sincronizar stroke picker <-> hex
svgStrokeColorPicker.addEventListener("input", () => {
    svgStrokeHexInput.value = svgStrokeColorPicker.value;
});
svgStrokeHexInput.addEventListener("input", () => {
    if (/^#[0-9a-fA-F]{6}$/.test(svgStrokeHexInput.value)) {
        svgStrokeColorPicker.value = svgStrokeHexInput.value;
    }
});
svgStrokeClearBtn.addEventListener("click", () => { svgStrokeHexInput.value = ""; });

selectSvgFillBtn.addEventListener("click", async () => {
    try {
        const result = await window.electronAPI.selectFilesOrFolder("svg");
        if (!result || !result.length) return;

        svgFillFiles = result.filter(f => /\.svg$/i.test(f));
        if (!svgFillFiles.length) {
            svgFillStatus.textContent = t("common.noSvgFiles");
            return;
        }

        svgFillResultFiles = [];
        svgFillStatus.textContent = svgFillFiles.length + t("common.filesSelected");
        svgFillBtn.disabled = false;
        downloadSvgFillBtn.disabled = true;

        svgFillFileList.innerHTML = "";
        svgFillFiles.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            svgFillFileList.appendChild(li);
        });
    } catch (err) {
        svgFillStatus.textContent = t("common.errorSelect") + err.message;
    }
});

svgFillBtn.addEventListener("click", async () => {
    if (!svgFillFiles.length) return;

    const fillColor = svgFillHexInput.value || null;
    const strokeColor = svgStrokeHexInput.value || null;

    if (!fillColor && !strokeColor) {
        svgFillStatus.textContent = t("svgFill.colorRequired");
        return;
    }

    const labels = [fillColor && `fill: ${fillColor}`, strokeColor && `stroke: ${strokeColor}`].filter(Boolean).join(", ");
    svgFillStatus.textContent = t("svgFill.applying") + labels + "...";
    svgFillBtn.disabled = true;

    const result = await window.electronAPI.changeSvgFill(svgFillFiles, fillColor, strokeColor);

    if (result.error) {
        svgFillStatus.textContent = t("common.error") + errMsg(result);
        svgFillBtn.disabled = false;
        return;
    }

    svgFillResultFiles = result.files;
    svgFillStatus.textContent = svgFillResultFiles.length + t("svgFill.done");
    svgFillBtn.disabled = false;
    downloadSvgFillBtn.disabled = false;
});

downloadSvgFillBtn.addEventListener("click", async () => {
    if (!svgFillResultFiles.length) return;

    svgFillStatus.textContent = t("common.selectingDest");
    const newName = svgRenameName.value.trim() || null;
    const destDir = await window.electronAPI.downloadSvgFill(svgFillResultFiles, newName);

    if (!destDir) {
        svgFillStatus.textContent = t("common.downloadCancelled");
        return;
    }
    svgFillStatus.textContent = t("common.savedTo") + destDir;
});

// ========================
// Funciones SVG
// ========================

let svgSelectedFiles = [];

const selectSvgBtn = document.getElementById("selectSvgFiles");
const svgOptimizeBtn = document.getElementById("svgOptimizeBtn");
const svgStatus = document.getElementById("svgStatus");
const svgFileList = document.getElementById("svgFileList");

svgOptimizeBtn.disabled = true;

selectSvgBtn.addEventListener("click", async () => {
    try {
        const result = await window.electronAPI.selectFilesOrFolder("svg");
        if (!result || !result.length) return;

        svgSelectedFiles = result.filter(f => /\.svg$/i.test(f));
        if (!svgSelectedFiles.length) {
            svgStatus.textContent = t("common.noSvgFiles");
            return;
        }

        svgStatus.textContent = svgSelectedFiles.length + t("common.filesSelected");
        svgOptimizeBtn.disabled = false;

        svgFileList.innerHTML = "";
        svgSelectedFiles.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            svgFileList.appendChild(li);
        });
    } catch (err) {
        svgStatus.textContent = t("common.errorSelect") + err.message;
    }
});

svgOptimizeBtn.addEventListener("click", async () => {
    if (!svgSelectedFiles.length) return;

    svgStatus.textContent = t("svg.optimizing");
    svgOptimizeBtn.disabled = true;

    const result = await window.electronAPI.optimizeSvgs(svgSelectedFiles);

    if (result.error) {
        svgStatus.textContent = t("common.error") + errMsg(result);
        svgOptimizeBtn.disabled = false;
        return;
    }

    const totalOriginal = result.files.reduce((acc, f) => acc + f.originalSize, 0);
    const totalOptimized = result.files.reduce((acc, f) => acc + f.optimizedSize, 0);
    const saved = totalOriginal - totalOptimized;
    const pct = ((saved / totalOriginal) * 100).toFixed(1);

    svgStatus.textContent = result.files.length + t("svg.done") + `${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)} (−${pct}%)`;
    svgOptimizeBtn.disabled = false;

    svgFileList.innerHTML = "";
    result.files.forEach(f => {
        const li = document.createElement("li");
        const filePct = (((f.originalSize - f.optimizedSize) / f.originalSize) * 100).toFixed(1);
        li.textContent = `${f.name} — ${formatBytes(f.originalSize)} → ${formatBytes(f.optimizedSize)} (−${filePct}%)`;
        svgFileList.appendChild(li);
    });
});

// ========================
// Funciones Beautify
// ========================

let beautifySelectedFiles = [];
let beautifyResultFiles = [];

const selectBeautifyBtn = document.getElementById("selectBeautifyFiles");
const beautifyBtn = document.getElementById("beautifyBtn");
const downloadBeautifyBtn = document.getElementById("downloadBeautifyBtn");
const beautifyStatus = document.getElementById("beautifyStatus");
const beautifyFileList = document.getElementById("beautifyFileList");

beautifyBtn.disabled = true;
downloadBeautifyBtn.disabled = true;

selectBeautifyBtn.addEventListener("click", async () => {
    try {
        const result = await window.electronAPI.selectFilesOrFolder("beautify");
        if (!result || !result.length) return;

        beautifySelectedFiles = result.filter(f => /\.(js|css)$/i.test(f));
        if (!beautifySelectedFiles.length) {
            beautifyStatus.textContent = t("beautify.noFiles");
            return;
        }

        beautifyResultFiles = [];
        beautifyStatus.textContent = beautifySelectedFiles.length + t("common.filesSelected");
        beautifyBtn.disabled = false;
        downloadBeautifyBtn.disabled = true;

        beautifyFileList.innerHTML = "";
        beautifySelectedFiles.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            beautifyFileList.appendChild(li);
        });
    } catch (err) {
        beautifyStatus.textContent = t("common.errorSelect") + err.message;
    }
});

beautifyBtn.addEventListener("click", async () => {
    if (!beautifySelectedFiles.length) return;

    beautifyStatus.textContent = t("beautify.beautifying");
    beautifyBtn.disabled = true;

    const result = await window.electronAPI.beautifyFiles(beautifySelectedFiles);

    if (result.error) {
        beautifyStatus.textContent = t("common.error") + errMsg(result);
        beautifyBtn.disabled = false;
        return;
    }

    beautifyResultFiles = result.files;
    beautifyStatus.textContent = beautifyResultFiles.length + t("beautify.done");
    beautifyBtn.disabled = false;
    downloadBeautifyBtn.disabled = false;
});

downloadBeautifyBtn.addEventListener("click", async () => {
    if (!beautifyResultFiles.length) return;

    beautifyStatus.textContent = t("common.selectingDest");
    const destDir = await window.electronAPI.downloadBeautified(beautifyResultFiles);

    if (!destDir) {
        beautifyStatus.textContent = t("common.downloadCancelled");
        return;
    }
    beautifyStatus.textContent = t("common.savedTo") + destDir;
});

// ========================
// Funciones WP Convert
// ========================

let wpSelectedFiles = [];
let wpConvertedFiles = [];

const selectWpFolderBtn = document.getElementById("selectWpFolder");
const wpConvertBtn = document.getElementById("wpConvertBtn");
const wpDownloadBtn = document.getElementById("wpDownloadBtn");
const wpSelectedInfo = document.getElementById("wpSelectedInfo");
const wpStatus = document.getElementById("wpStatus");
const wpFileList = document.getElementById("wpFileList");

wpConvertBtn.disabled = true;
wpDownloadBtn.disabled = true;

selectWpFolderBtn.addEventListener("click", async () => {
    try {
        const result = await window.electronAPI.selectFilesOrFolder("wp");
        if (!result || !result.length) return;

        const isFolder = await window.electronAPI.isDirectory(result[0]);
        if (isFolder) {
            wpSelectedFiles = await window.electronAPI.readDirPhp(result[0]);
            wpSelectedInfo.textContent = t("wp.folderSelected") + result[0];
        } else {
            wpSelectedFiles = result.filter(f => f.endsWith(".php"));
            wpSelectedInfo.textContent = wpSelectedFiles.length === 1
                ? t("wp.fileSelected") + wpSelectedFiles[0]
                : wpSelectedFiles.length + t("common.filesSelected");
        }

        if (!wpSelectedFiles.length) {
            wpStatus.textContent = t("wp.noPhpFiles");
            return;
        }

        wpConvertedFiles = [];
        wpStatus.textContent = "";
        wpConvertBtn.disabled = false;
        wpDownloadBtn.disabled = true;

        wpFileList.innerHTML = "";
        wpSelectedFiles.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            wpFileList.appendChild(li);
        });
    } catch (err) {
        wpStatus.textContent = t("common.errorSelect") + err.message;
    }
});

wpConvertBtn.addEventListener("click", async () => {
    if (!wpSelectedFiles.length) return;

    wpStatus.textContent = t("wp.converting");
    wpConvertBtn.disabled = true;

    const result = await window.electronAPI.convertToWp(wpSelectedFiles);

    if (result.error) {
        wpStatus.textContent = t("common.error") + errMsg(result);
        wpConvertBtn.disabled = false;
        return;
    }

    wpConvertedFiles = result.files;
    wpStatus.textContent = t("wp.done") + ` ${wpConvertedFiles.length} · OK`;
    wpConvertBtn.disabled = false;
    wpDownloadBtn.disabled = false;
});

wpDownloadBtn.addEventListener("click", async () => {
    if (!wpConvertedFiles.length) return;

    wpStatus.textContent = t("common.selectingDest");
    const destDir = await window.electronAPI.downloadWp(wpConvertedFiles);

    if (!destDir) {
        wpStatus.textContent = t("common.downloadCancelled");
        return;
    }
    wpStatus.textContent = t("common.savedTo") + destDir;
});

// ========================
// Funciones WP Theme Creator
// ========================

let wpThemeSrcDir  = "";
let wpThemeDestDir = "";

const wpThemeSelectSrcBtn  = document.getElementById("wpThemeSelectSrc");
const wpThemeSrcPathEl     = document.getElementById("wpThemeSrcPath");
const wpThemeSelectDestBtn = document.getElementById("wpThemeSelectDest");
const wpThemeDestPathEl    = document.getElementById("wpThemeDestPath");
const wpThemeCreateBtn     = document.getElementById("wpThemeCreateBtn");
const wpThemeStatus        = document.getElementById("wpThemeStatus");
const wpArchiveList        = document.getElementById("wpArchiveList");
const wpAddArchiveRowBtn   = document.getElementById("wpAddArchiveRow");

function addArchiveRow(type = "", count = "") {
    const row = document.createElement("div");
    row.className = "archive-row";
    row.innerHTML = `
        <input type="text" class="archive-type" placeholder="${t("wpTheme.typePlaceholder")}" value="${type}">
        <input type="number" class="archive-count" placeholder="${t("wpTheme.countPlaceholder")}" min="1" value="${count}">
        <button class="archive-remove-btn" type="button">✕</button>
    `;
    row.querySelector(".archive-remove-btn").addEventListener("click", () => row.remove());
    wpArchiveList.appendChild(row);
}

wpAddArchiveRowBtn.addEventListener("click", () => addArchiveRow());

wpThemeSelectSrcBtn.addEventListener("click", async () => {
    const folder = await window.electronAPI.selectSaveFolder();
    if (!folder) return;
    wpThemeSrcDir = folder;
    wpThemeSrcPathEl.textContent = folder;
});

wpThemeSelectDestBtn.addEventListener("click", async () => {
    const folder = await window.electronAPI.selectSaveFolder();
    if (!folder) return;
    wpThemeDestDir = folder;
    wpThemeDestPathEl.textContent = folder;
});

wpThemeCreateBtn.addEventListener("click", async () => {
    const themeName = document.getElementById("wpThemeName").value.trim();

    if (!wpThemeSrcDir) {
        wpThemeStatus.textContent = t("wpTheme.errorNoSrc");
        return;
    }
    if (!themeName) {
        wpThemeStatus.textContent = t("wpTheme.errorNoName");
        return;
    }
    if (!wpThemeDestDir) {
        wpThemeStatus.textContent = t("wpTheme.errorNoDest");
        return;
    }

    // Recoger post types
    const archiveTypes = [];
    wpArchiveList.querySelectorAll(".archive-row").forEach(row => {
        const type  = row.querySelector(".archive-type").value.trim();
        const count = row.querySelector(".archive-count").value.trim();
        if (type && count) archiveTypes.push({ type, count });
    });

    // Recoger páginas con código postal
    const postalPages = document.getElementById("wpPostalPages").value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    wpThemeStatus.textContent = t("wpTheme.generating");
    wpThemeCreateBtn.disabled = true;

    const result = await window.electronAPI.createWpTheme({
        srcDir:       wpThemeSrcDir,
        destDir:      wpThemeDestDir,
        themeName,
        archiveTypes,
        postalPages,
    });

    wpThemeCreateBtn.disabled = false;

    if (result.error) {
        wpThemeStatus.textContent = t("common.error") + errMsg(result);
        return;
    }

    wpThemeStatus.textContent = t("wpTheme.done") + result.path;
});

// ========================
// Funciones Template Creator
// ========================

let templateDestDir = "";

const templateSelectDestBtn = document.getElementById("templateSelectDest");
const templateDestPathEl    = document.getElementById("templateDestPath");
const templateCreateBtn     = document.getElementById("templateCreateBtn");
const templateStatus        = document.getElementById("templateStatus");
const templatePageTitle     = document.getElementById("templatePageTitle");
const templateFolderName    = document.getElementById("templateFolderName");
const libScrollTrigger      = document.getElementById("libScrollTrigger");
const libGsap               = document.getElementById("libGsap");

// ScrollTrigger requiere GSAP
libScrollTrigger.addEventListener("change", () => {
    if (libScrollTrigger.checked) {
        libGsap.checked = true;
        libGsap.disabled = true;
    } else {
        libGsap.disabled = false;
    }
});

templateSelectDestBtn.addEventListener("click", async () => {
    const folder = await window.electronAPI.selectSaveFolder();
    if (!folder) return;
    templateDestDir = folder;
    templateDestPathEl.textContent = folder;
});

templateCreateBtn.addEventListener("click", async () => {
    const title      = templatePageTitle.value.trim();
    const folderName = templateFolderName.value.trim();

    if (!title) {
        templateStatus.textContent = t("template.errorNoTitle");
        return;
    }
    if (!folderName) {
        templateStatus.textContent = t("template.errorNoFolder");
        return;
    }
    if (!templateDestDir) {
        templateStatus.textContent = t("template.errorNoDest");
        return;
    }

    templateStatus.textContent = t("template.creating");
    templateCreateBtn.disabled = true;

    const result = await window.electronAPI.createTemplate({
        projectName: folderName,
        destDir:     templateDestDir,
        title,
        libraries: {
            swiper:        document.getElementById("libSwiper").checked,
            splide:        document.getElementById("libSplide").checked,
            gsap:          document.getElementById("libGsap").checked,
            scrollTrigger: document.getElementById("libScrollTrigger").checked,
            lenis:         document.getElementById("libLenis").checked,
            three:         document.getElementById("libThree").checked,
            scrollHint:    document.getElementById("libScrollHint").checked,
        },
        typesquare: document.getElementById("libTypesquare").checked,
    });

    templateCreateBtn.disabled = false;

    if (result.error) {
        templateStatus.textContent = t("common.error") + errMsg(result);
        return;
    }

    templateStatus.textContent = t("template.done") + result.path;
});

downloadMinBtn.addEventListener("click", async () => {
    if (!minifyFiles.length) return;

    minifyStatus.textContent = t("common.selectingDest");
    const savedFiles = await window.electronAPI.downloadMinified(minifyFiles);
    if (!savedFiles) return;

    minifyStatus.textContent = t("minify.savedTo") + savedFiles[0];
});

// ========================
// Actualizaciones (auto-updater)
// ========================
(function setupUpdater() {
    const versionEl = document.getElementById("appVersion");
    const checkBtn  = document.getElementById("checkUpdateBtn");
    const banner    = document.getElementById("updateBanner");
    const msgEl     = document.getElementById("updateMsg");
    const actionBtn = document.getElementById("updateActionBtn");

    if (!window.electronAPI || !window.electronAPI.updater) return;

    // Mostrar versión actual
    window.electronAPI.updater.getVersion().then((v) => {
        versionEl.textContent = "v" + v;
    });

    let dismissTimer = null;

    function show(text, autoDismissMs) {
        clearTimeout(dismissTimer);
        banner.classList.remove("hidden");
        msgEl.textContent = text;
        if (autoDismissMs) {
            dismissTimer = setTimeout(hide, autoDismissMs);
        }
    }
    function hide() {
        clearTimeout(dismissTimer);
        banner.classList.add("hidden");
        hideAction();
    }
    function hideAction() {
        actionBtn.classList.add("hidden");
        actionBtn.onclick = null;
    }

    // Botón "Buscar actualizaciones"
    checkBtn.addEventListener("click", async () => {
        show(t("update.checking"));
        hideAction();
        const r = await window.electronAPI.updater.check();
        if (r && r.dev)        show(t("update.devMode"), 5000);
        else if (r && r.error) show(t("update.error") + r.error, 7000);
    });

    // Eventos del proceso principal
    window.electronAPI.updater.onStatus((data) => {
        switch (data.state) {
            case "checking":
                show(t("update.checking"));
                hideAction();
                break;

            case "not-available":
                show(t("update.upToDate"), 5000);
                hideAction();
                break;

            case "available":
                show(t("update.available").replace("{v}", data.version));
                actionBtn.classList.remove("hidden");
                actionBtn.textContent = t("update.downloadBtn");
                actionBtn.disabled = false;
                actionBtn.onclick = async () => {
                    actionBtn.disabled = true;
                    const r = await window.electronAPI.updater.download();
                    if (r && r.error) show(t("update.error") + r.error);
                };
                break;

            case "progress":
                show(t("update.downloading").replace("{p}", data.percent));
                break;

            case "downloaded":
                show(t("update.ready").replace("{v}", data.version));
                actionBtn.classList.remove("hidden");
                actionBtn.textContent = t("update.installBtn");
                actionBtn.disabled = false;
                actionBtn.onclick = () => window.electronAPI.updater.install();
                break;

            case "error":
                show(t("update.error") + (data.message || ""), 7000);
                hideAction();
                break;
        }
    });
})();

// ========================
// Reporte de errores
// ========================
(function setupErrorReport() {
    const msgEl      = document.getElementById("errorMessage");
    const reporterEl = document.getElementById("errorReporter");
    const btn        = document.getElementById("errorSubmitBtn");
    const statusEl   = document.getElementById("errorStatus");

    if (!btn || !window.electronAPI || !window.electronAPI.submitErrorReport) return;

    btn.addEventListener("click", async () => {
        const message = msgEl.value.trim();
        if (!message) {
            statusEl.textContent = t("error.empty");
            return;
        }

        btn.disabled = true;
        statusEl.textContent = t("error.sending");

        const r = await window.electronAPI.submitErrorReport({
            message,
            reporter: reporterEl.value,
        });

        btn.disabled = false;

        if (r && r.ok) {
            statusEl.textContent = t("error.sent");
            msgEl.value = "";
            reporterEl.value = "";
        } else if (r && (r.localOnly || r.sentFailedSavedLocal)) {
            statusEl.textContent = t("error.failSaved");
        } else if (r && r.error === "empty") {
            statusEl.textContent = t("error.empty");
        } else {
            statusEl.textContent = t("error.fail");
        }
    });
})();
