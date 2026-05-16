#!/usr/bin/env bash
# exit on error
set -o errexit

npm install

# Clear cache for clean install
echo "Cleaning existing Puppeteer cache..."
rm -rf .puppeteer_cache

echo "Installing Puppeteer browser..."
PUPPETEER_SKIP_DOWNLOAD=false node node_modules/puppeteer/install.mjs



