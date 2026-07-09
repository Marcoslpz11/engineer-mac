const fs = require("fs");
const path = require("path");
const beautify = require("js-beautify");

const MAX_CONCURRENT = 4;

async function beautifyFiles(filePaths) {
    const results = [];
    let index = 0;

    async function worker() {
        while (index < filePaths.length) {
            const i = index++;
            const file = filePaths[i];
            const ext = path.extname(file).toLowerCase();
            try {
                const content = await fs.promises.readFile(file, "utf-8");
                let formatted;

                if (ext === ".js") {
                    formatted = beautify.js(content, { indent_size: 2, space_in_empty_paren: true });
                } else if (ext === ".css") {
                    formatted = beautify.css(content, { indent_size: 2 });
                } else {
                    continue;
                }

                const dir = path.dirname(file);
                const base = path.basename(file, ext);
                const outFile = path.join(dir, base + ".beautify" + ext);
                await fs.promises.writeFile(outFile, formatted, "utf-8");
                results.push(outFile);
            } catch (err) {
                console.error("Error formateando", file, err);
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, filePaths.length) }, worker));
    return results;
}

module.exports = { beautifyFiles };
