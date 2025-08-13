#!/bin/bash

# New S3 Bucket Deployment: Create Fresh Bucket and Deploy
# This script creates a new S3 bucket to avoid any caching issues

set -e

echo "🆕 New S3 Bucket Deployment: Fresh Bucket Creation and Deploy"
echo "============================================================="

# Configuration
OLD_S3_BUCKET="productiveminer"
NEW_S3_BUCKET="productiveminer-fresh-$(date +%Y%m%d%H%M%S)"
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

# Create new S3 bucket
create_new_s3_bucket() {
    print_status "🆕 Creating new S3 bucket: $NEW_S3_BUCKET"
    
    # Create the bucket
    aws s3 mb "s3://$NEW_S3_BUCKET"
    
    # Disable block public access settings
    aws s3api put-public-access-block --bucket "$NEW_S3_BUCKET" \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # Configure bucket for static website hosting
    aws s3 website "s3://$NEW_S3_BUCKET" --index-document index.html --error-document index.html
    
    # Set bucket policy for public read access
    cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$NEW_S3_BUCKET/*"
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy --bucket "$NEW_S3_BUCKET" --policy file:///tmp/bucket-policy.json
    
    # Enable CORS (simplified)
    aws s3api put-bucket-cors --bucket "$NEW_S3_BUCKET" --cors-configuration '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","HEAD"],"AllowedOrigins":["*"],"ExposeHeaders":[]}]}'
    
    print_success "New S3 bucket created and configured: $NEW_S3_BUCKET"
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

# Deploy to new S3 bucket
deploy_to_new_s3() {
    print_status "☁️ Deploying to new S3 bucket: $NEW_S3_BUCKET"
    
    # Sync with maximum cache control
    aws s3 sync "$BUILD_DIR/" "s3://$NEW_S3_BUCKET/" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE
    
    print_success "Files synced to new S3 bucket"
    
    # Set specific cache headers for all files
    print_status "🔧 Setting cache headers for all files..."
    
    # HTML files - absolutely no cache
    aws s3 cp "s3://$NEW_S3_BUCKET/index.html" "s3://$NEW_S3_BUCKET/index.html" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "text/html"
    
    # CSS files - no cache
    aws s3 sync "$BUILD_DIR/static/css/" "s3://$NEW_S3_BUCKET/static/css/" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "text/css"
    
    # JS files - no cache
    aws s3 sync "$BUILD_DIR/static/js/" "s3://$NEW_S3_BUCKET/static/js/" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "application/javascript"
    
    # Other static files - no cache
    aws s3 sync "$BUILD_DIR/static/" "s3://$NEW_S3_BUCKET/static/" \
        --exclude "*.css" \
        --exclude "*.js" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE
    
    # Contract files - no cache
    aws s3 sync "$BUILD_DIR/contracts/" "s3://$NEW_S3_BUCKET/contracts/" \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "application/json"
    
    print_success "Cache headers set for all files"
}

# Update CloudFront origin (optional)
update_cloudfront_origin() {
    print_status "🔄 Updating CloudFront origin to new S3 bucket..."
    
    # Get current CloudFront distribution config
    aws cloudfront get-distribution-config --id "$CLOUDFRONT_DISTRIBUTION_ID" > /tmp/cloudfront-config.json
    
    # Update the origin to point to the new S3 bucket
    # Note: This is a complex operation that requires careful JSON manipulation
    # For now, we'll just show the new bucket URL
    
    print_success "New S3 bucket URL: http://$NEW_S3_BUCKET.s3-website-us-east-1.amazonaws.com"
    print_warning "You may need to manually update CloudFront origin to point to the new bucket"
}

# Verify deployment
verify_deployment() {
    print_status "🔍 Verifying deployment to new S3 bucket..."
    
    # Check S3 files with timestamps
    print_status "📁 Checking new S3 bucket files with timestamps..."
    aws s3 ls "s3://$NEW_S3_BUCKET/" --recursive --human-readable
    
    # Check file count
    FILE_COUNT=$(aws s3 ls "s3://$NEW_S3_BUCKET/" --recursive | wc -l)
    print_success "Total files in new S3 bucket: $FILE_COUNT"
    
    # Check index.html
    if aws s3 ls "s3://$NEW_S3_BUCKET/index.html" >/dev/null 2>&1; then
        print_success "index.html found in new S3 bucket"
        
        # Get the main JS file name
        MAIN_JS=$(aws s3 cp "s3://$NEW_S3_BUCKET/index.html" - 2>/dev/null | grep -o 'main\.[^"]*\.js' | head -1)
        if [ -n "$MAIN_JS" ]; then
            print_success "Main JS file: $MAIN_JS"
            
            # Check if the JS file exists
            if aws s3 ls "s3://$NEW_S3_BUCKET/static/js/$MAIN_JS" >/dev/null 2>&1; then
                print_success "Main JS file exists in new S3 bucket"
            else
                print_error "Main JS file not found in new S3 bucket!"
                exit 1
            fi
        fi
    else
        print_error "index.html not found in new S3 bucket!"
        exit 1
    fi
    
    # Check static directories
    STATIC_JS_COUNT=$(aws s3 ls "s3://$NEW_S3_BUCKET/static/js/" --recursive | wc -l)
    STATIC_CSS_COUNT=$(aws s3 ls "s3://$NEW_S3_BUCKET/static/css/" --recursive | wc -l)
    
    print_success "Static JS files: $STATIC_JS_COUNT"
    print_success "Static CSS files: $STATIC_CSS_COUNT"
    
    # Check contract files
    CONTRACT_COUNT=$(aws s3 ls "s3://$NEW_S3_BUCKET/contracts/" --recursive | wc -l)
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
    
    # Remove temporary files
    rm -f /tmp/bucket-policy.json /tmp/cors-policy.json /tmp/cloudfront-config.json
    
    print_success "Cleanup completed"
}

# Main deployment process
main() {
    echo ""
    print_status "🆕 Starting new S3 bucket deployment..."
    echo ""
    
    # Clean previous builds
    clean_previous_builds
    
    # Create new S3 bucket
    create_new_s3_bucket
    
    # Create build Dockerfile
    create_build_dockerfile
    
    # Build in Docker
    build_in_docker
    
    # Deploy to new S3 bucket
    deploy_to_new_s3
    
    # Update CloudFront origin (optional)
    update_cloudfront_origin
    
    # Verify deployment
    verify_deployment
    
    # Cleanup
    cleanup
    
    echo ""
    print_success "🆕 New S3 bucket deployment completed successfully!"
    echo ""
    print_status "New S3 bucket details:"
    echo "   Bucket name: $NEW_S3_BUCKET"
    echo "   Website URL: http://$NEW_S3_BUCKET.s3-website-us-east-1.amazonaws.com"
    echo "   S3 URL: https://$NEW_S3_BUCKET.s3.amazonaws.com"
    echo ""
    print_warning "IMPORTANT: You need to update your CloudFront distribution to point to the new bucket!"
    echo ""
    print_status "Next steps:"
    echo "   1. Update CloudFront origin to point to: $NEW_S3_BUCKET"
    echo "   2. Test the new bucket URL directly"
    echo "   3. Wait for CloudFront propagation"
    echo "   4. Test your application"
    echo ""
    print_success "Your application is now deployed to a completely fresh S3 bucket!"
}

# Run main function
main "$@"
