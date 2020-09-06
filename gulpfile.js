const { src, dest, watch, series, parallel } = require('gulp');
const loadPlugins = require('gulp-load-plugins');
const $ = loadPlugins();

//変換後の画像ファイルサイズを配列で設定し、package.jsonに記述
const pkg = require('./package.json');
const conf = pkg["gulp-config"];
const sizes = conf.sizes;

//ベンダープレフィックス
const autoprefixer = require('autoprefixer');

//動作確認用サーバー
const browserSync = require('browser-sync');
const server = browserSync.create();

function icon(done) {
  for (let size of sizes) {
    let width = size[0];
    let height = size[1];
    src('./favicon.png')
      .pipe($.imageResize({
        width, //プロパティと値の変数名が同じなので省略記法
        height,
        crop: true,
        upscale: false
      }))
      .pipe($.imagemin())
      .pipe($.rename(`favicon-${width}x${height}.png`))
      .pipe(dest('./dist/images/icon'));
  }
  done();
}

function compile() {
  return src('./src/*.pug')
    .pipe($.pug({ pretty: true }))
    .pipe(dest('./dist'));
}

function styles() {
  return src('./src/sass/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass())
    .pipe($.postcss([
      autoprefixer()
    ]))
    .pipe($.csscomb('zen.json'))
    .pipe($.sourcemaps.write('.'))
    .pipe(dest('./dist/css'));
}

function scripts() {
  return src('./src/ts/*.ts')
    .pipe($.sourcemaps.init())
    .pipe($.typescript())
    .pipe($.sourcemaps.write('.'))
    .pipe(dest('./dist/js'));
}

// function lint() {
//   return src('./src/ts/*.ts')
//     .pipe($.eslint({ fix: true }))
//     .pipe($.eslint.format())
//     .pipe($.eslint.failAfterError())
//     .pipe(dest('./src/ts'))
// }

function startAppServer() {
  server.init({
    server: {
      baseDir: './dist'
    }
  });
  watch('./src/**/*.pug', compile);
  watch('./src/**/*.pug').on('change', server.reload);
  watch('./src/**/*.scss', styles);
  watch('./src/**/*.scss').on('change', server.reload);
  // watch('./src/**/*.ts', lint);
  watch('./src/**/*.ts', scripts);
  watch('./src/**/*.ts').on('change', server.reload);
}


// const serve = series(parallel(compile, styles, series(lint, scripts)), startAppServer);
const serve = series(parallel(compile, styles, scripts), startAppServer);
exports.compile = compile;
exports.styles = styles;
exports.scripts = scripts;
// exports.lint = lint;
exports.serve = serve;