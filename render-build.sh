#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- STARTING RENDER BUILD ---"

# Install dependencies
npm install

# Define cache directory relative to project root
export PUPPETEER_CACHE_DIR=$(pwd)/.puppeteer_cache
mkdir -p $PUPPETEER_CACHE_DIR

echo "Installing Puppeteer browser into: $PUPPETEER_CACHE_DIR"

# Modern installation command for Puppeteer v20+
npx puppeteer browsers install chrome --path $PUPPETEER_CACHE_DIR

echo "--- RENDER BUILD COMPLETE ---"



