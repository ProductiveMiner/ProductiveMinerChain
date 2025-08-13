#!/bin/bash

# NUCLEAR DEPLOY: Complete S3 Bucket Wipe and Fresh Deployment
# This script completely destroys and recreates the S3 deployment

set -e

echo "☢️ NUCLEAR DEPLOY: Complete S3 Bucket Wipe and Fresh Deployment"
echo "==============================================================="

# Configuration
S3_BUCKET="productiveminer"
CLOUDFRONT_DISTRIBUTION_ID="E2UPXPNR94V8IA"
FRONTEND_DIR="frontend"
BUILD_DIR="frontend/build"

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

# Nuclear clean - destroy everything
nuclear_clean() {
    print_status "☢️ NUCLEAR CLEANING - DESTROYING EVERYTHING..."
    
    # Clean frontend build
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        print_success "Build directory destroyed"
    fi
    
    # Clean node_modules
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        rm -rf "$FRONTEND_DIR/node_modules"
        print_success "node_modules destroyed"
    fi
    
    # Clean npm cache
    npm cache clean --force
    print_success "npm cache destroyed"
    
    # Remove package-lock
    if [ -f "$FRONTEND_DIR/package-lock.json" ]; then
        rm "$FRONTEND_DIR/package-lock.json"
        print_success "package-lock.json destroyed"
    fi
    
    # Clean any other build artifacts
    find . -name "*.log" -delete 2>/dev/null || true
    find . -name ".DS_Store" -delete 2>/dev/null || true
    print_success "Build artifacts destroyed"
}

# Nuclear S3 wipe - completely empty the bucket
nuclear_s3_wipe() {
    print_status "☢️ NUCLEAR S3 WIPE - COMPLETELY EMPTYING BUCKET..."
    
    # List all objects first
    print_status "Listing all objects in bucket..."
    aws s3 ls "s3://$S3_BUCKET/" --recursive
    
    # Delete ALL objects and versions
    print_status "Deleting ALL objects and versions..."
    aws s3 rm "s3://$S3_BUCKET/" --recursive
    
    # Delete all versions if versioning is enabled
    print_status "Deleting all object versions..."
    aws s3api list-object-versions --bucket "$S3_BUCKET" --query 'Versions[].{Key:Key,VersionId:VersionId}' --output text | while read -r key version; do
        if [ -n "$key" ] && [ -n "$version" ]; then
            aws s3api delete-object --bucket "$S3_BUCKET" --key "$key" --version-id "$version"
        fi
    done
    
    # Delete all delete markers
    print_status "Deleting all delete markers..."
    aws s3api list-object-versions --bucket "$S3_BUCKET" --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output text | while read -r key version; do
        if [ -n "$key" ] && [ -n "$version" ]; then
            aws s3api delete-object --bucket "$S3_BUCKET" --key "$key" --version-id "$version"
        fi
    done
    
    print_success "S3 bucket completely wiped"
}

# Fresh dependency install
fresh_install() {
    print_status "📦 FRESH DEPENDENCY INSTALL..."
    cd "$FRONTEND_DIR"
    
    # Force clean install
    npm install --no-optional --no-audit --no-fund --production=false --force
    
    cd ..
    print_success "Fresh dependencies installed"
}

# Build with maximum cache busting
build_with_maximum_bust() {
    print_status "🔨 BUILDING WITH MAXIMUM CACHE BUSTING..."
    cd "$FRONTEND_DIR"
    
    # Set environment variables for maximum cache busting
    export NODE_ENV=production
    export GENERATE_SOURCEMAP=false
    export REACT_APP_BUILD_TIME=$(date +%s)
    export REACT_APP_VERSION=$(date +%Y%m%d%H%M%S)
    export REACT_APP_PLATFORM="linux-amd64"
    export REACT_APP_DEPLOY_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export REACT_APP_NUCLEAR_DEPLOY="true"
    export REACT_APP_CACHE_BUST=$(openssl rand -hex 8)
    
    # Build with maximum cache busting
    npm run build-force-new
    
    cd ..
    
    # Verify build
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build failed!"
        exit 1
    fi
    
    print_success "Build completed with maximum cache busting"
}

