#!/bin/bash

# Netlify Build Script for ConstructTrack Pro
# This script runs during Netlify's build process

echo "🚀 Starting ConstructTrack Pro build process..."

# Check Node.js version
echo "📋 Node.js version:"
node --version

# Check npm version
echo "📋 npm version:"
npm --version

# Install dependencies with production optimizations
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit

# Run type checking
echo "🔍 Running type checks..."
npm run type-check

# Build the application
echo "🏗️ Building application..."
npm run build

# Verify build output
echo "✅ Build verification:"
ls -la dist/

# Check if critical files exist
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed: index.html not found"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo "❌ Build failed: assets directory not found"
    exit 1
fi

# Display build statistics
echo "📊 Build statistics:"
du -sh dist/
find dist/ -name "*.js" -exec wc -c {} + | sort -n | tail -5
find dist/ -name "*.css" -exec wc -c {} + | sort -n

echo "✅ Build completed successfully!"

# Optional: Generate build info file
cat > dist/build-info.json << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildId": "${BUILD_ID:-unknown}",
  "commit": "${COMMIT_REF:-unknown}",
  "branch": "${BRANCH:-unknown}",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF

echo "📋 Build info saved to dist/build-info.json"