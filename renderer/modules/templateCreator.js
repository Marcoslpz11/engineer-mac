const fs = require('fs');
const path = require('path');

function removeLine(content, pattern) {
    return content.split('\n').filter(line => !pattern.test(line)).join('\n');
}

async function createTemplate({ templateSrc, projectName, destDir, title, libraries, typesquare }) {
    const projectPath = path.join(destDir, projectName);

    try {
        await fs.promises.access(projectPath);
        return { errorKey: "error.folderExists", errorParams: { name: projectName } };
    } catch {}

    await fs.promises.cp(templateSrc, projectPath, { recursive: true });

    // --- header.php ---
    const headerPath = path.join(projectPath, 'header.php');
    let header = await fs.promises.readFile(headerPath, 'utf-8');

    header = header.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>\n\t<meta name="robots" content="noindex , nofollow" />`);

    if (!typesquare) header = removeLine(header, /typesquare\.com/);
    if (!libraries.swiper)  header = removeLine(header, /swiper-bundle\.min\.css/);
    if (!libraries.splide)  header = removeLine(header, /splide-core\.min\.css/);

    await fs.promises.writeFile(headerPath, header, 'utf-8');

    // --- footer.php ---
    const footerPath = path.join(projectPath, 'footer.php');
    let footer = await fs.promises.readFile(footerPath, 'utf-8');

    if (libraries.swiper) {
        footer = footer.replace(
            /(<script src="\.\/assets\/js\/lib\.js"><\/script>)/,
            `<script src="./assets/js/swiper-bundle.min.js"></script>\n$1`
        );
    }

    if (!libraries.lenis)         footer = removeLine(footer, /lenis\.min\.js/);
    if (!libraries.gsap)          footer = removeLine(footer, /gsap\.min\.js/);
    if (!libraries.scrollTrigger) footer = removeLine(footer, /ScrollTrigger\.min\.js/);
    if (!libraries.splide)        footer = removeLine(footer, /splide\.min\.js/);
    if (!libraries.three)         footer = removeLine(footer, /three\.js/);
    if (!libraries.scrollHint)    footer = removeLine(footer, /scroll-hint/);

    await fs.promises.writeFile(footerPath, footer, 'utf-8');

    // --- Eliminar archivos de librerías no usadas ---
    const toDelete = [];

    if (!libraries.swiper) {
        toDelete.push(
            path.join(projectPath, 'assets', 'css', 'swiper-bundle.min.css'),
            path.join(projectPath, 'assets', 'js', 'swiper-bundle.min.js')
        );
    }
    if (!libraries.splide) {
        toDelete.push(
            path.join(projectPath, 'assets', 'css', 'splide-core.min.css'),
            path.join(projectPath, 'assets', 'js', 'splide.min.js')
        );
    }
    if (!libraries.gsap)          toDelete.push(path.join(projectPath, 'assets', 'js', 'gsap.min.js'));
    if (!libraries.scrollTrigger) toDelete.push(path.join(projectPath, 'assets', 'js', 'ScrollTrigger.min.js'));
    if (!libraries.lenis)         toDelete.push(path.join(projectPath, 'assets', 'js', 'lenis.min.js'));
    if (!libraries.three)         toDelete.push(path.join(projectPath, 'assets', 'js', 'three.js'));

    await Promise.all(toDelete.map(f => fs.promises.rm(f, { force: true }).catch(() => {})));

    // --- Vaciar index.js y su min de top ---
    const topJsFiles = [
        path.join(projectPath, '_assets', 'js', 'pages', 'top', 'index.js'),
        path.join(projectPath, 'assets', 'js', 'pages', 'top', 'index.min.js'),
    ];
    await Promise.all(topJsFiles.map(f => fs.promises.writeFile(f, '', 'utf-8').catch(() => {})));

    // --- Eliminar subcarpetas de images excepto top y common ---
    const imagesDir = path.join(projectPath, 'assets', 'images');
    const keepFolders = new Set(['top', 'common']);
    try {
        const imageFolders = await fs.promises.readdir(imagesDir);
        await Promise.all(
            imageFolders
                .filter(name => !keepFolders.has(name))
                .map(name => fs.promises.rm(path.join(imagesDir, name), { recursive: true, force: true }))
        );
    } catch {}

    // --- Asegurar que existan assets/images/top y assets/images/common ---
    await fs.promises.mkdir(path.join(imagesDir, 'top'), { recursive: true }).catch(() => {});
    await fs.promises.mkdir(path.join(imagesDir, 'common'), { recursive: true }).catch(() => {});

    return { success: true, path: projectPath };
}

module.exports = { createTemplate };
