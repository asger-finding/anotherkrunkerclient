// TODO: Switch to a modern alternative such as rollup or webpack.
// I am most comfortable with the gulp, but it is no longer a good choice.

const gulp = require('gulp');
const del = require('del');
const yargs = require('yargs');
const gulpif = require('gulp-if');
const swc = require('gulp-swc');
const gulpsass = require('gulp-sass')(require('sass'));
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const ignore = require('gulp-ignore');
const { argv } = yargs(process.argv.slice(2));
const { map } = require('event-stream');
const { parse } = require('acorn');
const { simple } = require('acorn-walk');
const { relative, resolve } = require('path');

const moduleAliases = require('./package.json')._moduleAliases ?? {};

function moduleAlias() {
	return map((file, callback) => {
		const requireAliases = [];
		const filePath = file.path;
		let fileContent = file.contents.toString();

		simple(parse(fileContent, {
			ecmaVersion: 'latest',
			sourceType: 'script'
		}), {
			CallExpression(node) {
				if (!node.callee) return;
				if (node.callee.name === 'require') {
					const [stringArg] = node.arguments;
					const [before, ...afterSlash] = stringArg.value.split('/');
					afterSlash.unshift('');
					const after = afterSlash.join('/');

					if (stringArg.type === 'Literal' && before in moduleAliases) {
						requireAliases.push({
							start: stringArg.start,
							end: stringArg.end,
							alias: before,
							target: moduleAliases[before],
							optionalPath: after
						});
					}
				}
			}
		});

		for (const instance of requireAliases) {
			const resolvedTarget = resolve(__dirname, instance.target);
			const path = `./${ relative(resolve(__dirname, filePath), resolvedTarget).substring(3) }` + instance.optionalPath;
			const diff = path.length - (instance.alias.length + instance.optionalPath.length);

			fileContent = fileContent.slice(0, instance.start) + fileContent.slice(instance.end);
			fileContent = `${ fileContent.slice(0, instance.start) }"${ path }"${ fileContent.slice(instance.start) }`;

			// Shift all following aliases by the difference in length.
			for (const inst of requireAliases) {
				inst.start += diff;
				inst.end += diff;
			}
		}

		file.contents = Buffer.from(fileContent);

		callback(null, file);
	});
}

const source = './src';
const MIN_FILE_LENGTH = 14;
const paths = {
	files: {
		typescript: `${ source }/**/*.ts`,
		css: `${ source }/**/*.@(css|sass)`,
		html: `${ source }/**/*.html`,
		images: `${ source }/**/*.@(png|jpg|jpeg|gif|svg|ico)`
	},
	build: './build'
};
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
};

function scripts() {
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
				...state.prod
					? {
						minify: {
							mangle: true,
							compress: { unused: true }
						}
					}
					: {}
			},
			module: {
				type: 'commonjs',
				strict: true,
				strictMode: true,
				lazy: false,
				noInterop: true
			}
		}))
		.pipe(moduleAlias())
		.pipe(ignore.exclude(file => file.contents.length <= MIN_FILE_LENGTH))
		.pipe(gulp.dest(paths.build));
}

function styles() {
	return gulp.src(paths.files.css)
		.pipe(gulpsass({ outputStyle: state.prod ? 'compressed' : 'expanded' }))
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

function clean() {
	// Before building, clean up the the target folder for all previous files.
	return del(['./build'], { force: true });
}

function annihilation() {
	// Nuke the build and distribution folders. Leave no trace.
	return del(['./build', './dist'], { force: true });
}

module.exports.clean = clean;
module.exports.default = module.exports.build = gulp.series(state.prod ? annihilation : clean, gulp.parallel(scripts, styles, html, images));
