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

# Use the internal installer which is more reliable for matching versions
PUPPETEER_SKIP_DOWNLOAD=false node node_modules/puppeteer/install.mjs

echo "Verifying installation structure..."
find $PUPPETEER_CACHE_DIR -maxdepth 5

echo "--- RENDER BUILD COMPLETE ---"



