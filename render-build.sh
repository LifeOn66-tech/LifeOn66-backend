#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- STARTING RENDER BUILD ---"

# Install dependencies
npm install

# Define cache directory relative to project root (visible folder name to prevent Render build pruning)
export PUPPETEER_CACHE_DIR=$(pwd)/puppeteer_cache
echo "Setting Puppeteer Cache to: $PUPPETEER_CACHE_DIR"

# Clean old cache to ensure no corrupted files are left
echo "Cleaning existing cache directory..."
rm -rf $PUPPETEER_CACHE_DIR
mkdir -p $PUPPETEER_CACHE_DIR

# Download exact Chrome Headless Shell version expected by Puppeteer using curl (memory-efficient)
CHROME_VERSION="148.0.7778.97"
ZIP_URL="https://storage.googleapis.com/chrome-for-testing-public/${CHROME_VERSION}/linux64/chrome-headless-shell-linux64.zip"

echo "Downloading chrome-headless-shell v${CHROME_VERSION} from ${ZIP_URL}..."
curl -L -f -o "$PUPPETEER_CACHE_DIR/chrome-headless-shell.zip" "$ZIP_URL"

echo "Extracting chrome-headless-shell using native unzip (uses 0 RAM)..."
unzip -o -q "$PUPPETEER_CACHE_DIR/chrome-headless-shell.zip" -d "$PUPPETEER_CACHE_DIR"

echo "Cleaning up zip file..."
rm -f "$PUPPETEER_CACHE_DIR/chrome-headless-shell.zip"

echo "Verifying installation - checking for executable..."
find $PUPPETEER_CACHE_DIR -type f -name "chrome-headless-shell"

echo "--- RENDER BUILD COMPLETE ---"
