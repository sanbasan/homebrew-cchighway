#!/bin/bash

# CCHighway Release Preparation Script

set -e

VERSION="1.0.0"
REPO_URL="https://github.com/Kishikawa1286/cchighway"

echo "🚀 Preparing CCHighway v$VERSION for release..."

# Build the project
echo "📦 Building project..."
npm run build:release

# Create release directory
mkdir -p releases
cp dist/bin/index.js releases/cchighway-$VERSION

echo "✅ Release files prepared in releases/ directory"
echo ""
echo "Next steps:"
echo "1. Create GitHub release with tag v$VERSION"
echo "2. Upload releases/cchighway-$VERSION as release asset"
echo "3. Get SHA256 of the release tarball:"
echo "   curl -sL $REPO_URL/archive/refs/tags/v$VERSION.tar.gz | shasum -a 256"
echo "4. Update cchighway.rb with the SHA256"
echo "5. Create Homebrew tap repository"
