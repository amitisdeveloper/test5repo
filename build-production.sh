#!/bin/bash

# Build script for production deployment
# Usage: ./build-production.sh

echo "🔨 Building application for production..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build with production API URL
echo "🏗️ Building frontend..."
VITE_API_URL=https://result.555xch.pro npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📁 Output location: ./dist"
    echo "📊 You can now deploy the contents of ./dist to your web server"
    echo ""
    echo "Next steps:"
    echo "1. Copy ./dist contents to /var/www/new555v2/dist on your server"
    echo "2. Ensure backend is running: cd backend && NODE_ENV=production npm start"
    echo "3. Configure web server to proxy /api requests to http://localhost:3001/api"
else
    echo "❌ Build failed!"
    exit 1
fi
