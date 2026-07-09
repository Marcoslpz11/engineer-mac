const fs = require("fs");
const path = require("path");
const os = require("os");

const MAX_CONCURRENT = 4;

function applyColors(content, fillColor, strokeColor) {
    if (fillColor) {
        content = content.replace(/\bfill="(?!none")[^"]*"/gi, `fill="${fillColor}"`);
        content = content.replace(/(style="[^"]*\bfill\s*:\s*)[^;"]+/gi, `$1${fillColor}`);
        content = content.replace(/(\bfill\s*:\s*)([^;}"'\s]+)/gi, (match, prefix, value) => {
            if (value === "none") return match;
            return `${prefix}${fillColor}`;
        });
    }

    if (strokeColor) {
        content = content.replace(/\bstroke="(?!none")[^"]*"/gi, `stroke="${strokeColor}"`);
        content = content.replace(/(style="[^"]*\bstroke\s*:\s*)[^;"]+/gi, `$1${strokeColor}`);
        content = content.replace(/(\bstroke\s*:\s*)([^;}"'\s]+)/gi, (match, prefix, value) => {
            if (value === "none") return match;
            return `${prefix}${strokeColor}`;
        });
    }

    return content;
}

async function changeSvgColors(filePaths, fillColor, strokeColor) {
    const tempDir = path.join(os.tmpdir(), "svg-colors-" + Date.now());
    await fs.promises.mkdir(tempDir, { recursive: true });

    const results = [];
    let index = 0;

    async function worker() {
        while (index < filePaths.length) {
            const i = index++;
            const file = filePaths[i];
            try {
                const content = await fs.promises.readFile(file, "utf-8");
                const modified = applyColors(content, fillColor, strokeColor);
                const fileName = path.basename(file);
                const outPath = path.join(tempDir, fileName);
                await fs.promises.writeFile(outPath, modified, "utf-8");
                results.push({ src: file, out: outPath, name: fileName });
            } catch (err) {
                console.error("Error en svgColors", file, err);
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, filePaths.length) }, worker));
    return { files: results, tempDir };
}

module.exports = { changeSvgColors };
