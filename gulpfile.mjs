// TODO: Switch to a modern alternative such as rollup or webpack.
// I am most comfortable with the gulp, but it is no longer a good choice.

import gulp from 'gulp';
import argv from 'yargs';
import del from 'del';
import gulpif from 'gulp-if';
import swc from 'gulp-swc';
import _gulpsass from 'gulp-sass';
import _sass from 'sass';
import imagemin from 'gulp-imagemin';
import htmlmin from 'gulp-htmlmin';
const gulpsass = _gulpsass(_sass);

const origin = './src';
const paths = {
	files: {
		typescript: `${ origin }/**/*.ts`,
		css : `${ origin }/**/*.@(css|sass)`,
		html: `${ origin }/**/*.html`,
		images: `${ origin }/**/*.@(png|jpg|jpeg|gif|svg|ico)`
	},
	build: './build'
}
const state = {
	DEV: 'development',
	PRODUCTION: 'production',
	DEFAULT: 'default',
	get current() {
		return argv.state ?? this[this.DEFAULT];
	},
	get prod() {
		return this.current === this.PRODUCTION;
	}
}

function typescript() {
	return gulp.src(paths.files.typescript)
		.pipe(swc({
			minify: state.prod,
			jsc: {
				parser: {
					syntax: 'typescript',
					tsx: false,
					decorators: true,
					dynamicImport: true
				},
				target: 'es2022',
				...(state.prod ? {
					minify: {
						mangle: true,
						compress: {
							unused: true
						}
					}
				}: {})
			},
			module: {
				type: 'commonjs',
				strict: true,
				strictMode: true,
				lazy: false,
				noInterop: true,
				ignoreDynamic: true
			}
		}))
		.pipe(gulp.dest(paths.build));
}

function sass() {
	return gulp.src(paths.files.css)
		.pipe(gulpsass({
			...(state.prod ? { outputStyle: 'compressed' } : {})
		}))
		.pipe(gulp.dest(paths.build));
}

function html() {
	return gulp.src(paths.files.html)
		.pipe(gulpif(state.prod, htmlmin({ collapseWhitespace: true })))
		.pipe(gulp.dest(paths.build));
}

function images() {
	return gulp.src(paths.files.images)
		.pipe(gulpif(state.prod, imagemin()))
		.pipe(gulp.dest(paths.build));
}

export function clean() {
	// Before building, clean up the the target folder for all previous files.
	return del(['./build'], { force: true });
}

export function annihilation() {
	// Nuke the build and distribution folders. Leave no trace.
	return del(['./build', './dist'], { force: true });
}

export const build = gulp.series(clean, gulp.parallel(typescript, sass, html, images));
export default build;
