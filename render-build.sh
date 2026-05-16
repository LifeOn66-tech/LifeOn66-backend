#!/usr/bin/env bash
# exit on error
set -o errexit

npm install

# Clear the puppeteer cache folder before installing to avoid "executable missing" errors
echo "Cleaning existing Puppeteer cache..."
rm -rf /opt/render/.cache/puppeteer
rm -rf .cache/puppeteer

echo "Installing Puppeteer browser via official script..."
# Force download even if SKIP_DOWNLOAD is set in environment
PUPPETEER_SKIP_DOWNLOAD=false node node_modules/puppeteer/install.mjs

