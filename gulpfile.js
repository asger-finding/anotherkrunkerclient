const { src, dest, series, parallel } = require('gulp');
const yargs        = require('yargs');
const del          = require('del');
const gulpif       = require('gulp-if');
const ts           = require('gulp-typescript');
const swc          = require('gulp-swc');
const postCSS      = require('gulp-postcss');
const sass         = require('gulp-sass')(require('sass'));
const cssnano      = require('cssnano');
const squoosh      = require('gulp-libsquoosh');
const htmlmin      = require('gulp-htmlmin');

const origin = './src';
const paths = {
    files: {
        typescript: `${ origin }/**/*.ts`,
        css :       `${ origin }/**/*.@(css|scss)`,
        html:       `${ origin }/**/*.html`,
        images:     `${ origin }/**/*.@(png|jpg|jpeg|gif|svg|ico)`
    },
    build: './build'
}
const state = {
    DEV:        'development',
    PRODUCTION: 'production',
	DEFAULT:    'default',
    get current() {
        return yargs.argv.state || this[this.DEFAULT];
    },
    get prod() {
		return this.current === this.PRODUCTION;
    }
}
const swcOptions = {
    minify: true,
    jsc: {
        target: 'es2022',
        minify: {
            mangle: true
        }
    }
}

function typescript() {
    return src(paths.files.typescript)
        .pipe(ts.createProject('./tsconfig.json')())
        .pipe(gulpif(state.prod, swc(swcOptions)))
        .pipe(dest(paths.build));
}

function css() {
    const plugins = [
        ... state.prod ? [
            cssnano()
        ] : []
    ]
    return src(paths.files.css)
        .pipe(sass())
        .pipe(postCSS(plugins))
        .pipe(dest(paths.build));
}

function html() {
    return src(paths.files.html)
        .pipe(gulpif(state.prod, htmlmin({ collapseWhitespace: true })))
		.pipe(dest(paths.build));
}

function images() {
    return src(paths.files.images)
        .pipe(gulpif(state.prod, squoosh()))
		.pipe(dest(paths.build));
}

function clean() {
    // Before building, clean up the the target folder for all previous files.
    if (state.prod) return annihilation();
    else return del([ './build' ], { force: true });
}

function annihilation() {
    // Nuke the build and distribution folders. Leave no trace.
    return del([ './build', './dist' ], { force: true });
}

exports.clean = clean;
exports.annihilation = annihilation;
exports.build = series(clean, parallel(typescript, css, html, images));
exports.default = exports.build
