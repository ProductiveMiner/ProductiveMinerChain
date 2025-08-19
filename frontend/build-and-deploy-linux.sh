#!/bin/bash

echo "🚀 Building and Deploying Frontend with Math Engine (Linux Compatible)..."

# Configuration
S3_BUCKET="productiveminer"
CLOUDFRONT_DISTRIBUTION_ID="E1GNYR3GX0Y5IG"
MATH_ENGINE_URL="https://math-engine.productiveminer.org"  # Update with your ECS endpoint

# Set environment variables for Linux compatibility and Math Engine
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
export CI=false
export REACT_APP_ENGINE_URL=$MATH_ENGINE_URL

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"

# Test Math Engine connection
echo "🔍 Testing Math Engine connection..."
if curl -s "$MATH_ENGINE_URL/health" > /dev/null; then
    echo "✅ Math Engine is accessible at: $MATH_ENGINE_URL"
else
    echo "⚠️ Warning: Math Engine not accessible at: $MATH_ENGINE_URL"
    echo "   This may be expected if the ECS service is not yet deployed."
fi

# Create a simple nginx configuration for the build
echo "📝 Creating nginx configuration..."
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

echo "📊 Build Summary:"
echo "  - Build directory: $(pwd)/build"
echo "  - Main JS bundle: $(ls -lh build/static/js/main.*.js | awk '{print $5}')"
echo "  - CSS bundle: $(ls -lh build/static/css/main.*.css | awk '{print $5}')"
echo "  - Total build size: $(du -sh build | awk '{print $1}')"
echo "  - Math Engine URL: $MATH_ENGINE_URL"

# Deploy to S3
echo ""
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
