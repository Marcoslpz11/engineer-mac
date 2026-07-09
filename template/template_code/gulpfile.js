const gulp = require("gulp"); //gulp本体
const path = require("path");
const projectFolder = path.basename(process.cwd());

//scss
const sass = require("gulp-dart-sass"); //Dart Sass はSass公式が推奨 @use構文などが使える
const babel = require("gulp-babel");
const uglify = require("gulp-uglify-es").default;
const rename = require("gulp-rename");
const browserSync = require("browser-sync").create();
sass.compiler = require("sass");

// Browser-Sync: proxy MAMP server
gulp.task("serve", function () {
  browserSync.init({
    proxy: `http://localhost:8888/${projectFolder}/`,
    notify: false,
  });
  // PHP changes → full reload
  gulp.watch(["**/*.php"]).on("change", browserSync.reload);
});

// style.scssをタスクを作成する
gulp.task("sass", function () {
  // style.scssファイルを取得
  return gulp.watch(
    ["_assets/scss/*.scss", "_assets/scss/**/*.scss"],
    function () {
      return (
        gulp
          .src(["_assets/scss/*.scss", "_assets/scss/**/*.scss"])
          // Sassのコンパイルを実行
          .pipe(
            sass({
              outputStyle: "compressed",
            })
              // Sassのコンパイルエラーを表示
              .on("error", sass.logError)
          )
          .pipe(
            rename({
              extname: ".min.css",
            })
          )
          // cssフォルダー以下に保存
          .pipe(gulp.dest("assets/css"))
          // CSS injection (no full reload)
          .pipe(browserSync.stream())
      );
    }
  );
});
gulp.task("js-minify", function () {
  return gulp.watch(
    ["_assets/js/scripts.js", "_assets/js/**/*.js"],
    function () {
      return gulp
        .src(["_assets/js/scripts.js", "_assets/js/**/*.js"])
        .pipe(
          babel({
            presets: ["@babel/preset-env"],
            sourceType: "script",
          })
        )
        .pipe(uglify())
        .pipe(
          rename({
            extname: ".min.js",
          })
        )
        .pipe(gulp.dest("assets/js"))
        .on("end", browserSync.reload);
    }
  );
});

gulp.task("default", gulp.parallel("serve", "sass", "js-minify"));
