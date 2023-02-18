#!/bin/bash

# TODO:
# * Argument with value to determine node module minifcation rather than two different arguments
# * --help for more information

readonly SCRIPT_NAME=`basename "$0"`
readonly SCRIPT_NAME_PRINT="\x1b[32m$SCRIPT_NAME\x1b[0m"
readonly DISTRIBUTION_FOLDER="dist"

print()
{
    # Bypass output suppression
    echo -e "$SCRIPT_NAME_PRINT: $1" >&3
}

setup_directories()
{
    print "Clearing dist folder"
    rm -rf $DISTRIBUTION_FOLDER
    mkdir $DISTRIBUTION_FOLDER
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

    if [[ "$*" != *"minify"* ]] && [[ "$*" != *"no-minify"* ]]; then
        print "No argument for minifying provided. Querying user."

        shouldMinify=$(inquire "Should code be minified?")
    elif [[ "$*" == *"no-minify"* ]]; then
        shouldMinify=0;
    else
        shouldMinify=1;
    fi

    # Check for minify parameter or query the user on it
    if [[ $shouldMinify == 1 ]]; then
        # Add dependencies for code minifying
        yarn add -D modclean minify-all-js node-prune --frozen-lockfile &&

        # Compile the project with minification
        yarn run gulp --state=production &&

        print "Minifying node modules. This might take a while..."
        yarn minify-all-js ./node_modules -j -M > /dev/null &&
        yarn modclean -r -n default:safe &&
        yarn node-prune
    else
        print "Skipping minification"

        # Compile the project without minification
        yarn run gulp
    fi

    if [[ "$OSTYPE" =~ ^darwin ]]; then
        print "Building for Windows, Mac and Linux."
        yarn electron-builder --win --linux --mac;
    else
        print "Building for Windows and Linux. Only a darwin environment can build for Mac."
        yarn electron-builder --win --linux;
    fi

    paths=($(find $DISTRIBUTION_FOLDER -maxdepth 1 -iregex '.*\(exe\|appimage\|dmg\|rpm\|deb\)'))
    print "Done! Compiled ${#paths[@]} programs"
fi
