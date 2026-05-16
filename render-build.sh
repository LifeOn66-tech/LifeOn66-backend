#!/usr/bin/env bash
# exit on error
set -o errexit

npm install

# Clear any existing cache to avoid corruption
echo "Cleaning existing Puppeteer cache..."
rm -rf /opt/render/.cache/puppeteer
rm -rf .puppeteer_cache

echo "Installing Puppeteer browser to local directory..."
# Set local cache directory for both install and runtime
export PUPPETEER_CACHE_DIR=$(pwd)/.puppeteer_cache
PUPPETEER_SKIP_DOWNLOAD=false node node_modules/puppeteer/install.mjs


