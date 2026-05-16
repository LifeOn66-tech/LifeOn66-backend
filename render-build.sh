#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- STARTING RENDER BUILD ---"

# Install dependencies
npm install

# Define cache directory relative to project root
export PUPPETEER_CACHE_DIR=$(pwd)/.puppeteer_cache

echo "Cleaning Puppeteer cache for fresh install..."
rm -rf $PUPPETEER_CACHE_DIR

echo "Installing Puppeteer browser using @puppeteer/browsers CLI..."
# This CLI properly downloads AND extracts the browser binary
npx --yes @puppeteer/browsers install chrome@stable --path $PUPPETEER_CACHE_DIR

echo "Verifying installation - looking for chrome binary..."
find $PUPPETEER_CACHE_DIR -name "chrome" -o -name "chrome-headless-shell" 2>/dev/null | head -20

echo "--- RENDER BUILD COMPLETE ---"
