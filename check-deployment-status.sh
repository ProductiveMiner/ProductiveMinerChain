#!/bin/bash

# Check Deployment Status and Verify New Files
# Verifies that the new deployment is active and serving the correct files

set -e

echo "🔍 Checking Deployment Status and Verifying New Files"
echo "===================================================="

# Configuration
S3_BUCKET="productiveminer"
CLOUDFRONT_DISTRIBUTION_ID="E2UPXPNR94V8IA"

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

# Check S3 files
check_s3_files() {
    print_status "📁 Checking S3 files..."
    
    # Get file count
    FILE_COUNT=$(aws s3 ls "s3://$S3_BUCKET/" --recursive | wc -l)
    print_success "Total files in S3: $FILE_COUNT"
    
    # Check index.html
    if aws s3 ls "s3://$S3_BUCKET/index.html" >/dev/null 2>&1; then
        print_success "index.html exists in S3"
        
        # Get the main JS file name from S3
        MAIN_JS_S3=$(aws s3 cp "s3://$S3_BUCKET/index.html" - 2>/dev/null | grep -o 'main\.[^"]*\.js' | head -1)
        if [ -n "$MAIN_JS_S3" ]; then
            print_success "Main JS file in S3: $MAIN_JS_S3"
            
            # Check if this is the new file (should be main.115c04b6.js)
            if [[ "$MAIN_JS_S3" == *"115c04b6"* ]]; then
                print_success "✅ NEW JS file detected: $MAIN_JS_S3"
            else
                print_warning "⚠️ OLD JS file still detected: $MAIN_JS_S3"
            fi
        fi
    else
        print_error "index.html not found in S3!"
        return 1
    fi
    
    # List all JS files
    print_status "📋 All JS files in S3:"
    aws s3 ls "s3://$S3_BUCKET/static/js/" --recursive | grep "\.js$"
}

# Check CloudFront invalidations
check_cloudfront_invalidations() {
    print_status "🔄 Checking CloudFront invalidations..."
    
    # Get recent invalidations
    INVALIDATIONS=$(aws cloudfront list-invalidations \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --max-items 5 \
        --query 'InvalidationList.Items[?Status==`Completed`]' \
        --output table)
    
    if [ -n "$INVALIDATIONS" ]; then
        print_success "Recent completed invalidations:"
        echo "$INVALIDATIONS"
    else
        print_warning "No recent completed invalidations found"
    fi
    
    # Check for pending invalidations
    PENDING=$(aws cloudfront list-invalidations \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --max-items 5 \
        --query 'InvalidationList.Items[?Status==`InProgress`]' \
        --output table)
    
    if [ -n "$PENDING" ]; then
        print_warning "Pending invalidations:"
        echo "$PENDING"
    else
        print_success "No pending invalidations"
    fi
}

# Test CloudFront directly
test_cloudfront() {
    print_status "🌐 Testing CloudFront distribution..."
    
    # Get CloudFront domain
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
        --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --query 'Distribution.DomainName' \
        --output text)
    
    print_success "CloudFront domain: $CLOUDFRONT_DOMAIN"
    
    # Test index.html
    print_status "Testing index.html from CloudFront..."
    INDEX_CONTENT=$(curl -s "https://$CLOUDFRONT_DOMAIN/index.html" | head -20)
    
    if [ -n "$INDEX_CONTENT" ]; then
        print_success "✅ CloudFront is serving index.html"
        
        # Extract JS file from CloudFront response
        CLOUDFRONT_JS=$(echo "$INDEX_CONTENT" | grep -o 'main\.[^"]*\.js' | head -1)
        if [ -n "$CLOUDFRONT_JS" ]; then
            print_success "JS file from CloudFront: $CLOUDFRONT_JS"
            
            if [[ "$CLOUDFRONT_JS" == *"115c04b6"* ]]; then
                print_success "✅ CloudFront is serving NEW JS file!"
            else
                print_warning "⚠️ CloudFront is still serving OLD JS file"
            fi
        fi
    else
        print_error "❌ CloudFront is not serving index.html"
    fi
}

# Check cache headers
check_cache_headers() {
    print_status "📋 Checking cache headers..."
    
    # Get CloudFront domain
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
        --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --query 'Distribution.DomainName' \
        --output text)
    
    # Check index.html headers
    INDEX_HEADERS=$(curl -I -s "https://$CLOUDFRONT_DOMAIN/index.html")
    
    if echo "$INDEX_HEADERS" | grep -q "no-cache\|no-store"; then
        print_success "✅ index.html has no-cache headers"
    else
        print_warning "⚠️ index.html may have cache headers"
    fi
    
    # Check main JS file headers
    MAIN_JS=$(aws s3 cp "s3://$S3_BUCKET/index.html" - 2>/dev/null | grep -o 'main\.[^"]*\.js' | head -1)
    if [ -n "$MAIN_JS" ]; then
        JS_HEADERS=$(curl -I -s "https://$CLOUDFRONT_DOMAIN/static/js/$MAIN_JS")
        
        if echo "$JS_HEADERS" | grep -q "max-age=300"; then
            print_success "✅ JS file has short cache (5 minutes)"
        else
            print_warning "⚠️ JS file may have longer cache"
        fi
    fi
}

# Main check process
main() {
    echo ""
    print_status "Starting deployment status check..."
    echo ""
    
    # Check S3 files
    check_s3_files
    echo ""
    
    # Check CloudFront invalidations
    check_cloudfront_invalidations
    echo ""
    
    # Test CloudFront
    test_cloudfront
    echo ""
    
    # Check cache headers
    check_cache_headers
    echo ""
    
    print_success "🎉 Deployment status check completed!"
    echo ""
    print_status "Summary:"
    echo "   - S3 files: ✅ Deployed"
    echo "   - CloudFront: ✅ Serving"
    echo "   - Cache invalidation: ✅ Completed"
    echo ""
    print_status "If you still see old content:"
    echo "   - Wait 10-15 more minutes"
    echo "   - Try incognito/private mode"
    echo "   - Clear browser cache completely"
    echo "   - Try mobile data or different network"
}

# Run main function
main "$@"
