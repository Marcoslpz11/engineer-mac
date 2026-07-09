<!DOCTYPE html>
<html lang="ja">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!-- <link rel="icon" href="./assets/images/favicon.ico" /> -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XX XXサイト</title>
    <link rel="stylesheet" href="./assets/css/swiper-bundle.min.css">
  <link rel="stylesheet" href="./assets/css/splide-core.min.css">
  <link rel="stylesheet" href="./assets/css/style.min.css?<?php echo date('YmdHis') ?>">
  <script type="text/javascript" src="//typesquare.com/3/tsst/script/ja/typesquare.js?5dc2538e8b5c4014988470d9e90393a3" charset="utf-8"></script>
  <?php
	// 今いるページのファイル名
	$self_name = basename($_SERVER['PHP_SELF']);

	// プロジェクトディレクトリ内の.phpファイル一覧を取得
	$php_files = glob('./*.php');

	// php_filesのファイル名の部分を取得
	$php_files = array_map('basename', $php_files);

	// 必要なファイル名のパターンのみフィルタリング
	$pages = array_filter($php_files, function ($file) {
		return preg_match('/^(index|page-|archive-|single-).*\.php$/', $file);
	});

	if (in_array($self_name, $pages)) {
		// 'page-', 'archive-', 'single-' などの接頭辞を削除して、ディレクトリ名を生成
		$page_base = preg_replace('/^(page-|archive-|single-)/', '', basename($self_name, '.php'));
		// 'archive-' や 'single-' の接頭辞に応じたCSSファイル名を決定
		if (strpos($self_name, 'archive') !== false) {
			$css_suffix = 'archive.min.css';
		} elseif (strpos($self_name, 'single') !== false) {
			$css_suffix = 'single.min.css';
		} else {
			$css_suffix = 'index.min.css';
		}
		// ディレクトリ名を自動生成
		$directory = $self_name === 'index.php'
			? 'top'
			: (strpos($self_name, 'archive') !== false || strpos($self_name, 'single') !== false
				? $page_base
				: str_replace('-', '/', $page_base));
		// CSSファイルを出力
		echo '<link rel="stylesheet" href="./assets/css/pages/' . $directory . '/' . $css_suffix . '?' . date('YmdHis') . '">';
		// JSファイルが存在する場合のみ出力
		if (file_exists('./assets/js/pages/' . $directory . '/index.min.js')) {
			echo '<script src="./assets/js/pages/' . $directory . '/index.min.js?' . date('YmdHis') . '" defer></script>';
		}
	}
	?>
</head>

<body>
  <header class="l-header u-d-f" id="js-header">
    <a href="./" class="l-header__logo">
      <img src="./assets/images/common/logo.svg" class="u-w100" loading="eager" alt="">
    </a>
    <!-- <div class="l-header__right u-d-f u-aic">
      <a href="./archive-entry.php" class="c-buttonEntry">
        <span class="c-buttonEntry__text">ENTRY</span>
      </a>
      <button class="l-hamburgerButton" type="button" id="js-hamburgerButton">
        <span class="l-hamburgerButton__icon">
          <span class="line"></span>
          <span class="line"></span>
          <span class="line"></span>
        </span>
      </button>
    </div>
    <nav class="l-headerNav" id="js-headerNav">
      <div class="l-headerNav__inner">
        <ul class="l-headerNav__list">
          <li class="l-headerNav__item">
            <a href="./#sec01" class="l-headerNav__link">テキストテキスト</a>
          </li>
          <li class="l-headerNav__item">
            <a href="./#sec01" class="l-headerNav__link"><span class="en">テキストテキスト</span><span
                class="ja">テキストテキスト</span></a>
          </li>
        </ul>
      </div>
    </nav> -->
  </header>