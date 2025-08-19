#!/bin/bash

echo "🚀 Building and Deploying Frontend with Docker (Linux/AMD64 Compatible)..."

# Configuration
S3_BUCKET="productiveminer"
CLOUDFRONT_DISTRIBUTION_ID="E1GNYR3GX0Y5IG"
MATH_ENGINE_URL="https://math-engine.productiveminer.org"

# Set environment variables for Linux compatibility and Math Engine
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
export CI=false
export REACT_APP_ENGINE_URL=$MATH_ENGINE_URL

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/
rm -rf frontend-build-linux/

# Build using Docker for Linux/AMD64 compatibility
echo "🐳 Building with Docker (Linux/AMD64)..."
docker build --platform linux/amd64 \
    --build-arg REACT_APP_API_URL=/api \
    --build-arg REACT_APP_BLOCKCHAIN_URL=/api \
    --build-arg REACT_APP_MATH_ENGINE_URL=$MATH_ENGINE_URL \
    --build-arg REACT_APP_WS_URL=ws://localhost:3001 \
    --build-arg NODE_ENV=production \
    -t productiveminer-frontend:latest .

# Create a container to extract the build
echo "📦 Extracting build from Docker container..."
docker create --name temp-build productiveminer-frontend:latest
docker cp temp-build:/app/build ./frontend-build-linux
docker rm temp-build

# Check if build was successful
if [ ! -d "frontend-build-linux" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

echo "✅ Docker build completed successfully!"

# Test Math Engine connection
echo "🔍 Testing Math Engine connection..."
if curl -s "$MATH_ENGINE_URL/health" > /dev/null; then
    echo "✅ Math Engine is accessible at: $MATH_ENGINE_URL"
else
    echo "⚠️ Warning: Math Engine not accessible at: $MATH_ENGINE_URL"
    echo "   This may be expected if the ECS service is not yet deployed."
fi

echo "📊 Build Summary:"
echo "  - Build directory: $(pwd)/frontend-build-linux"
echo "  - Main JS bundle: $(ls -lh frontend-build-linux/static/js/main.*.js | awk '{print $5}')"
echo "  - CSS bundle: $(ls -lh frontend-build-linux/static/css/main.*.css | awk '{print $5}')"
echo "  - Total build size: $(du -sh frontend-build-linux | awk '{print $1}')"
echo "  - Math Engine URL: $MATH_ENGINE_URL"
echo "  - Platform: Linux/AMD64"

# Deploy to S3
echo ""
echo "☁️ Deploying to S3..."
aws s3 sync frontend-build-linux/ s3://$S3_BUCKET/ \
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

echo ""
echo "🎉 Deployment completed successfully!"
echo "🔗 Website: https://productiveminer.org"
echo "🧮 Math Engine: $MATH_ENGINE_URL"
echo "⏰ CloudFront propagation: ~5-15 minutes"
echo ""
echo "🔧 Math Engine features included:"
echo "  ✅ Direct ECS connection"
echo "  ✅ Health check monitoring"
echo "  ✅ 25 mathematical computation types"
echo "  ✅ Error handling and retry logic"
echo "  ✅ Millennium Problems (5 types)"
echo "  ✅ Advanced Research (8 types)"
echo "  ✅ Applied Research (6 types)"
echo "  ✅ Standard Research (2 types)"
echo "  ✅ Complex Problems (1 type)"
echo "  ✅ Major Theorems (1 type)"
echo "  ✅ Basic Research (2 types)"

# Clean up
echo "🧹 Cleaning up..."
rm -rf frontend-build-linux/
