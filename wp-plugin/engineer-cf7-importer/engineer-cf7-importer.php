<?php
/**
 * Plugin Name:       Engineer CF7 Importer
 * Description:       Engineer アプリの「Form → CF7」で書き出した JSON から、Contact Form 7 のフォーム・メール・その他の設定をまとめて作成します。
 * Version:           1.0.0
 * Author:            Platin
 * Requires Plugins:  contact-form-7
 * Requires PHP:      7.2
 * Text Domain:       engineer-cf7-importer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// La app escribe estos dos valores en el JSON; si el formato cambia, se sube la versión.
define( 'ENGINEER_CF7_FORMAT', 'engineer-cf7' );
define( 'ENGINEER_CF7_VERSION', 1 );

add_action( 'admin_menu', 'engineer_cf7_admin_menu' );

function engineer_cf7_admin_menu() {
	add_submenu_page(
		class_exists( 'WPCF7_ContactForm' ) ? 'wpcf7' : 'tools.php',
		'Engineer JSON インポート',
		'Engineer インポート',
		'manage_options',
		'engineer-cf7-importer',
		'engineer_cf7_render_page'
	);
}

function engineer_cf7_render_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$result = null;
	if ( isset( $_POST['engineer_cf7_import'] ) ) {
		check_admin_referer( 'engineer_cf7_import' );
		$result = engineer_cf7_handle_upload();
	}
	?>
	<div class="wrap">
		<h1>Engineer JSON インポート</h1>

		<?php if ( ! class_exists( 'WPCF7_ContactForm' ) ) : ?>
			<div class="notice notice-error"><p>Contact Form 7 が有効になっていません。先に有効化してください。</p></div>
		<?php else : ?>
			<?php engineer_cf7_render_result( $result ); ?>

			<form method="post" enctype="multipart/form-data">
				<?php wp_nonce_field( 'engineer_cf7_import' ); ?>
				<p>Engineer アプリの「Form → CF7」で書き出した JSON ファイルを選択してください。</p>
				<p><input type="file" name="engineer_json" accept=".json,application/json" required></p>
				<?php submit_button( 'インポート', 'primary', 'engineer_cf7_import' ); ?>
			</form>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Lee y valida el JSON subido, y crea todas las formas.
 *
 * @return array|WP_Error Lista de formas creadas, o el error.
 */
function engineer_cf7_handle_upload() {
	if ( empty( $_FILES['engineer_json']['tmp_name'] ) || UPLOAD_ERR_OK !== $_FILES['engineer_json']['error'] ) {
		return new WP_Error( 'no_file', 'ファイルがアップロードされていません。' );
	}

	$data = json_decode( file_get_contents( $_FILES['engineer_json']['tmp_name'] ), true );

	if ( ! is_array( $data ) || ENGINEER_CF7_FORMAT !== ( $data['format'] ?? '' ) ) {
		return new WP_Error( 'bad_json', 'Engineer アプリの JSON ではありません。' );
	}
	if ( ENGINEER_CF7_VERSION !== (int) ( $data['version'] ?? 0 ) ) {
		return new WP_Error(
			'bad_version',
			sprintf( '対応していない JSON のバージョンです（%s）。プラグインを最新版に更新してください。', (int) ( $data['version'] ?? 0 ) )
		);
	}
	if ( empty( $data['forms'] ) || ! is_array( $data['forms'] ) ) {
		return new WP_Error( 'no_forms', 'JSON にフォームが含まれていません。' );
	}

	// Validar todo antes de crear nada, para no dejar una instalación a medias.
	foreach ( $data['forms'] as $spec ) {
		if ( empty( $spec['title'] ) || empty( $spec['form'] ) ) {
			return new WP_Error( 'bad_form', 'JSON のフォームにタイトルまたは本文がありません。' );
		}
	}

	$created = array();
	foreach ( $data['forms'] as $spec ) {
		$item = engineer_cf7_create_form( $spec );
		if ( is_wp_error( $item ) ) {
			return $item;
		}
		$created[] = $item;
	}
	return $created;
}

