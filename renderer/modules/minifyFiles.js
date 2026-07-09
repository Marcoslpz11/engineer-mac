const fs = require("fs");
const path = require("path");
const { minify } = require("terser");
const CleanCSS = require("clean-css");
const sass = require("sass");

const MAX_CONCURRENT = 4;

async function minifyFiles(filePaths) {
    const minifiedFiles = [];
    let index = 0;

    async function worker() {
        while (index < filePaths.length) {
            const i = index++;
            const file = filePaths[i];
            const ext = path.extname(file).toLowerCase();
            try {
                let content;
                if (ext === ".scss") {
                    content = sass.compile(file).css;
                } else {
                    content = await fs.promises.readFile(file, "utf-8");
                }

                let minified;
                if (ext === ".js") {
                    const result = await minify(content);
                    minified = result.code;
                } else if (ext === ".css" || ext === ".scss") {
                    minified = new CleanCSS().minify(content).styles;
                } else {
                    continue;
                }

                const dir = path.dirname(file);
                const base = path.basename(file, ext);
                const minFile = path.join(dir, base + ".min" + (ext === ".scss" ? ".css" : ext));
                await fs.promises.writeFile(minFile, minified, "utf-8");
                minifiedFiles.push(minFile);
            } catch (err) {
                console.error("Error minificando", file, err);
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, filePaths.length) }, worker));
    return minifiedFiles;
}

module.exports = { minifyFiles };
