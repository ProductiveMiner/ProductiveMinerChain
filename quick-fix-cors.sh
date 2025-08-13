#!/bin/bash

echo "🔧 Quick CORS Fix"
echo "================="

# Configuration
CLOUDFRONT_DISTRIBUTION_ID="E2UPXPNR94V8IA"
S3_BUCKET="productiveminer-org-1754678214"

echo "📋 Issue: API returning HTML instead of JSON"
echo ""

echo "🔄 Step 1: Force CloudFront cache invalidation..."
aws cloudfront create-invalidation \
  --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
  --paths "/api/*" "/index.html"

echo ""
echo "🔄 Step 2: Test API endpoints..."
echo "Testing API health endpoint..."
curl -f -s "https://api.productiveminer.org/api/health" | head -3

echo ""
echo "Testing dashboard endpoint..."
curl -f -s "https://api.productiveminer.org/api/stats/dashboard" | head -3

echo ""
echo "🔄 Step 3: Test frontend..."
echo "Testing frontend accessibility..."
curl -f -s "https://productiveminer.org" | grep -o 'main\.[a-zA-Z0-9]*\.js'

echo ""
echo "✅ Quick Fix Applied!"
echo ""
echo "🔧 Next Steps:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Hard refresh (Ctrl+Shift+R)"
echo "3. Try incognito/private window"
echo "4. Test the site again"
echo ""
echo "🚀 If the API is still returning HTML, the issue is with CloudFront routing."
