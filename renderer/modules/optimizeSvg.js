const fs = require("fs");
const path = require("path");
const { optimize } = require("svgo");

const MAX_CONCURRENT = 4;

async function optimizeSvgs(filePaths) {
    const results = [];
    let index = 0;

    async function worker() {
        while (index < filePaths.length) {
            const i = index++;
            const file = filePaths[i];
            try {
                const content = await fs.promises.readFile(file, "utf-8");
                const originalSize = Buffer.byteLength(content, "utf-8");

                const result = optimize(content, { path: file, multipass: true });
                const optimizedSize = Buffer.byteLength(result.data, "utf-8");

                await fs.promises.writeFile(file, result.data, "utf-8");
                results.push({ path: file, name: path.basename(file), originalSize, optimizedSize });
            } catch (err) {
                console.error("Error optimizando", file, err);
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, filePaths.length) }, worker));
    return results;
}

module.exports = { optimizeSvgs };
