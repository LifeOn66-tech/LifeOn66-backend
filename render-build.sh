#!/usr/bin/env bash
# exit on error
set -o errexit

npm install

# Clear the puppeteer cache folder before installing to avoid "executable missing" errors
echo "Cleaning existing Puppeteer cache..."
rm -rf /opt/render/.cache/puppeteer
rm -rf .cache/puppeteer

echo "Installing Puppeteer browser..."
npx puppeteer browsers install chrome

