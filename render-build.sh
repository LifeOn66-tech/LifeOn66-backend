#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- STARTING RENDER BUILD ---"

# Install dependencies
npm install

# Define cache directory relative to project root
export PUPPETEER_CACHE_DIR=$(pwd)/.puppeteer_cache

echo "Installing Puppeteer browser into: $PUPPETEER_CACHE_DIR"

# Modern installation command for Puppeteer v20+
npx puppeteer browsers install chrome

echo "--- RENDER BUILD COMPLETE ---"



