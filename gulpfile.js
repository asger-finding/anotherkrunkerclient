// TODO: Switch to a modern alternative such as rollup or webpack.
// I am most comfortable with the gulp, but it is no longer a good choice.

require('require-json5').replace();
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

const { compilerOptions: { paths: tsPaths } } = require('./tsconfig.json');

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
					const [alias] = node.arguments;

					if (alias.type === 'Literal' && tsPaths[alias.value]) {
						requireAliases.push({
							start: alias.start,
							end: alias.end,
							value: alias.value,
							tsPath: tsPaths[alias.value][0]
						});
					}
				}
			}
		});

		for (const alias of requireAliases) {
			const resolvedTsPath = resolve(__dirname, alias.tsPath);
			const path = `./${ relative(resolve(__dirname, filePath), resolvedTsPath).substring(3) }`;

			const diff = path.length - alias.value.length;

			fileContent = fileContent.slice(0, alias.start) + fileContent.slice(alias.end);
			fileContent = `${ fileContent.slice(0, alias.start) }"${ path }"${ fileContent.slice(alias.start) }`;

			// Shift all following aliases by the difference in length.
			for (const node of requireAliases) {
				node.start += diff;
				node.end += diff;
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

function sass() {
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
module.exports.annihilation = annihilation;
module.exports.default = module.exports.build = gulp.series(state.prod ? annihilation : clean, gulp.parallel(typescript, sass, html, images));
