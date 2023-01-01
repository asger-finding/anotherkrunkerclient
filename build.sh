#!/bin/bash

# TODO:
# * Argument with value to determine node module minifcation rather than two different arguments
# * --help for more information

readonly SCRIPT_NAME=`basename "$0"`
readonly SCRIPT_NAME_PRINT="\x1b[32m$SCRIPT_NAME\x1b[0m"
readonly DISTRIBUTION_FOLDER="dist"
readonly BINARY_FOLDER="binaries"

print()
{
    # Bypass output suppression
    echo -e "$SCRIPT_NAME_PRINT: $1" >&3
}

setup_directories()
{
    print "Deleting and re-creating dist and binary folders"
    rm -rf $DISTRIBUTION_FOLDER $BINARY_FOLDER
    mkdir $DISTRIBUTION_FOLDER $BINARY_FOLDER
}

inquire()
{
    while true; do
        echo -e -n "$SCRIPT_NAME_PRINT: $1 [y/n]: " >&3
        read -p "" yn
        case $yn in
            [Yy]* ) echo 1; return;;
            [Nn]* ) echo 0; return;;
            * ) print "Please supply y (yes) or n (no).";;
        esac
    done
}

if [[ "$*" == *"supress-output"* ]]; then
    exec 3>&1
    exec >/dev/null
    exec 2>/dev/null
    print "Supressing output"
else
    exec 3>&1
fi

if ! type "yarn" > /dev/null; then
    print "yarn not found ..."
    exit
else
    setup_directories &&

    # If it's a darwin environment, install rpm
    if [[ "$OSTYPE" =~ ^darwin ]] && [ ! type "rpm" > /dev/null ]; then
        print "Darwin environment doesn't have rpm, installing ..."
        brew install rpm;
    fi

    # Install dependencies
    yarn install &&

    if [[ "$*" != *"minify-deps"* ]] && [[ "$*" != *"no-minify-deps"* ]]; then
        print "No argument for minifying provided. Querying user."

        shouldMinify=$(inquire "Should node modules be minified?")
    elif [[ "$*" == *"no-minify-deps"* ]]; then
        shouldMinify=0;
    else
        shouldMinify=1;
    fi

    # Check for dependency minify parameter or query the user on it
    if [[ $shouldMinify == 1 ]]; then
        # Add dependencies for code minifying
        yarn add -D js-yaml modclean minify-all-js node-prune --frozen-lockfile &&

        # Compile the project
        yarn run gulp --state=production &&

        print "Minifying node modules. This might take a while..."
        yarn minify-all-js ./node_modules -j -M > /dev/null &&
        yarn modclean -r -n default:safe &&
        yarn node-prune
    else
        print "Skipping minification"

        # Compile the project
        yarn run gulp --state=production
    fi

    if [[ "$OSTYPE" =~ ^darwin ]]; then
        print "Building for Windows, Mac and Linux."
        yarn electron-builder --win --linux --mac;
    else
        print "Building for Windows and Linux. Only a darwin environment can build for Mac."
        yarn electron-builder --win --linux;
    fi

    # Find the binaries and copy them to the binary folder
    paths=($(find $DISTRIBUTION_FOLDER -maxdepth 1 -iregex '.*\(exe\|appimage\|dmg\|rpm\|deb\)'))
    for i in "${paths[@]}"; do
        print "Copying $(basename "$i") to $BINARY_FOLDER";
        cp $i ./$BINARY_FOLDER;
    done

    DONE=$(ls ./$BINARY_FOLDER | wc -l)
    print "Done! Compiled $DONE programs"
fi
