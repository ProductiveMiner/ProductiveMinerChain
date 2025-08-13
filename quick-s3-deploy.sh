#!/bin/bash

# Quick S3 Deployment Script (Linux Compatible)
# For rapid deployments without Docker

set -e

echo "🚀 Quick S3 Deployment (Linux Compatible)"
echo "========================================="

# Configuration
S3_BUCKET="productiveminer"
CLOUDFRONT_DISTRIBUTION_ID="E2UPXPNR94V8IA"
FRONTEND_DIR="frontend"
BUILD_DIR="frontend/build"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Quick build and deploy
main() {
    print_status "Building frontend..."
    cd "$FRONTEND_DIR"
    
    # Clean install and build
    rm -rf node_modules build
    npm install
    npm run build-force-new
    
    cd ..
    
    print_status "Deploying to S3..."
    aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" --delete
    
    print_status "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"
    
    print_success "Quick deployment completed!"
    echo "Wait 2-5 minutes for cache propagation, then test your application."
}

main "$@"
