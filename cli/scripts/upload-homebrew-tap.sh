#!/bin/bash

# Upload homebrew tap files to GitHub repository

set -e

REPO_URL="https://github.com/sanbasan/homebrew-cchighway.git"
TEMP_DIR="/tmp/homebrew-tap-upload"
SOURCE_DIR="/Users/sanbasan/cchighway/homebrew-tap-files"

echo "🚀 Uploading homebrew tap files..."

# Clean up any existing temp directory
rm -rf "$TEMP_DIR"

# Clone the homebrew tap repository
echo "📥 Cloning repository..."
git clone "$REPO_URL" "$TEMP_DIR"
cd "$TEMP_DIR"

# Copy files from source
echo "📋 Copying files..."
cp -r "$SOURCE_DIR"/* ./

# Commit and push
echo "📤 Committing and pushing..."
git add .
git commit -m "Initial release: CCHighway v1.0.0 Homebrew Formula

- Add Homebrew Formula for CCHighway v1.0.0
- SHA256: 0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5
- Source: https://github.com/Kishikawa1286/cchighway"

git push origin main

# Clean up
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo "✅ Upload complete!"
echo ""
echo "Test installation:"
echo "  brew tap sanbasan/cchighway"
echo "  brew install cchighway"