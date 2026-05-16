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

echo "Installing chrome-headless-shell (lighter, no system lib dependencies)..."
# chrome-headless-shell works on Render without needing extra system libraries
npx --yes @puppeteer/browsers install chrome-headless-shell@stable --path $PUPPETEER_CACHE_DIR

echo "Verifying - looking for binary..."
find $PUPPETEER_CACHE_DIR -type f -name "chrome-headless-shell" | head -5

echo "--- RENDER BUILD COMPLETE ---"
