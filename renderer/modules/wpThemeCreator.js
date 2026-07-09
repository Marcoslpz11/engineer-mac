const fs   = require('fs');
const path = require('path');
const os   = require('os');

// Reutilizamos las mismas transformaciones del wpConvert existente
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

function applyReplacements(content) {
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

// Detecta qué archivos existen en el proyecto fuente
async function scanProject(srcDir) {
    const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
    const phpFiles = entries
        .filter(e => e.isFile() && e.name.endsWith('.php'))
        .map(e => e.name);

    const pages    = [];  // { slug }
    const archives = [];  // { type }
    const singles  = [];  // { type }
    let hasFrontPage = false;

    for (const file of phpFiles) {
        if (file === 'index.php')            { hasFrontPage = true; continue; }
        if (file === 'header.php')           continue;
        if (file === 'footer.php')           continue;
        if (file === 'functions.php')        continue;

        const pageMatch    = file.match(/^page-(.+)\.php$/);
        const archiveMatch = file.match(/^archive-(.+)\.php$/);
        const singleMatch  = file.match(/^single-(.+)\.php$/);

        if (pageMatch)    pages.push({ slug: pageMatch[1] });
        else if (archiveMatch) archives.push({ type: archiveMatch[1] });
        else if (singleMatch)  singles.push({ type: singleMatch[1] });
    }

    return { hasFrontPage, pages, archives, singles };
}

// Comprueba si un archivo existe
async function fileExists(filePath) {
    try { await fs.promises.access(filePath); return true; }
    catch { return false; }
}

// Genera el bloque PHP condicional de CSS/JS para el header
async function generateHeaderLinks(srcDir, scan) {
    const uri  = `<?php echo get_template_directory_uri(); ?>`;
    const date = `<?php echo date('YmdHis') ?>`;
    const slug = `<?php echo $slug; ?>`;
    const lines = [];

    // Front page
    if (scan.hasFrontPage) {
        const jsIndex = await fileExists(path.join(srcDir, 'assets', 'js', 'pages', 'top', 'index.min.js'));
        lines.push(`  <?php if (is_front_page()) { ?>`);
        lines.push(`    <link rel="stylesheet" href="${uri}/assets/css/pages/top/index.min.css?${date}">`);
        if (jsIndex) lines.push(`    <script src="${uri}/assets/js/pages/top/index.min.js" defer></script>`);
    } else {
        lines.push(`  <?php if (false) { ?>`);
    }

    // Páginas estáticas — bloque dinámico único
    if (scan.pages.length > 0) {
        lines.push(`  <?php } elseif (is_page()) { ?>`);
        lines.push(`    <?php $slug = get_post_field('post_name'); ?>`);
        lines.push(`    <?php if (file_exists(get_template_directory() . '/assets/css/pages/' . $slug . '/index.min.css')) { ?>`);
        lines.push(`      <link rel="stylesheet" href="${uri}/assets/css/pages/${slug}/index.min.css?${date}">`);
        lines.push(`    <?php } ?>`);
        lines.push(`    <?php if (file_exists(get_template_directory() . '/assets/js/pages/' . $slug . '/index.min.js')) { ?>`);
        lines.push(`      <script src="${uri}/assets/js/pages/${slug}/index.min.js" defer></script>`);
        lines.push(`    <?php } ?>`);
    }

    // Custom post types: archives y singles (agrupados por tipo)
    const allTypes = [...new Set([
        ...scan.archives.map(a => a.type),
        ...scan.singles.map(s => s.type)
    ])];

    for (const type of allTypes) {
        const hasArchive = scan.archives.some(a => a.type === type);
        const hasSingle  = scan.singles.some(s => s.type === type);
        const jsDir      = path.join(srcDir, 'assets', 'js', 'pages', type);

        const jsIndex   = await fileExists(path.join(jsDir, 'index.min.js'));
        const jsArchive = !jsIndex && await fileExists(path.join(jsDir, 'archive.min.js'));
        const jsSingle  = !jsIndex && await fileExists(path.join(jsDir, 'single.min.js'));

        if (hasArchive && hasSingle) {
            lines.push(`  <?php } elseif (is_post_type_archive('${type}')) { ?>`);
            lines.push(`    <link rel="stylesheet" href="${uri}/assets/css/pages/${type}/archive.min.css?${date}">`);
            if (jsIndex)   lines.push(`    <script src="${uri}/assets/js/pages/${type}/index.min.js" defer></script>`);
            if (jsArchive) lines.push(`    <script src="${uri}/assets/js/pages/${type}/archive.min.js" defer></script>`);
            lines.push(`  <?php } elseif (is_singular('${type}')) { ?>`);
            lines.push(`    <link rel="stylesheet" href="${uri}/assets/css/pages/${type}/single.min.css?${date}">`);
            if (jsIndex)  lines.push(`    <script src="${uri}/assets/js/pages/${type}/index.min.js" defer></script>`);
            if (jsSingle) lines.push(`    <script src="${uri}/assets/js/pages/${type}/single.min.js" defer></script>`);
        } else if (hasArchive) {
            lines.push(`  <?php } elseif (is_post_type_archive('${type}')) { ?>`);
            lines.push(`    <link rel="stylesheet" href="${uri}/assets/css/pages/${type}/archive.min.css?${date}">`);
            if (jsIndex)   lines.push(`    <script src="${uri}/assets/js/pages/${type}/index.min.js" defer></script>`);
            if (jsArchive) lines.push(`    <script src="${uri}/assets/js/pages/${type}/archive.min.js" defer></script>`);
        } else if (hasSingle) {
            lines.push(`  <?php } elseif (is_singular('${type}')) { ?>`);
            lines.push(`    <link rel="stylesheet" href="${uri}/assets/css/pages/${type}/single.min.css?${date}">`);
            if (jsIndex)  lines.push(`    <script src="${uri}/assets/js/pages/${type}/index.min.js" defer></script>`);
            if (jsSingle) lines.push(`    <script src="${uri}/assets/js/pages/${type}/single.min.js" defer></script>`);
        }
    }

    lines.push(`  <?php } ?>`);

    return lines.join('\n');
}

// Genera functions.php a partir del template base
function generateFunctions(archiveTypes, postalPages) {
    // Bloque posts_order dinámico
    const postTypeBlocks = archiveTypes.map(({ type, count }) =>
        `if ( $query->is_post_type_archive('${type}')) {\n        $query->set('posts_per_page', '${count}');\n    return;\n    }`
    ).join('\nif ( $query->is_post_type_archive');

    const postsOrder = archiveTypes.length > 0
        ? `/* 投稿の表示件数・表示順等 */\nfunction posts_order($query) {\nif ( is_admin() || ! $query->is_main_query() ){\n    return;\n}\n    ${postTypeBlocks}\n}\nadd_action( 'pre_get_posts', 'posts_order' );`
        : '';

    // Bloque postal code CF7
    const postalSlugs = postalPages
        .map(s => s.trim())
        .filter(Boolean);

    const postalBlock = postalSlugs.length > 0
        ? `\n// 郵便番号検索スクリプト\nfunction enqueue_postal_code_script() {\n    if ( is_singular() && in_array( get_post_field('post_name'), array( ${postalSlugs.map(s => `'${s}'`).join(', ')} ) ) ) {\n        wp_enqueue_script( 'ajaxzip3', 'https://ajaxzip3.github.io/ajaxzip3.js', array('jquery'), null, true );\n    }\n}\nadd_action( 'wp_enqueue_scripts', 'enqueue_postal_code_script' );`
        : '';

    return `<?php

add_theme_support( 'post-thumbnails' );
add_theme_support( 'title-tag' );

remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles', 10 );

add_editor_style('editor-style.css');

mb_internal_encoding("UTF-8");
mb_regex_encoding("UTF-8");
/* アイキャッチ登録 */
function acf_set_featured_image( $value, $post_id, $field ){
\t$type = get_post_type($post->ID);
 if($value != ''){
 add_post_meta($post_id, '_thumbnail_id', $value);
 }
 return $value;
}
add_filter('acf/update_value/name=thumb', 'acf_set_featured_image', 10, 3);

/* カウント登録 */
function my_acf_update_value( $value, $post_id, $field ) {
    if(get_post_type( $post_id ) == 'topic' && have_rows('set')) { $count=0; while (have_rows('set')) : the_row();
        if (get_sub_field('title')) { $count++; }
    endwhile; }
    $value = $count;
    return $value;
}
add_filter('acf/update_value/name=count', 'my_acf_update_value', 10, 3);


/* bodyclass */
add_filter('body_class','add_posttype_classes');
function add_posttype_classes($classes) {
    $postype = get_query_var('post_type');
    $classes[] = $postype;
    if(!$postype ==""){
        $m_key = array_search('home', $classes);
        unset($classes[${'m_key'}]);
    }
    return $classes;
}

/* 並び替え */
function add_meta_query_vars( $public_query_vars ) {
    $public_query_vars[] = 'meta_key';
    $public_query_vars[] = 'meta_value';
    return $public_query_vars;
}
add_filter( 'query_vars', 'add_meta_query_vars' );

//NO-indexを追加

// メタボックスの追加
add_action( 'admin_menu', 'add_noindex_metabox' );
function add_noindex_metabox() {
    add_meta_box( 'custom_noindex', 'インデックス設定', 'create_noindex', array('post', 'page'), 'side' );
}

// 管理画面にフィールドを出力
function create_noindex() {
    $keyname = 'noindex';
    global $post;
    $get_value = get_post_meta( $post->ID, $keyname, true );
    wp_nonce_field( 'action_' . $keyname, 'nonce_' . $keyname );
    $value = 'noindex';
    $checked = '';
    if( $value === $get_value ) $checked = ' checked';
    echo '<label><input type="checkbox" name="' . $keyname . '" value="' . $value . '"' . $checked . '>' . $keyname . '</label>';
}


// カスタムフィールドの保存
add_action( 'save_post', 'save_custom_noindex' );
function save_custom_noindex( $post_id ) {
    $keyname = 'noindex';
    if ( isset( $_POST['nonce_' . $keyname] )) {
        if( check_admin_referer( 'action_' . $keyname, 'nonce_' . $keyname ) ) {
            if( isset( $_POST[$keyname] )) {
                update_post_meta( $post_id, $keyname, $_POST[$keyname] );
            } else {
                delete_post_meta( $post_id, $keyname, get_post_meta( $post_id, $keyname, true ) );
            }
        }
    }
}
${postsOrder ? '\n' + postsOrder : ''}
/* paginate */
function custom_pagination() {
  global $wp_query;
  $bignum = 999999999;
  if ( $wp_query->max_num_pages <= 1 )
    return;
  echo paginate_links( array(
    'base'         => str_replace( $bignum, '%#%', esc_url( get_pagenum_link($bignum) ) ),
    'format'       => '',
    'current'      => max( 1, get_query_var('paged') ),
    'total'        => $wp_query->max_num_pages,
    'prev_text'    => '',
    'next_text'    => '',
    'type'         => 'list',
    'end_size'     => 1,
    'mid_size'     => 1
  ) );
}


/* リダイレクト */
function redirect404() {
    global $wp_query;
    if ( is_404() || is_attachment() || is_author() ) {
              wp_redirect( home_url(), 301 );
              exit;
    }
}
add_action( 'wp', 'redirect404' );


/* レスポンシブイメージ無効 */
add_filter( 'wp_calculate_image_srcset_meta', '__return_null' );


// 管理バーからコメントとカスタマイズを削除
function remove_toolbar_node($wp_admin_bar) {
\t$wp_admin_bar->remove_node('comments');
\t$wp_admin_bar->remove_node('customize');
}
add_action('admin_bar_menu', 'remove_toolbar_node', 999);


/* スマホ判定 */
function is_mobile() {
    $useragents = array(
        'iPhone',
        'iPod',
        '^(?=.*Android)(?=.*Mobile)',
        'dream',
        'CUPCAKE',
        'blackberry9500',
        'blackberry9530',
        'blackberry9520',
        'blackberry9550',
        'blackberry9800',
        'webOS',
        'incognito',
        'webmate'
    );
    $pattern = '/'.implode('|', $useragents).'/i';
    return preg_match($pattern, $_SERVER['HTTP_USER_AGENT']);
}

//SVGアップロード許可
function SVG_mime_types($mimes) {
  $mimes['svg'] = 'image/svg+xml';
  return $mimes;
}
add_filter('upload_mimes', 'SVG_mime_types');

//アイキャッチ欄サムネイル表示
function fix_svg_thumb_display() {
  echo '<style>
  td.media-icon img[src$=".svg"], img[src$=".svg"].attachment-post-thumbnail, #set-post-thumbnail img[src$=".svg"]{
  width: 100% !important;
  height: auto !important;
  }</style>';
}
add_action('admin_head', 'fix_svg_thumb_display');

/* REST API ユーザー情報をブロック */
function my_filter_rest_endpoints( $endpoints ) {
    if ( isset( $endpoints['/wp/v2/users'] ) ) {
        unset( $endpoints['/wp/v2/users'] );
    }
    if ( isset( $endpoints['/wp/v2/users/(?P[\\d]+)'] ) ) {
        unset( $endpoints['/wp/v2/users/(?P[\\d]+)'] );
    }
    return $endpoints;
}
add_filter( 'rest_endpoints', 'my_filter_rest_endpoints', 10, 1 );

// Contact Form 7の自動pタグ無効
add_filter('wpcf7_autop_or_not', 'wpcf7_autop_return_false');
function wpcf7_autop_return_false() {
  return false;
}
${postalBlock}

//erase margin-top when logged in
add_action('get_header', function() {
\tremove_action('wp_head', '_admin_bar_bump_cb');
  });

  add_action('wp_footer', function(){
\tif (is_user_logged_in()) {
\t  echo '<style>
\t\t#wpadminbar { top: auto !important; bottom: 0 !important; }
\t  </style>';
\t}
  }, 999);



add_action('wp_footer', 'mycustom_wp_footer');
function mycustom_wp_footer()
{
?>

<?php
}

// ?>
`;
}

// Genera style.css con el nombre del tema
function generateStyleCss(themeName) {
    return `@charset "UTF-8";

/*
Theme Name: ${themeName}
Theme URI:
Author:
*/

/* paginate */
`;
}

// Convierte el header.php estático al formato WP
async function convertHeader(srcDir, headerContent, scan) {
    // Elimina el bloque PHP estático de detección de página
    // ^ con flag m asegura que solo matchea <?php al inicio de línea,
    // evitando capturar <?php inline (ej: style.min.css?<?php echo date(...) ?>)
    const staticBlockRe = /^[ \t]*<\?php[\s\S]*?\$self_name\s*=[\s\S]*?\?>\s*\n?/m;
    let converted = headerContent.replace(staticBlockRe, '');

    // Aplica transformaciones WP estándar
    converted = applyReplacements(converted);

    // Genera e inserta el bloque condicional WP antes de <?php wp_head(); ?>
    const headerLinks = await generateHeaderLinks(srcDir, scan);
    converted = converted.replace(
        /(<\?php wp_head\(\); \?>)/,
        `${headerLinks}\n  $1`
    );

    return converted;
}

// Función principal
async function createWpTheme({ srcDir, destDir, themeName, archiveTypes, postalPages }) {
    const projectPath = path.join(destDir, themeName.replace(/[^\w぀-鿿一-鿿＀-￯\s-]/g, '').trim());

    try {
        await fs.promises.access(projectPath);
        return { error: `La carpeta "${themeName}" ya existe en el destino.` };
    } catch {}

    await fs.promises.mkdir(projectPath, { recursive: true });

    // Escanear proyecto fuente
    const scan = await scanProject(srcDir);

    // Leer todos los .php del proyecto fuente
    const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
    const phpFiles = entries
        .filter(e => e.isFile() && e.name.endsWith('.php'))
        .map(e => e.name);

    const results = [];

    for (const file of phpFiles) {
        const srcPath  = path.join(srcDir, file);
        let content    = await fs.promises.readFile(srcPath, 'utf-8');
        let outName    = file;

        if (file === 'functions.php') continue; // se genera nuevo
        if (file === 'index.php') outName = 'front-page.php';

        if (file === 'header.php') {
            content = await convertHeader(srcDir, content, scan);
        } else {
            content = applyReplacements(content);
        }

        const outPath = path.join(projectPath, outName);
        await fs.promises.writeFile(outPath, content, 'utf-8');
        results.push(outName);
    }

    // Generar index.php (WP loop)
    const indexContent = `<?php get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
                    <?php the_content(); ?>
<?php endwhile; ?>
<?php endif; ?>

<?php get_footer(); ?>
`;
    await fs.promises.writeFile(path.join(projectPath, 'index.php'), indexContent, 'utf-8');
    results.push('index.php');

    // Generar functions.php
    await fs.promises.writeFile(
        path.join(projectPath, 'functions.php'),
        generateFunctions(archiveTypes, postalPages),
        'utf-8'
    );
    results.push('functions.php');

    // Generar style.css
    await fs.promises.writeFile(
        path.join(projectPath, 'style.css'),
        generateStyleCss(themeName),
        'utf-8'
    );
    results.push('style.css');

    // Copiar carpetas assets y _assets si existen
    const assetsSrc = path.join(srcDir, 'assets');
    if (await fileExists(assetsSrc)) {
        await fs.promises.cp(assetsSrc, path.join(projectPath, 'assets'), { recursive: true });
        results.push('assets/');
    }

    const underAssetsSrc = path.join(srcDir, '_assets');
    if (await fileExists(underAssetsSrc)) {
        await fs.promises.cp(underAssetsSrc, path.join(projectPath, '_assets'), { recursive: true });
        results.push('_assets/');
    }

    return { success: true, path: projectPath, files: results };
}

module.exports = { createWpTheme };
