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
const { relative, resolve } = require('path');

const { compilerOptions: { paths: tsAliases } } = require('./tsconfig.json');

function detectRequire(node) {
	return node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require';
}
function transformArgument(node) {
	if (node.type !== 'Literal') return;
	return {
		start: node.start,
		end: node.end,
		value: node.value
	}
}

// TODO: Fix loop hell
function moduleAlias() {
	return map((file, callback) => {
		let fileContent = file.contents.toString();
		const filePath = file.path;
		const ast = parse(fileContent, {
			ecmaVersion: 'latest',
			sourceType: 'module'
		});
		const requireAliases = [];

		for (const node of ast.body) {
			if (node.type === 'ExpressionStatement' && detectRequire(node.expression)) {
				requireAliases.push(transformArgument(node.expression.arguments[0]));
			} else if (node.type === 'VariableDeclaration') {
				for (const declaration of node.declarations) {
					if (declaration.type === 'VariableDeclarator' && detectRequire(declaration.init)) {
						requireAliases.push(transformArgument(declaration.init.arguments[0]));
					}
				}
			}
		}
		for (const requireAlias of requireAliases) {
			// requirePath may be undefined if node type is not 'Literal'
			if (requireAlias) {
				// Check if TypeScript has an alias for this module.
				const tsPaths = tsAliases[requireAlias.value];
				if (tsPaths instanceof Array) {
					const [tsPath] = tsPaths;
					const resolvedTsPath = resolve(__dirname, tsPath);
					const path = './' + (relative(filePath, resolvedTsPath)).replace('../', '') + '.js';

					// Get the diff between the alias and the file path.
					const diff = path.length - requireAlias.value.length;

					// Strip the require call of its first parameter.
					fileContent = fileContent.slice(0, requireAlias.start) + fileContent.slice(requireAlias.end);

					// Insert tsPath into fileContent at requirePath.start.
					fileContent = fileContent.slice(0, requireAlias.start) + `"${ path }"` + fileContent.slice(requireAlias.start);

					// Resolve the string length difference.
					for (const node of requireAliases) {
						if (!node) return;

						node.start += diff;
						node.end += diff;
					}
				}
			}
		}

		file.contents = Buffer.from(fileContent);

		callback(null, file);
	});
}

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
				noInterop: true
			}
		}))
		.pipe(moduleAlias())
		.pipe(ignore.exclude((file) => file.contents.length <= 12))
		.pipe(gulp.dest(paths.build));
}

function sass() {
	return gulp.src(paths.files.css)
		.pipe(gulpsass({
			outputStyle: (state.prod ? 'compressed' : 'expanded' )
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

function clean() {
	// Before building, clean up the the target folder for all previous files.
	return del(['./build'], { force: true });
}

function annihilation() {
	// Nuke the build and distribution folders. Leave no trace.
	return del(['./build', './dist'], { force: true });
}

module.exports.clean = clean;
module.exports.annihilation;
module.exports.default = module.exports.build = gulp.series((state.prod ? annihilation : clean), gulp.parallel(typescript, sass, html, images));
