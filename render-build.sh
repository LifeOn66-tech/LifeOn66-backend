#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- STARTING RENDER BUILD ---"

# Set Puppeteer Cache Directory environment variable so that standard dependencies respect it
export PUPPETEER_CACHE_DIR=$(pwd)/puppeteer_cache

# Install dependencies. This automatically triggers our "postinstall" script:
# "node src/utils/installChrome.js", which installs and extracts Chrome with 100% accuracy.
npm install

echo "--- RENDER BUILD COMPLETE ---"
