#!/usr/bin/env bash

# Globs in lowecase to match against in node modules
FILE_GLOBS=(
    '*.map'
    '*.bat'
    '*.c'
    '*.cc'
    '*.cpp'
    '*.csproj'
    '*.css'
    '*.d.js'
    '*.eot'
    '*.gif'
    '*.gnu'
    '*.gyp'
    '*.gypi'
    '*.h'
    '*.html'
    '*.ico'
    '*.jar'
    '*.jpg'
    '*.js.gz'
    '*.js.map'
    '*.json~'
    '*.log'
    '*.markdown'
    '*.md'
    '*.nuspec'
    '*.orig'
    '*.patch'
    '*.pdb'
    '*.png'
    '*.rej'
    '*.sh'
    '*.sln'
    '*.test.js'
    '*.tlog'
    '*.todo'
    '*.ts'
    '*.tsbuildinfo'
    '*.ttf'
    '*.txt'
    '*.vcxproj*'
    '*.watchr'
    '*.woff'
    '*appveyor.yml'
    '.appveyor.yml'
    '.airtap.yml'
    '.babelrc'
    '.coveralls.yml'
    '.dir-locals.el'
    '.dntrc'
    '.documentup.json'
    '.ds_store'
    '.editorconfig'
    '.eslintignore'
    '.eslintrc'
    '.eslintrc.*'
    '.eslintrc.js'
    '.eslintrc.json'
    '.eslintrc.yml'
    '.flowconfig'
    '.gitattributes'
    '.gitignore'
    '.gitkeep'
    '.gitlab-ci.yml'
    '.gitmodules'
    '.gradle'
    '.htmllintrc'
    '.idea'
    '.istanbul.yml'
    '.jamignore'
    '.jsbeautifyrc'
    '.jscsrc'
    '.jshintignore'
    '.jshintrc'
    '.lint'
    '.lintignore'
    '.npmignore'
    '.npmrc'
    '.nvmrc'
    '.prettierrc'
    '.prettierrc.js'
    '.prettierrc.json'
    '.prettierrc.toml'
    '.prettierrc.yml'
    '.sauce-labs*'
    '.stylelintrc'
    '.stylelintrc.js'
    '.stylelintrc.json'
    '.stylelintrc.yaml'
    '.stylelintrc.yml'
    '.tern-port'
    '.tern-project'
    '.travis.yml'
    '.vimrc*'
    '.yarn-integrity'
    '.yarn-metadata.json'
    '.yarnclean'
    '.yo-rc.json'
    '.zuul.yml'
    'appveyor.yml'
    'authors'
    'benchmark'
    'binding.gyp'
    'bower.json'
    'cakefile'
    'changelog'
    'changelog*'
    'changes'
    'circle.yml'
    'cname'
    'component.json'
    'composer.json'
    'contributing*'
    'contributors'
    'desktop.ini'
    'dockerfile'
    'draft-00'
    'draft-01'
    'draft-02'
    'draft-03'
    'draft-04'
    'eslint'
    'example*'
    'examples'
    'gemfile*'
    'gruntfile.js'
    'gulpfile.js'
    'history.markdown'
    'history.md'
    'htmllint.js'
    'hyper-schema'
    'jenkinsfile'
    'jest.config.js'
    'jsl.conf'
    'jsstyle'
    'karma.conf.js'
    'licence'
    'licence-mit'
    'licence.bsd'
    'licence.markdown'
    'licence.md'
    'licence.txt'
    'license'
    'license-mit'
    'license.bsd'
    'license.markdown'
    'license.md'
    'license.txt'
    'makefile'
    'makefile*'
    'mocha.opts'
    'npm-debug.log'
    'prettier.config.js'
    'rakefile*'
    'readme*'
    'samples'
    'screenshots'
    'stylelint.config.js'
    'test'
    'tests'
    'thumbs.db'
    'tsconfig.json'
    'tslint.json'
    'wallaby.conf.js'
    'wallaby.js'
    'wercker.yml'
    '_config.yml'
)

remove_redundant_files()
{
    # Find all files in node_modules directory that match the file globs
    shopt -s nocaseglob # enable non-case sensitive matching
    FIND_COMMAND=(find ./node_modules -type f \( -iname "${FILE_GLOBS[0]}" )
    for ((i=1; i<${#FILE_GLOBS[@]}; i++)) do
        FIND_COMMAND+=(-o -iname "${FILE_GLOBS[$i]}")
    done

    FIND_COMMAND+=( \))

    FILES_TO_DELETE=$("${FIND_COMMAND[@]}")

    # Delete the matched files
    if [[ -n "$FILES_TO_DELETE" ]]; then
        rm $FILES_TO_DELETE
    fi

    # Find all empty directories in node_modules, including those with Thumbs.db and .DS_Store files
    EMPTY_DIRS=$(find ./node_modules \( -type d -empty \) -o \( -name Thumbs.db -o -name .DS_Store \) -print)

    # Delete the empty directories recursively
    if [[ -n "$EMPTY_DIRS" ]]; then
        for dir in $EMPTY_DIRS; do
            rm -r "$dir"
        done

    # Delete empty parent directories
    while [[ $(find ./node_modules -type d -empty) ]]; do
        find ./node_modules -type d -empty -delete
    done
    fi
}

minify_node_modules(){
    yarn swc ./node_modules \
    -q \
    --no-swcrc \
    --source-maps false \
    --sync \
    -C minify=true \
    -C jsc.minify.compress=true \
    -C jsc.minify.mangle=true \
    -C module.type=commonjs \
    -C jsc.target='es2022' \
    -d ./node_modules > /dev/null 2>&1
}
