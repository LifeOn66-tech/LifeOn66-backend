#!/usr/bin/env bash
# exit on error
set -o errexit

npm install

# Clear the puppeteer cache folder before installing to avoid "executable missing" errors
# This is crucial on Render where build cache can get corrupted
echo "Clearing Puppeteer cache..."
rm -rf /opt/render/.cache/puppeteer

echo "Installing Puppeteer browser..."
npx puppeteer browsers install chrome
