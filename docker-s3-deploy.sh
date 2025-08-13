#!/bin/bash

# Docker S3 Deployment: Build in Linux Container and Deploy to S3
# This script uses Docker to build in a Linux environment and then deploys to S3

set -e

echo "🐳 Docker S3 Deployment: Linux Container Build and Deploy"
echo "========================================================="

# Configuration
S3_BUCKET="productiveminer"
CLOUDFRONT_DISTRIBUTION_ID="E2UPXPNR94V8IA"
FRONTEND_DIR="frontend"
BUILD_DIR="frontend/build"
DOCKER_IMAGE_NAME="productiveminer-builder"
DOCKER_CONTAINER_NAME="productiveminer-build"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Clean previous builds
clean_previous_builds() {
    print_status "🧹 Cleaning previous builds..."
    
    # Clean frontend build
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        print_success "Build directory cleaned"
    fi
    
    # Remove old Docker containers
    if docker ps -a | grep -q "$DOCKER_CONTAINER_NAME"; then
        docker rm -f "$DOCKER_CONTAINER_NAME" 2>/dev/null || true
        print_success "Old Docker container removed"
    fi
    
    # Remove old Docker images
    if docker images | grep -q "$DOCKER_IMAGE_NAME"; then
        docker rmi "$DOCKER_IMAGE_NAME" 2>/dev/null || true
        print_success "Old Docker image removed"
    fi
}

# Create Dockerfile for building
create_build_dockerfile() {
    print_status "📝 Creating build Dockerfile..."
    
    cat > "$FRONTEND_DIR/Dockerfile.build" << 'EOF'
# Build stage for ProductiveMiner frontend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false --omit=optional

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_PLATFORM="linux-amd64"
ENV REACT_APP_DOCKER_BUILD="true"

# Build the application
RUN npm run build-force-new

# Create a simple server to copy files from
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
EOF

    print_success "Build Dockerfile created"
}

# Build in Docker container
build_in_docker() {
    print_status "🐳 Building in Docker Linux container..."
    
    cd "$FRONTEND_DIR"
    
    # Build Docker image
    docker build -f Dockerfile.build -t "$DOCKER_IMAGE_NAME" .
    
    # Create and run container
    docker run -d --name "$DOCKER_CONTAINER_NAME" -p 3000:3000 "$DOCKER_IMAGE_NAME"
    
    # Wait for container to start
    sleep 5
    
    # Copy build files from container
    print_status "📁 Copying build files from Docker container..."
    docker cp "$DOCKER_CONTAINER_NAME:/app/build" .
    
    # Stop and remove container
    docker stop "$DOCKER_CONTAINER_NAME"
    docker rm "$DOCKER_CONTAINER_NAME"
    
    cd ..
    
    # Verify build was copied
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build files not copied from Docker container!"
        exit 1
    fi
    
    print_success "Build completed in Docker Linux container"
}

# Verify build contents
verify_build() {
    print_status "🔍 Verifying build contents..."
    
    # Check for essential files
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        print_error "Build verification failed - index.html not found"
        exit 1
    fi
    
    if [ ! -d "$BUILD_DIR/static" ]; then
        print_error "Build verification failed - static directory not found"
        exit 1
    fi
    
    # Count files in build
    FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
    print_success "Build verified - $FILE_COUNT files created"
    
    # Show main JS file
    MAIN_JS=$(find "$BUILD_DIR/static/js" -name "main.*.js" 2>/dev/null | head -1)
    if [ -n "$MAIN_JS" ]; then
        print_success "Main JS file: $(basename "$MAIN_JS")"
    fi
    
    # Show file timestamps
    print_status "📅 Build file timestamps:"
    ls -la "$BUILD_DIR" | head -10
}

# Force S3 deployment
force_s3_deploy() {
    print_status "☁️ Force deploying to S3..."
    
    # First, completely empty the S3 bucket
    print_status "🗑️ Completely emptying S3 bucket..."
    aws s3 rm "s3://$S3_BUCKET/" --recursive
    
    # Sync with maximum cache control
    aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" \
        --delete \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE
    
    print_success "Files synced to S3 with maximum cache control"
    
    # Set specific cache headers for all files
    print_status "🔧 Setting cache headers for all files..."
    
    # HTML files - absolutely no cache
    aws s3 cp "s3://$S3_BUCKET/index.html" "s3://$S3_BUCKET/index.html" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "text/html"
    
    # CSS files - no cache
    aws s3 sync "$BUILD_DIR/static/css/" "s3://$S3_BUCKET/static/css/" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "text/css"
    
    # JS files - no cache
    aws s3 sync "$BUILD_DIR/static/js/" "s3://$S3_BUCKET/static/js/" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "application/javascript"
    
    # Other static files - no cache
    aws s3 sync "$BUILD_DIR/static/" "s3://$S3_BUCKET/static/" \
        --exclude "*.css" \
        --exclude "*.js" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE
    
    # Contract files - no cache
    aws s3 sync "$BUILD_DIR/contracts/" "s3://$S3_BUCKET/contracts/" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "application/json"
    
    print_success "Cache headers set for all files"
}

