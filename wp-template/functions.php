<?php

add_theme_support( 'post-thumbnails' );
add_theme_support( 'title-tag' );

remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles', 10 );

add_editor_style('editor-style.css');

mb_internal_encoding("UTF-8");
mb_regex_encoding("UTF-8");
/* アイキャッチ登録 */
function acf_set_featured_image( $value, $post_id, $field ){
	$type = get_post_type($post->ID);
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
/* 投稿の表示件数・表示順等 */
function posts_order($query) {
if ( is_admin() || ! $query->is_main_query() ){
    return;
}
if ( $query->is_post_type_archive('service')) {
        $query->set('posts_per_page', '8');
    return;
}
if ( $query->is_post_type_archive('information')) {
	$query->set('posts_per_page', '12');
return;
}
if ( $query->is_post_type_archive('blog')) {
	$query->set('posts_per_page', '9');
return;
}
}
add_action( 'pre_get_posts', 'posts_order' );

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
	$wp_admin_bar->remove_node('comments');
	$wp_admin_bar->remove_node('customize');
}
add_action('admin_bar_menu', 'remove_toolbar_node', 999);


/* スマホ判定 */
function is_mobile() {
    $useragents = array(
        'iPhone',          // iPhone
        'iPod',            // iPod touch
        '^(?=.*Android)(?=.*Mobile)', // 1.5+ Android
        'dream',           // Pre 1.5 Android
        'CUPCAKE',         // 1.5+ Android
        'blackberry9500',  // Storm
        'blackberry9530',  // Storm
        'blackberry9520',  // Storm v2
        'blackberry9550',  // Storm v2
        'blackberry9800',  // Torch
        'webOS',           // Palm Pre Experimental
        'incognito',       // Other iPhone browser
        'webmate'          // Other iPhone browser
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
    if ( isset( $endpoints['/wp/v2/users/(?P[\d]+)'] ) ) {
        unset( $endpoints['/wp/v2/users/(?P[\d]+)'] );
    }
    return $endpoints;
}
add_filter( 'rest_endpoints', 'my_filter_rest_endpoints', 10, 1 );

// Contact Form 7の自動pタグ無効
add_filter('wpcf7_autop_or_not', 'wpcf7_autop_return_false');
function wpcf7_autop_return_false() {
  return false;
}

//erase margin-top when logged in
add_action('get_header', function() {
	remove_action('wp_head', '_admin_bar_bump_cb');
  });
  
  add_action('wp_footer', function(){
	if (is_user_logged_in()) {
	  echo '<style>
		#wpadminbar { top: auto !important; bottom: 0 !important; }
	  </style>';
	}
  }, 999);
  


add_action('wp_footer', 'mycustom_wp_footer');
function mycustom_wp_footer()
{
?>

<?php
}

// ?>