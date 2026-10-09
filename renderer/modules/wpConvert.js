const fs = require("fs");
const path = require("path");
const os = require("os");

const MAX_CONCURRENT = 4;

// Pre-compile all regex patterns once at module load
const wpBase = `<?php echo esc_url( home_url( '/' ) ); ?>`;
const wpBaseEscaped = wpBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const RE_SRC_ASSETS      = /src="\.\/assets\//g;
const RE_URL_SQ          = /url\('\.\/assets\//g;
const RE_URL_DQ          = /url\("\.\/assets\//g;
const RE_REQ_HDR1        = /<\?php require '\.\/header\.php'; \?>/g;
const RE_REQ_HDR2        = /<\?php require 'header\.php'; \?>/g;
const RE_REQ_FTR1        = /<\?php require '\.\/footer\.php'; \?>/g;
const RE_REQ_FTR2        = /<\?php require 'footer\.php'; \?>/g;
const RE_REQ_GENERIC     = /<\?php require '(?:\.\/)?([^']+)\.php'; \?>/g;
const RE_HREF_ASSETS     = /href="\.\/assets\//g;
const RE_HREF_ROOT_EXACT = /a href="\.\/"/g;
const RE_HREF_ROOT       = /a href="\.\//g;
const RE_PAGE            = new RegExp(`href="${wpBaseEscaped}page-([^"]+)\\.php"`, "g");
const RE_ARCHIVE         = new RegExp(`href="${wpBaseEscaped}archive-([^"]+)\\.php"`, "g");
const RE_TRAILING        = new RegExp(`href="(${wpBaseEscaped})([^"]*)"`, "g");
const RE_PHP_EXT         = /\.php\b/g;
const RE_HEAD_CLOSE      = /<\/head>/g;
const RE_BODY_CLOSE      = /<\/body>/g;
// Quita el meta robots noindex,nofollow (el sitio WP final sí debe indexarse)
const RE_ROBOTS_META     = /[ \t]*<meta\s+name=["']robots["']\s+content=["']\s*noindex\s*,\s*nofollow\s*["']\s*\/?>\s*\r?\n?/gi;

function applyReplacements(content) {
    content = content.replace(RE_ROBOTS_META,      "");
    content = content.replace(RE_SRC_ASSETS,      `src="<?php echo get_template_directory_uri(); ?>/assets/`);
    content = content.replace(RE_URL_SQ,           `url('<?php echo get_template_directory_uri(); ?>/assets/`);
    content = content.replace(RE_URL_DQ,           `url("<?php echo get_template_directory_uri(); ?>/assets/`);
    content = content.replace(RE_REQ_HDR1,         `<?php get_header(); ?>`);
    content = content.replace(RE_REQ_HDR2,         `<?php get_header(); ?>`);
    content = content.replace(RE_REQ_FTR1,         `<?php get_footer(); ?>`);
    content = content.replace(RE_REQ_FTR2,         `<?php get_footer(); ?>`);
    content = content.replace(RE_REQ_GENERIC,      (_, name) => `<?php get_template_part('${name}'); ?>`);
    content = content.replace(RE_HREF_ASSETS,      `href="<?php echo get_template_directory_uri(); ?>/assets/`);
    content = content.replace(RE_HREF_ROOT_EXACT,  `a href="<?php echo esc_url( home_url( '/' ) ); ?>"`);
    content = content.replace(RE_HREF_ROOT,        `a href="<?php echo esc_url( home_url( '/' ) ); ?>`);
    content = content.replace(RE_PAGE,             (_, name) => `href="${wpBase}${name}/"`);
    content = content.replace(RE_ARCHIVE,          (_, name) => `href="${wpBase}${name}/"`);
    content = content.replace(RE_TRAILING,         (match, base, rest) => {
        if (/^(https?:)?\/\//.test(rest)) return match;
        if (rest === "" || rest === "/" || rest.startsWith("#") || rest.startsWith("?")) return match;
        if (rest.includes("/assets/")) return match;
        if (rest.endsWith("/")) return match;
        return `href="${base}${rest}/"`;
    });
    content = content.replace(RE_PHP_EXT,          "");
    content = content.replace(RE_HEAD_CLOSE,       `<?php wp_head(); ?>\n</head>`);
    content = content.replace(RE_BODY_CLOSE,       `<?php wp_footer(); ?>\n</body>`);
    return content;
}

async function convertToWp(filePaths) {
    const tempDir = path.join(os.tmpdir(), "wp-convert-" + Date.now());
    await fs.promises.mkdir(tempDir, { recursive: true });

    const results = [];
    let index = 0;

    async function worker() {
        while (index < filePaths.length) {
            const i = index++;
            const filePath = filePaths[i];
            try {
                const content = await fs.promises.readFile(filePath, "utf-8");
                const converted = applyReplacements(content);
                const baseName = path.basename(filePath);
                const fileName = baseName === "index.php" ? "front-page.php" : baseName;
                const outPath = path.join(tempDir, fileName);
                await fs.promises.writeFile(outPath, converted, "utf-8");
                results.push({ src: filePath, out: outPath, name: fileName });
            } catch (err) {
                console.error(`Error procesando ${filePath}:`, err);
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, filePaths.length) }, worker));
    return { files: results, tempDir };
}

module.exports = { convertToWp };
