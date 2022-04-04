const { src, dest, series, parallel } = require('gulp');
const yargs        = require('yargs');
const del          = require('del');
const gulpif       = require('gulp-if');
const swc          = require('gulp-swc');
const sass         = require('gulp-sass')(require('sass'));
const squoosh      = require('gulp-libsquoosh');
const htmlmin      = require('gulp-htmlmin');

const origin = './src';
const paths = {
    files: {
        typescript: `${ origin }/**/*.ts`,
        css :       `${ origin }/**/*.@(css|sass)`,
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
    minify: state.prod,
    jsc: {
        parser: {
            syntax: 'typescript',
            tsx: false,
            decorators: true,
            dynamicImport: true
        },
        target: 'es2022',
        loose: false,
        minify: {
            mangle: state.prod,
            compress: {
                unused: true
            }
        }
    },
    module: {
        type: 'commonjs',
        strict: true,
        strictMode: true,
        lazy: false,
        noInterop: true,
        ignoreDynamic: true
    }
}

function typescript() {
    return src(paths.files.typescript)
        .pipe(swc(swcOptions))
        .pipe(dest(paths.build));
}

function css() {
    return src(paths.files.css)
        .pipe(sass({
            ...(state.prod ? { outputStyle: 'compressed' } : {})
        }))
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
    return del([ './build' ], { force: true });
}

function annihilation() {
    // Nuke the build and distribution folders. Leave no trace.
    return del([ './build', './dist' ], { force: true });
}

exports.clean = clean;
exports.annihilation = annihilation;
exports.build = series(clean, parallel(typescript, css, html, images));
exports.default = exports.build
