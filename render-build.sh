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
mkdir -p $PUPPETEER_CACHE_DIR

echo "Installing Puppeteer browser into: $PUPPETEER_CACHE_DIR"

# Force installation and specify platform
npx puppeteer browsers install chrome --path $PUPPETEER_CACHE_DIR

echo "Verifying installation..."
ls -R $PUPPETEER_CACHE_DIR | head -n 20

echo "--- RENDER BUILD COMPLETE ---"



