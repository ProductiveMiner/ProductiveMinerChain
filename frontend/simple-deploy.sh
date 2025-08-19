#!/bin/bash

# Simple deployment script for ProductiveMiner Frontend
# Builds with Docker for Linux/AMD64 compatibility

set -e

echo "🚀 Simple ProductiveMiner Frontend Deployment"
echo "============================================="

# Configuration
S3_BUCKET="productiveminer"
CLOUDFRONT_DISTRIBUTION_ID="E2UPXPNR94V8IA"

# Clean and prepare
echo "🧹 Cleaning previous build..."
rm -rf build/ || true
rm -f Dockerfile.simple || true

# Create simple Dockerfile for Linux build
echo "📝 Creating Dockerfile..."
cat > Dockerfile.simple << 'EOF'
FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV CI=false

# Build the application
RUN npm run build

# Create simple server
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
EOF

echo "🐳 Building in Docker..."
docker build --platform=linux/amd64 -f Dockerfile.simple -t productiveminer-simple-build .

echo "📁 Extracting build files..."
docker create --name temp-container productiveminer-simple-build
docker cp temp-container:/app/build ./
docker rm temp-container

# Verify build
if [ ! -d "build" ] || [ ! -f "build/index.html" ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Add build info
echo "{\"buildDate\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"sessionFixes\":true}" > build/build-info.json

echo "☁️ Deploying to S3..."
aws s3 sync build/ s3://$S3_BUCKET/ \
    --delete \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE

echo "🔄 Invalidating CloudFront..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "✅ Invalidation created: $INVALIDATION_ID"

# Cleanup
echo "🧹 Cleaning up..."
docker rmi productiveminer-simple-build || true
rm -f Dockerfile.simple || true

echo ""
echo "🎉 Deployment completed successfully!"
echo "📊 Build size: $(du -sh build | cut -f1)"
echo "🔗 Website: https://productiveminer.org"
echo "⏰ CloudFront propagation: ~5-15 minutes"
echo ""
echo "🔧 Session fixes included:"
echo "  ✅ Enhanced session validation"
echo "  ✅ Better error handling"
echo "  ✅ Automatic session recovery"
echo ""