# Deploy with nuclear cache control
nuclear_deploy() {
    print_status "☢️ NUCLEAR DEPLOY WITH MAXIMUM CACHE CONTROL..."
    
    # Sync with nuclear cache control
    aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" \
        --delete \
        --cache-control "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" \
        --metadata-directive REPLACE \
        --content-type "text/html" \
        --content-encoding "gzip"
    
    print_success "Files synced with nuclear cache control"
    
    # Set nuclear cache headers for all files
    print_status "🔧 Setting nuclear cache headers for all files..."
    
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
    
    print_success "Nuclear cache headers set for all files"
}

# Nuclear CloudFront invalidation
nuclear_cloudfront_invalidation() {
    print_status "☢️ NUCLEAR CLOUDFRONT INVALIDATION..."
    
    # Create invalidation for ALL paths
    print_status "   Creating nuclear invalidation for ALL paths..."
    INVALIDATION_1=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "Nuclear invalidation created: $INVALIDATION_1"
    
    # Create additional invalidations for specific paths
    print_status "   Creating additional invalidations..."
    
    # Static files
    INVALIDATION_2=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/static/*" "/index.html" "/manifest.json" "/asset-manifest.json" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "Static files invalidation: $INVALIDATION_2"
    
    # Contract files
    INVALIDATION_3=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/contracts/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "Contract files invalidation: $INVALIDATION_3"
    
    # Wait for all invalidations to complete
    print_status "⏳ Waiting for all nuclear invalidations to complete..."
    
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_1"
    
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_2"
    
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$INVALIDATION_3"
    
    print_success "All nuclear CloudFront invalidations completed"
}

# Verify nuclear deployment
verify_nuclear_deployment() {
    print_status "🔍 Verifying nuclear deployment..."
    
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

# Main nuclear deployment process
main() {
    echo ""
    print_warning "☢️ WARNING: This is a NUCLEAR deployment that will completely wipe your S3 bucket!"
    echo ""
    read -p "Are you sure you want to proceed? Type 'NUCLEAR' to confirm: " -r
    echo
    
    if [[ $REPLY != "NUCLEAR" ]]; then
        print_error "Nuclear deployment cancelled."
        exit 1
    fi
    
    print_status "☢️ Starting NUCLEAR deployment..."
    echo ""
    
    # Nuclear clean everything
    nuclear_clean
    
    # Nuclear S3 wipe
    nuclear_s3_wipe
    
    # Fresh install
    fresh_install
    
    # Build with maximum cache busting
    build_with_maximum_bust
    
    # Nuclear deploy
    nuclear_deploy
    
    # Nuclear CloudFront invalidation
    nuclear_cloudfront_invalidation
    
    # Verify nuclear deployment
    verify_nuclear_deployment
    
    echo ""
    print_success "☢️ NUCLEAR DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo ""
    print_warning "IMPORTANT: This was a NUCLEAR deployment with complete cache destruction."
    echo ""
    print_status "Next steps:"
    echo "   1. Wait 15-30 minutes for global cache propagation"
    echo "   2. Test in incognito/private browser mode"
    echo "   3. Clear ALL browser cache completely"
    echo "   4. Try different browsers/devices"
    echo "   5. Try mobile data or different network"
    echo "   6. Use a VPN to test from different locations"
    echo ""
    print_status "If you still see old content after 30 minutes:"
    echo "   - Contact AWS support about CloudFront cache issues"
    echo "   - Check if there are any CDN edge locations with persistent cache"
    echo "   - Consider creating a new CloudFront distribution"
    echo ""
    print_success "Your application should now be completely fresh!"
}

# Run main function
main "$@"
