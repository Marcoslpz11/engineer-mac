const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

/**
 * Convierte imágenes a WebP y reemplaza los archivos originales.
 * @param {Object} options
 *   - files: array de rutas de archivos
 *   - resizeEnabled: boolean
 *   - maxWidth: número
 *   - quality: número (0-100)
 * @returns {Promise<string[]>} Array de archivos convertidos (con nombres originales)
 */
async function convertToWebp(options) {
    const { files, resizeEnabled, maxWidth, quality = 90, keepOriginalName = false } = options;

    if (!files || !files.length) return [];

    const converted = [];
    const MAX_CONCURRENT = 4;
    let index = 0;

    async function worker() {
        while (index < files.length) {
            const i = index++;
            const srcPath = files[i];
            const ext = path.extname(srcPath).toLowerCase();
            const base = path.basename(srcPath, ext);
            const dir = path.dirname(srcPath);
            const tempPath = path.join(dir, `${base}.webp`);

            try {
                const originalSize = fs.statSync(srcPath).size;

                let image = sharp(srcPath);
                const metadata = await image.metadata();

                if (resizeEnabled && metadata.width > maxWidth) {
                    image = image.resize({ width: maxWidth });
                }

                await image.webp({ quality }).toFile(tempPath);

                let outputPath;
                if (keepOriginalName) {
                    await fs.promises.rename(tempPath, srcPath);
                    outputPath = srcPath;
                } else {
                    outputPath = tempPath;
                }

                const convertedSize = fs.statSync(outputPath).size;

                converted.push({ path: outputPath, originalSize, convertedSize });
            } catch (err) {
                console.error(`Error procesando ${srcPath}:`, err);
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, files.length) }, worker));

    return converted;
}

module.exports = { convertToWebp };
