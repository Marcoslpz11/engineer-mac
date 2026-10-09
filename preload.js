const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    selectFilesOrFolder: (type) => ipcRenderer.invoke("select-files-or-folder", type),
    convertToWebp: (options) => ipcRenderer.invoke("convert-to-webp", options),
    downloadWebp: (files) => ipcRenderer.invoke("download-webp", files),
    minifyFiles: (files) => ipcRenderer.invoke("minify-files", files),
    downloadMinified: (files) => ipcRenderer.invoke("download-minified", files),
    isDirectory: (filePath) => ipcRenderer.invoke("is-directory", filePath),
    readDirImages: (folderPath) => ipcRenderer.invoke("read-dir-images", folderPath),
    readDirPhp: (folderPath) => ipcRenderer.invoke("read-dir-php", folderPath),
    changeSvgFill: (files, fillColor, strokeColor) => ipcRenderer.invoke("change-svg-fill", files, fillColor, strokeColor),
    downloadSvgFill: (files, newName) => ipcRenderer.invoke("download-svg-fill", files, newName),
    optimizeSvgs: (files) => ipcRenderer.invoke("optimize-svgs", files),
    beautifyFiles: (files) => ipcRenderer.invoke("beautify-files", files),
    downloadBeautified: (files) => ipcRenderer.invoke("download-beautified", files),
    convertToWp: (filePaths) => ipcRenderer.invoke("convert-to-wp", filePaths),
    downloadWp: (files) => ipcRenderer.invoke("download-wp", files),
    selectSaveFolder: () => ipcRenderer.invoke("select-save-folder"),
    createWpTheme: (options) => ipcRenderer.invoke("create-wp-theme", options),
    createTemplate: (options) => ipcRenderer.invoke("create-template", options),
    submitErrorReport: (data) => ipcRenderer.invoke("submit-error-report", data),

    // Actualizaciones
    updater: {
        getVersion: () => ipcRenderer.invoke("updater:get-version"),
        check: () => ipcRenderer.invoke("updater:check"),
        download: () => ipcRenderer.invoke("updater:download"),
        install: () => ipcRenderer.invoke("updater:install"),
        onStatus: (callback) => ipcRenderer.on("updater:status", (_event, data) => callback(data)),
    },
});