#!/usr/bin/env bash

# This script recursively fetches the krunker class icons
# and applies an embross filter, then saves the icon under
# media/krunker/classes
# The icon index matches the class indexes in-game
# This is handy to ensure a consistent style and for generating
# Discord RPC assets

BASE_URL="http://assets.krunker.io/textures/classes/icon_"
OUTPUT_DIR="$(dirname "$0")/../media/krunker/classes"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

for i in {0..30}; do
    IMAGE_URL="$BASE_URL$i.png"
    OUTPUT_FILE="$OUTPUT_DIR/icon_"$i".png"

    echo -e "\x1b[0mGenerating image for: \x1b[32m$IMAGE_URL\x1b[0m"

    # Get image from URL
    # Upscale image to 384x384 with nearest neighbor algorithm and no dithering
    # Apply embross convolution matrix (max 7x7/49)
    # Upscale image again to 1024x1024
    ffmpeg -y -i "$IMAGE_URL" -hide_banner -loglevel error -pix_fmt rgba -vf \
        "format=rgba,scale=384:384:flags=neighbor,convolution='-8 0 0 0 0 0 0 0 -4 -2 0 0 0 0 0 -2 -2 1 0 0 0 0 0 -1 1 1 0 0 0 0 0 1 2 2 2 0 0 0 0 2 4 4 0 0 0 0 2 4 8:-8 0 0 0 0 0 0 0 -4 -2 0 0 0 0 0 -2 -2 1 0 0 0 0 0 -1 1 1 0 0 0 0 0 1 2 2 2 0 0 0 0 2 4 4 0 0 0 0 2 4 8:-8 0 0 0 0 0 0 0 -4 -2 0 0 0 0 0 -2 -2 1 0 0 0 0 0 -1 1 1 0 0 0 0 0 1 2 2 2 0 0 0 0 2 4 4 0 0 0 0 2 4 8:-8 0 0 0 0 0 0 0 -4 -2 0 0 0 0 0 -2 -2 1 0 0 0 0 0 -1 1 1 0 0 0 0 0 1 2 2 2 0 0 0 0 2 4 4 0 0 0 0 2 4 8',scale=1024:1024:flags=bilinear" \
        -sws_dither none "$OUTPUT_FILE"
    # pad=390:390:(390-iw)/2:(390-ih)/2:color=#00000000
done

exit