/**
 * Crea una forma de CF7 a partir de un elemento de "forms" del JSON.
 * Si ya existe una con el mismo título, se crea otra nueva igualmente (y se avisa).
 */
function engineer_cf7_create_form( array $spec ) {
	$title   = sanitize_text_field( $spec['title'] );
	$existed = function_exists( 'wpcf7_get_contact_form_by_title' ) && wpcf7_get_contact_form_by_title( $title );

	$contact_form = WPCF7_ContactForm::get_template( array( 'title' => $title ) );

	$props = array(
		'form'                => (string) $spec['form'],
		'additional_settings' => (string) ( $spec['additional_settings'] ?? '' ),
	);
	// Los mails se mezclan con los valores por defecto de CF7 para no dejar claves sin definir.
	foreach ( array( 'mail', 'mail_2' ) as $key ) {
		if ( ! empty( $spec[ $key ] ) && is_array( $spec[ $key ] ) ) {
			$props[ $key ] = array_merge( (array) $contact_form->prop( $key ), $spec[ $key ] );
		}
	}

	$contact_form->set_properties( $props );
	$contact_form->save();

	$post_id = $contact_form->id();
	if ( ! $post_id ) {
		return new WP_Error( 'save_failed', sprintf( 'フォーム「%s」を保存できませんでした。', $title ) );
	}

	// El id corto del shortcode (CF7 5.8+) son los 7 primeros caracteres del hash.
	$saved    = wpcf7_contact_form( $post_id );
	$hash     = ( $saved && method_exists( $saved, 'hash' ) ) ? (string) $saved->hash() : '';
	$short_id = '' !== $hash ? substr( $hash, 0, 7 ) : (string) $post_id;

	return array(
		'role'     => (string) ( $spec['role'] ?? '' ),
		'title'    => $title,
		'post_id'  => $post_id,
		'short_id' => $short_id,
		'existed'  => (bool) $existed,
	);
}

function engineer_cf7_snippet( $short_id, $title ) {
	// Comillas fuera: romperían el shortcode o la cadena PHP.
	$safe_title = str_replace( array( '"', "'" ), '', $title );
	return "<?php echo do_shortcode(\n\t'[contact-form-7 id=\"{$short_id}\" title=\"{$safe_title}\" html_class=\"h-adr\"]'\n); ?>";
}

function engineer_cf7_render_result( $result ) {
	if ( null === $result ) {
		return;
	}
	if ( is_wp_error( $result ) ) {
		echo '<div class="notice notice-error"><p>' . esc_html( $result->get_error_message() ) . '</p></div>';
		return;
	}

	$roles = array(
		'main'    => '入力フォーム（1ステップ目）',
		'confirm' => '確認フォーム（最終ステップ）',
		'single'  => 'フォーム',
	);

	echo '<div class="notice notice-success"><p>' . esc_html( sprintf( '%d 件のフォームを作成しました。', count( $result ) ) ) . '</p></div>';

	foreach ( $result as $item ) {
		$edit_url = admin_url( 'admin.php?page=wpcf7&post=' . $item['post_id'] . '&action=edit' );
		?>
		<div class="card" style="max-width: 760px;">
			<h2 style="margin-top: 0;">
				<?php echo esc_html( $item['title'] ); ?>
				<span style="font-size: 13px; font-weight: normal; color: #646970;"><?php echo esc_html( $roles[ $item['role'] ] ?? '' ); ?></span>
			</h2>
			<?php if ( $item['existed'] ) : ?>
				<p style="color: #b32d2e;">同じ名前のフォームが既にあります。新しいフォームとして作成しました。</p>
			<?php endif; ?>
			<p><a href="<?php echo esc_url( $edit_url ); ?>">フォームを編集</a></p>
			<p>テンプレートに貼り付けるコード：</p>
			<textarea readonly rows="4" style="width: 100%; font-family: monospace;" onclick="this.select();"><?php echo esc_textarea( engineer_cf7_snippet( $item['short_id'], $item['title'] ) ); ?></textarea>
		</div>
		<?php
	}
}
