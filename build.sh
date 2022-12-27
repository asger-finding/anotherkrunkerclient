#!/usr/bin/env sh

SCRIPT_NAME_PRINT="\x1b[32mbuild.sh\x1b[0m"
DISTRIBUTION_FOLDER="dist"
BINARY_FOLDER="binaries"

setup_directories()
{
    echo -e "$SCRIPT_NAME_PRINT: Deleting and re-creating dist and binary folders"
    rm -rf $DISTRIBUTION_FOLDER $BINARY_FOLDER
    mkdir $DISTRIBUTION_FOLDER $BINARY_FOLDER
}

inquire() {
    while true; do
        echo -n -e "$1 [Y/n]: "
        read -p "" yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo -e "$SCRIPT_NAME_PRINT: Please supply y (yes) or n (no).";;
        esac
    done
}

if ! type "yarn" > /dev/null; then
    echo -e "$SCRIPT_NAME_PRINT: yarn not found ..."
    exit
else
    setup_directories &&

    # If it's a darwin environment, install rpm
    if [[ "$OSTYPE" =~ ^darwin ]] && [ ! type "rpm" > /dev/null ]; then
        echo -e "Darwin environment does not have rpm, installing ..."
        brew install rpm;
    fi

    yarn install &&

    if [[ "$*" == *"yes"* ]] || inquire "$SCRIPT_NAME_PRINT: Should node modules be minified?"; then
        yarn add -D js-yaml modclean minify-all-js node-prune --frozen-lockfile &&

        yarn prebundle &&

        echo -e "$SCRIPT_NAME_PRINT: Minifying node modules ..."
        yarn minify-all-js ./node_modules -j -M > /dev/null &&
        yarn modclean -r -n default:safe &&
        yarn node-prune
    else
        echo -e "$SCRIPT_NAME_PRINT: Skipping minification"
        yarn prebundle
    fi

    if [[ "$OSTYPE" =~ ^darwin ]]; then
        echo -e "$SCRIPT_NAME_PRINT: Building for Windows, Mac and Linux."
        yarn electron-builder --win --linux --mac;
    else
        echo -e "$SCRIPT_NAME_PRINT: Building for Windows and Linux. Only a darwin environment can build for Mac."
        yarn electron-builder --win --linux;
    fi

    yarn postinstall &&

    # Find the binaries and copy them to the
    paths=($(find $DISTRIBUTION_FOLDER -maxdepth 1 -iregex '.*\(exe\|appimage\|dmg\|rpm\|deb\)'))

    for i in "${paths[@]}"
        do cp $i ./$BINARY_FOLDER
    done
fi
