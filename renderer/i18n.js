const translations = {
    en: {
        "tab.webp":        "Convert to WebP",
        "tab.minify":      "Minify Files",
        "tab.wp":          "Convert to WP",
        "tab.beautify":    "Beautify Files",
        "tab.svg":         "Optimize SVG",
        "tab.svgFill":     "SVG Colors",

        "common.selectFiles":  "Select files",
        "common.selectFolder": "Select folder",
        "common.downloadBtn":  "Download files",

        "update.check":       "Check for updates",
        "update.checking":    "Checking for updates…",
        "update.upToDate":    "You have the latest version.",
        "update.available":   "New version {v} available.",
        "update.downloadBtn": "Download update",
        "update.downloading": "Downloading… {p}%",
        "update.ready":       "Version {v} downloaded.",
        "update.installBtn":  "Restart & install",
        "update.error":       "Update error: ",
        "update.devMode":     "Updates only work in the installed app.",

        "error.folderExists": "The folder \"{name}\" already exists in the destination.",

        "tab.error":                "Submit an error",
        "error.fabBtn":             "Report an error",
        "error.title":              "Submit an error",
        "error.desc":               "Describe the problem you found. Your report is sent to the developer so it can be fixed.",
        "error.reporterLabel":      "Your name (optional)",
        "error.reporterPlaceholder":"e.g. Marcos",
        "error.messageLabel":       "Describe the error",
        "error.messagePlaceholder": "What happened? What were you doing when it failed?",
        "error.autoHint":           "The app version, your OS and the date are attached automatically.",
        "error.submitBtn":          "Send report",
        "error.empty":              "Please describe the error before sending.",
        "error.sending":            "Sending…",
        "error.sent":               "Thank you! Your report was sent.",
        "error.failSaved":          "Could not send it now; it was saved locally and the developer can retrieve it.",
        "error.fail":               "Could not send the report. Please try again.",

        "tab.cf7":           "Form → CF7",
        "cf7.title":         "Static form → Contact Form 7",
        "cf7.step1":         "Paste the form",
        "cf7.step2":         "Confirm fields",
        "cf7.step3":         "Dynamic fields (DTX)",
        "cf7.result":        "Result",
        "cf7.plugin":        "Plugin",
        "cf7.soon":          "(soon)",
        "cf7.formName":      "Form name",
        "cf7.confirmName":   "Confirm form name",
        "cf7.confirmUrl":    "Confirm page URL",
        "cf7.completeUrl":   "Complete page URL",
        "cf7.pasteHtml":     "Static form HTML",
        "cf7.analyze":       "Analyze",
        "cf7.next":          "Next",
        "cf7.back":          "Back",
        "cf7.generate":      "Generate CF7",
        "cf7.restart":       "Start over",
        "cf7.copy":          "Copy",
        "cf7.copied":        "Copied!",
        "cf7.step2Hint":     "Review and adjust the detected fields (type, required, name).",
        "cf7.useDtx":        "Use DTX (Dynamic Text Extension)",
        "cf7.mainForm":      "Main form",
        "cf7.confirmForm":   "Confirm form",
        "cf7.styles":        "Styles (confirmation page)",
        "cf7.dtxPostTitle":  "post title",
        "cf7.dtxTaxonomy":   "taxonomy",
        "cf7.dtxSlug":       "taxonomy slug",
        "cf7.errNoHtml":     "Please paste the form HTML.",
        "cf7.errNoFields":   "No fields detected (.p-form__item not found).",

        "webp.title":       "Convert images to WebP",
        "webp.resize":      "Enable resize",
        "webp.quality":     "WebP quality",
        "webp.maxWidth":    "Max width (px)",
        "webp.keepName":    "Keep original filename (no .webp extension)",
        "webp.selectBtn":   "Select folder",
        "webp.convertBtn":  "Convert to WebP",
        "webp.downloadBtn": "Download WebP",

        "minify.title":       "Minify Files",
        "minify.minifyBtn":   "Minify",
        "minify.downloadBtn": "Download Minified",

        "wp.title":      "Convert to WordPress",
        "wp.desc":       "Select a folder with .php files to convert them to WordPress theme format.",
        "wp.convertBtn": "Convert to WP",

        "beautify.title":       "Beautify Files",
        "beautify.desc":        "Select minified .js or .css files to format them.",
        "beautify.beautifyBtn": "Beautify",

        "svg.title":       "Optimize SVG",
        "svg.desc":        "Select .svg files to reduce their size. Files are replaced in place.",
        "svg.optimizeBtn": "Optimize",

        "svgFill.title":            "Change SVG colors",
        "svgFill.desc":             "Leave a field empty to keep the original value.",
        "svgFill.fill":             "Fill",
        "svgFill.stroke":           "Stroke",
        "svgFill.emptyHint":        "empty = no change",
        "svgFill.rename":           "Name",
        "svgFill.renamePlaceholder":"empty = original name",
        "svgFill.applyBtn":         "Apply color",

        "tab.svgGroup":                    "SVG",
        "tab.codeGroup":                   "Min / Beautify",
        "tab.wpGroup":                     "WordPress",
        "tab.template":                    "Create Template",
        "template.title":                  "Create Project from Template",
        "template.projectTitle":           "Page title (inserted in <title>)",
        "template.projectTitlePlaceholder":"e.g. Company – Site Name",
        "template.folderName":             "New folder name",
        "template.folderNamePlaceholder":  "e.g. my-project",
        "template.destination":            "Destination folder",
        "template.selectDest":             "Select folder",
        "template.libraries":              "Libraries",
        "template.typesquareLabel":        "Typesquare",
        "template.typesquare":             "Include Typesquare font script in header",
        "template.createBtn":              "Create Project",

        "tab.wpTheme":               "WP Theme",
        "wpTheme.title":             "Create WordPress Theme",
        "wpTheme.srcFolder":         "Source folder (static PHP project)",
        "wpTheme.selectFolder":      "Select",
        "wpTheme.themeName":         "Theme name",
        "wpTheme.themeNamePlaceholder": "e.g. Company Name",
        "wpTheme.archiveTypes":      "Post types & posts per page",
        "wpTheme.addType":           "+ Add post type",
        "wpTheme.postalLabel":       "CF7 postal code pages",
        "wpTheme.postalHint":        "Slugs separated by comma (e.g. contact, confirm)",
        "wpTheme.destFolder":        "Destination folder",
        "wpTheme.createBtn":         "Generate WP Theme",
        "wpTheme.errorNoSrc":        "Please select the source folder.",
        "wpTheme.errorNoName":       "Please enter the theme name.",
        "wpTheme.errorNoDest":       "Please select the destination folder.",
        "wpTheme.generating":        "Generating theme...",
        "wpTheme.done":              "Theme generated at: ",
        "wpTheme.typePlaceholder":   "post type (e.g. blog)",
        "wpTheme.countPlaceholder":  "posts/page",

        "template.errorNoTitle":     "Please enter the page title.",
        "template.errorNoFolder":    "Please enter the folder name.",
        "template.errorNoDest":      "Please select the destination folder.",
        "template.creating":         "Creating project...",
        "template.done":             "Project created at: ",

        "common.error":              "Error: ",
        "common.errorSelect":        "Selection error: ",
        "common.selectingDest":      "Selecting destination folder...",
        "common.downloadCancelled":  "Download cancelled.",
        "common.savedTo":            "Files saved to: ",
        "common.folderSelected":     "Folder: ",
        "common.fileSelected":       "File: ",
        "common.filesSelected":      " files selected.",
        "common.noSvgFiles":         "No .svg files found.",
        "common.noPhpFiles":         "No .php files found.",

        "webp.noImages":             "No images (.jpg, .jpeg, .png) found in selection.",
        "webp.converting":           "Converting images...",
        "webp.done":                 "Done! ",
        "webp.downloadDone":         "Download complete!",

        "minify.minifying":          "Minifying files...",
        "minify.done":               " files minified!",
        "minify.filesSelected":      " files selected.",
        "minify.savedTo":            "Files downloaded to: ",

        "svgFill.colorRequired":     "Enter at least one color (fill or stroke).",
        "svgFill.applying":          "Applying ",
        "svgFill.done":              " files processed!",

        "svg.optimizing":            "Optimizing SVGs...",
        "svg.done":                  " SVGs optimized! ",

        "beautify.noFiles":          "No .js or .css files found.",
        "beautify.beautifying":      "Formatting files...",
        "beautify.done":             " files formatted!",

        "wp.folderSelected":         "Folder: ",
        "wp.fileSelected":           "File: ",
        "wp.noPhpFiles":             "No .php files found in selection.",
        "wp.converting":             "Converting files...",
        "wp.done":                   "Done! ",
    },
    jp: {
        "tab.webp":        "WebPに変換",
        "tab.minify":      "ファイル圧縮",
        "tab.wp":          "WPに変換",
        "tab.beautify":    "ファイル整形",
        "tab.svg":         "SVG最適化",
        "tab.svgFill":     "SVGカラー",

        "common.selectFiles":  "ファイルを選択",
        "common.selectFolder": "フォルダを選択",
        "common.downloadBtn":  "ファイルをダウンロード",

        "update.check":       "アップデートを確認",
        "update.checking":    "アップデートを確認中…",
        "update.upToDate":    "最新バージョンです。",
        "update.available":   "新しいバージョン {v} が利用可能です。",
        "update.downloadBtn": "アップデートをダウンロード",
        "update.downloading": "ダウンロード中… {p}%",
        "update.ready":       "バージョン {v} をダウンロードしました。",
        "update.installBtn":  "再起動してインストール",
        "update.error":       "アップデートエラー: ",
        "update.devMode":     "アップデートはインストール済みアプリでのみ動作します。",

        "error.folderExists": "フォルダ「{name}」は保存先に既に存在します。",

        "tab.error":                "エラー報告",
        "error.fabBtn":             "エラー報告",
        "error.title":              "エラー報告",
        "error.desc":               "発見した不具合を記入してください。開発者に送信され、修正に役立てられます。",
        "error.reporterLabel":      "お名前（任意）",
        "error.reporterPlaceholder":"例：Marcos",
        "error.messageLabel":       "エラーの内容",
        "error.messagePlaceholder": "何が起きましたか？ どの操作中に発生しましたか？",
        "error.autoHint":           "アプリのバージョン・OS・日時は自動的に添付されます。",
        "error.submitBtn":          "報告を送信",
        "error.empty":              "送信する前にエラー内容を記入してください。",
        "error.sending":            "送信中…",
        "error.sent":               "ありがとうございます！報告を送信しました。",
        "error.failSaved":          "今は送信できませんでした。ローカルに保存され、開発者が取得できます。",
        "error.fail":               "報告を送信できませんでした。もう一度お試しください。",

        "tab.cf7":           "フォーム → CF7",
        "cf7.title":         "静的フォーム → Contact Form 7",
        "cf7.step1":         "フォームを貼り付け",
        "cf7.step2":         "フィールドの確認",
        "cf7.step3":         "動的フィールド（DTX）",
        "cf7.result":        "結果",
        "cf7.plugin":        "プラグイン",
        "cf7.soon":          "（近日対応）",
        "cf7.formName":      "フォーム名",
        "cf7.confirmName":   "確認フォーム名",
        "cf7.confirmUrl":    "確認ページのURL",
        "cf7.completeUrl":   "完了ページのURL",
        "cf7.pasteHtml":     "静的フォームのHTML",
        "cf7.analyze":       "解析",
        "cf7.next":          "次へ",
        "cf7.back":          "戻る",
        "cf7.generate":      "CF7を生成",
        "cf7.restart":       "最初からやり直す",
        "cf7.copy":          "コピー",
        "cf7.copied":        "コピーしました！",
        "cf7.step2Hint":     "検出されたフィールド（種類・必須・名前）を確認・調整してください。",
        "cf7.useDtx":        "DTX（Dynamic Text Extension）を使用する",
        "cf7.mainForm":      "メインフォーム",
        "cf7.confirmForm":   "確認フォーム",
        "cf7.styles":        "スタイル（確認ページ）",
        "cf7.dtxPostTitle":  "投稿タイトル",
        "cf7.dtxTaxonomy":   "タクソノミー",
        "cf7.dtxSlug":       "タクソノミーのスラッグ",
        "cf7.errNoHtml":     "フォームのHTMLを貼り付けてください。",
        "cf7.errNoFields":   "フィールドが検出されませんでした（.p-form__item が見つかりません）。",

        "webp.title":       "画像をWebPに変換",
        "webp.resize":      "リサイズを有効にする",
        "webp.quality":     "WebP品質",
        "webp.maxWidth":    "最大幅 (px)",
        "webp.keepName":    "元のファイル名を保持（.webp拡張子なし）",
        "webp.selectBtn":   "フォルダを選択",
        "webp.convertBtn":  "WebPに変換",
        "webp.downloadBtn": "WebPをダウンロード",

        "minify.title":       "ファイル圧縮",
        "minify.minifyBtn":   "圧縮する",
        "minify.downloadBtn": "圧縮済みをダウンロード",

        "wp.title":      "WordPressに変換",
        "wp.desc":       ".phpファイルのフォルダを選択してWordPressテーマ形式に変換します。",
        "wp.convertBtn": "WPに変換",

        "beautify.title":       "ファイル整形",
        "beautify.desc":        "圧縮済みの.jsまたは.cssファイルを選択して整形します。",
        "beautify.beautifyBtn": "整形する",

        "svg.title":       "SVG最適化",
        "svg.desc":        ".svgファイルを選択してサイズを削減します。ファイルは元の場所に上書きされます。",
        "svg.optimizeBtn": "最適化",

        "svgFill.title":            "SVGカラー変更",
        "svgFill.desc":             "空欄のままにすると元の値が保持されます。",
        "svgFill.fill":             "塗り",
        "svgFill.stroke":           "線",
        "svgFill.emptyHint":        "空欄 = 変更なし",
        "svgFill.rename":           "ファイル名",
        "svgFill.renamePlaceholder":"空欄 = 元のファイル名",
        "svgFill.applyBtn":         "色を適用",

        "tab.svgGroup":                    "SVG",
        "tab.codeGroup":                   "圧縮 / 整形",
        "tab.wpGroup":                     "WordPress",
        "tab.template":                    "テンプレート作成",
        "template.title":                  "テンプレートからプロジェクト作成",
        "template.projectTitle":           "ページタイトル（<title>に入ります）",
        "template.projectTitlePlaceholder":"例：会社名 – サイト名",
        "template.folderName":             "新しいフォルダ名",
        "template.folderNamePlaceholder":  "例：my-project",
        "template.destination":            "保存先フォルダ",
        "template.selectDest":             "フォルダを選択",
        "template.libraries":              "ライブラリ",
        "template.typesquareLabel":        "Typesquare",
        "template.typesquare":             "Typesquareフォントスクリプトをヘッダーに含める",
        "template.createBtn":              "プロジェクトを作成",

        "tab.wpTheme":               "WPテーマ作成",
        "wpTheme.title":             "WordPressテーマを作成",
        "wpTheme.srcFolder":         "ソースフォルダ（静的PHPプロジェクト）",
        "wpTheme.selectFolder":      "選択",
        "wpTheme.themeName":         "テーマ名",
        "wpTheme.themeNamePlaceholder": "例：株式会社○○",
        "wpTheme.archiveTypes":      "投稿タイプと表示件数",
        "wpTheme.addType":           "+ 投稿タイプを追加",
        "wpTheme.postalLabel":       "CF7郵便番号ページ",
        "wpTheme.postalHint":        "スラッグをカンマ区切りで入力（例：contact, confirm）",
        "wpTheme.destFolder":        "保存先フォルダ",
        "wpTheme.createBtn":         "WPテーマを生成",
        "wpTheme.errorNoSrc":        "ソースフォルダを選択してください。",
        "wpTheme.errorNoName":       "テーマ名を入力してください。",
        "wpTheme.errorNoDest":       "保存先フォルダを選択してください。",
        "wpTheme.generating":        "テーマを生成中...",
        "wpTheme.done":              "テーマを作成しました: ",
        "wpTheme.typePlaceholder":   "投稿タイプ（例：blog）",
        "wpTheme.countPlaceholder":  "件数/ページ",

        "template.errorNoTitle":     "ページタイトルを入力してください。",
        "template.errorNoFolder":    "フォルダ名を入力してください。",
        "template.errorNoDest":      "保存先フォルダを選択してください。",
        "template.creating":         "プロジェクトを作成中...",
        "template.done":             "プロジェクトを作成しました: ",

        "common.error":              "エラー: ",
        "common.errorSelect":        "選択エラー: ",
        "common.selectingDest":      "保存先フォルダを選択中...",
        "common.downloadCancelled":  "ダウンロードをキャンセルしました。",
        "common.savedTo":            "保存先: ",
        "common.folderSelected":     "フォルダ: ",
        "common.fileSelected":       "ファイル: ",
        "common.filesSelected":      " 個のファイルが選択されました。",
        "common.noSvgFiles":         ".svgファイルが見つかりません。",
        "common.noPhpFiles":         ".phpファイルが見つかりません。",

        "webp.noImages":             "画像が見つかりません（.jpg, .jpeg, .png）。",
        "webp.converting":           "画像を変換中...",
        "webp.done":                 "完了！",
        "webp.downloadDone":         "ダウンロード完了！",

        "minify.minifying":          "ファイルを圧縮中...",
        "minify.done":               " 個のファイルを圧縮しました！",
        "minify.filesSelected":      " 個のファイルが選択されました。",
        "minify.savedTo":            "ダウンロード先: ",

        "svgFill.colorRequired":     "塗り（fill）または線（stroke）を入力してください。",
        "svgFill.applying":          "適用中: ",
        "svgFill.done":              " 個のファイルを処理しました！",

        "svg.optimizing":            "SVGを最適化中...",
        "svg.done":                  " 個のSVGを最適化しました！ ",

        "beautify.noFiles":          ".jsまたは.cssファイルが見つかりません。",
        "beautify.beautifying":      "ファイルを整形中...",
        "beautify.done":             " 個のファイルを整形しました！",

        "wp.folderSelected":         "フォルダ: ",
        "wp.fileSelected":           "ファイル: ",
        "wp.noPhpFiles":             ".phpファイルが見つかりません。",
        "wp.converting":             "ファイルを変換中...",
        "wp.done":                   "完了！",
    }
};

let currentLang = "jp";

function applyLanguage(lang) {
    currentLang = lang;

    // Actualizar botones de idioma
    document.querySelectorAll(".langBtn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // Traducir texto de elementos
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        const text = translations[lang][key];
        if (text) el.textContent = text;
    });

    // Traducir placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const text = translations[lang][key];
        if (text) el.placeholder = text;
    });
}

function t(key) {
    return translations[currentLang][key] || key;
}

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".langBtn").forEach(btn => {
        btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
    });
    applyLanguage("jp");
});