# Force CloudFront invalidation
force_cloudfront_invalidation() {
    print_status "🔄 Force invalidating CloudFront cache..."
    
    # Create invalidation for ALL paths
    INVALIDATION_1=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "CloudFront invalidation created: $INVALIDATION_1"
    
    # Create additional invalidations
    INVALIDATION_2=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/static/*" "/index.html" "/manifest.json" "/asset-manifest.json" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "Static files invalidation: $INVALIDATION_2"
    
    INVALIDATION_3=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/contracts/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "Contract files invalidation: $INVALIDATION_3"
    
    # Wait for all invalidations to complete
    print_status "⏳ Waiting for CloudFront invalidations to complete..."
    
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_1"
    
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_2"
    
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_3"
    
    print_success "All CloudFront invalidations completed"
}

# Verify deployment
verify_deployment() {
    print_status "🔍 Verifying deployment..."
    
    # Check S3 files with timestamps
    print_status "📁 Checking S3 files with timestamps..."
    aws s3 ls "s3://$S3_BUCKET/" --recursive --human-readable
    
    # Check file count
    FILE_COUNT=$(aws s3 ls "s3://$S3_BUCKET/" --recursive | wc -l)
    print_success "Total files in S3: $FILE_COUNT"
    
    # Check index.html
    if aws s3 ls "s3://$S3_BUCKET/index.html" >/dev/null 2>&1; then
        print_success "index.html found in S3"
        
        # Get the main JS file name
        MAIN_JS=$(aws s3 cp "s3://$S3_BUCKET/index.html" - 2>/dev/null | grep -o 'main\.[^"]*\.js' | head -1)
        if [ -n "$MAIN_JS" ]; then
            print_success "Main JS file: $MAIN_JS"
            
            # Check if the JS file exists
            if aws s3 ls "s3://$S3_BUCKET/static/js/$MAIN_JS" >/dev/null 2>&1; then
                print_success "Main JS file exists in S3"
            else
                print_error "Main JS file not found in S3!"
                exit 1
            fi
        fi
    else
        print_error "index.html not found in S3!"
        exit 1
    fi
    
    # Check static directories
    STATIC_JS_COUNT=$(aws s3 ls "s3://$S3_BUCKET/static/js/" --recursive | wc -l)
    STATIC_CSS_COUNT=$(aws s3 ls "s3://$S3_BUCKET/static/css/" --recursive | wc -l)
    
    print_success "Static JS files: $STATIC_JS_COUNT"
    print_success "Static CSS files: $STATIC_CSS_COUNT"
    
    # Check contract files
    CONTRACT_COUNT=$(aws s3 ls "s3://$S3_BUCKET/contracts/" --recursive | wc -l)
    print_success "Contract files: $CONTRACT_COUNT"
}

# Cleanup
cleanup() {
    print_status "🧹 Cleaning up Docker resources..."
    
    # Remove Docker container if it exists
    if docker ps -a | grep -q "$DOCKER_CONTAINER_NAME"; then
        docker rm -f "$DOCKER_CONTAINER_NAME" 2>/dev/null || true
    fi
    
    # Remove Docker image if it exists
    if docker images | grep -q "$DOCKER_IMAGE_NAME"; then
        docker rmi "$DOCKER_IMAGE_NAME" 2>/dev/null || true
    fi
    
    # Remove build Dockerfile
    if [ -f "$FRONTEND_DIR/Dockerfile.build" ]; then
        rm "$FRONTEND_DIR/Dockerfile.build"
    fi
    
    print_success "Cleanup completed"
}

# Main deployment process
main() {
    echo ""
    print_status "🐳 Starting Docker S3 deployment..."
    echo ""
    
    # Clean previous builds
    clean_previous_builds
    
    # Create build Dockerfile
    create_build_dockerfile
    
    # Build in Docker
    build_in_docker
    
    # Verify build
    verify_build
    
    # Force S3 deployment
    force_s3_deploy
    
    # Force CloudFront invalidation
    force_cloudfront_invalidation
    
    # Verify deployment
    verify_deployment
    
    # Cleanup
    cleanup
    
    echo ""
    print_success "🐳 Docker S3 deployment completed successfully!"
    echo ""
    print_status "This deployment was built in a Linux Docker container and deployed to S3."
    echo ""
    print_status "Next steps:"
    echo "   1. Wait 10-15 minutes for global cache propagation"
    echo "   2. Test in incognito/private browser mode"
    echo "   3. Clear ALL browser cache completely"
    echo "   4. Try different browsers/devices"
    echo "   5. Try mobile data or different network"
    echo ""
    print_success "Your application should now be live with Linux-built content!"
}

# Run main function
main "$@"
