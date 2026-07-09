  <?php if (is_front_page()) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/top/index.min.css?<?php echo date('YmdHis') ?>">
    <script src="<?php echo get_template_directory_uri(); ?>/assets/js/pages/top/index.min.js" defer></script>
  <?php } elseif (!is_front_page() && is_page()) {
    $page = get_post(get_the_ID()); ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/<?php echo $page->post_name; ?>/index.min.css?<?php echo date('YmdHis') ?>">
  <?php } ?>
  <?php if (is_page('confirm') || is_page('complete')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/entry/single.min.css?<?php echo date('YmdHis') ?>">
  <?php } ?>
  <?php if (is_page('casual-entry-confirm') || is_page('casual-entry-complete')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/entry/single.min.css?<?php echo date('YmdHis') ?>">
  <?php } ?>
  <?php if (is_post_type_archive('column')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/column/archive.min.css?<?php echo date('YmdHis') ?>">
  <?php } elseif (is_singular('column')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/column/single.min.css?<?php echo date('YmdHis') ?>">
    <script
      src="<?php echo get_template_directory_uri(); ?>/assets/js/pages/column/single.min.js?<?php echo date('YmdHis') ?>"
      defer></script>
  <?php } ?>
  <?php if (is_post_type_archive('entry')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/entry/archive.min.css?<?php echo date('YmdHis') ?>">
  <?php } elseif (is_singular('entry')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/entry/single.min.css?<?php echo date('YmdHis') ?>">
    <script
      src="<?php echo get_template_directory_uri(); ?>/assets/js/pages/entry/single.min.js?<?php echo date('YmdHis') ?>"
      defer></script>
  <?php } ?>
  <?php if (is_post_type_archive('member')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/member/archive.min.css?<?php echo date('YmdHis') ?>">
  <?php } elseif (is_singular('member')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/member/single.min.css?<?php echo date('YmdHis') ?>">
    <script
      src="<?php echo get_template_directory_uri(); ?>/assets/js/pages/member/single.min.js?<?php echo date('YmdHis') ?>"
      defer></script>
  <?php } ?>
  <?php if (is_post_type_archive('faq')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/faq/archive.min.css?<?php echo date('YmdHis') ?>">
  <?php } elseif (is_singular('faq')) { ?>
    <link rel="stylesheet"
      href="<?php echo get_template_directory_uri(); ?>/assets/css/pages/faq/single.min.css?<?php echo date('YmdHis') ?>">
    <script
      src="<?php echo get_template_directory_uri(); ?>/assets/js/pages/faq/single.min.js?<?php echo date('YmdHis') ?>"
      defer></script>
  <?php } ?>
  <?php wp_head(); ?>

  <?php if (is_user_logged_in()) { ?>
    <style type="text/css">
      html {
        margin-top: 0 !important;
        margin-bottom: 28px;
      }

      #wpadminbar {
        top: inherit !important;
        bottom: 0 !important;
      }
    </style>
  <?php } ?>