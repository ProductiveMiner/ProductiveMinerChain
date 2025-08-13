#!/bin/bash

# Create new CloudFront distribution to break cache issues
set -e

echo "=========================================="
echo "🌐 Creating New CloudFront Distribution"
echo "=========================================="

# Configuration
S3_BUCKET="productiveminer"
DOMAIN_NAME="productiveminer.org"

echo "📋 Creating new CloudFront distribution..."

# Create CloudFront distribution configuration
cat > new-cloudfront-config-fixed.json << EOF
{
  "CallerReference": "productiveminer-mined-token-$(date +%s)",
  "Comment": "ProductiveMiner with MINED Token Integration",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-productiveminer",
        "DomainName": "${S3_BUCKET}.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginPath": "",
        "CustomHeaders": {
          "Quantity": 0
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-productiveminer",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "TrustedKeyGroups": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      },
      "Headers": {
        "Quantity": 0
      },
      "QueryStringCacheKeys": {
        "Quantity": 0
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 0,
    "Compress": true,
    "LambdaFunctionAssociations": {
      "Quantity": 0
    },
    "FunctionAssociations": {
      "Quantity": 0
    },
    "FieldLevelEncryptionId": "",
    "SmoothStreaming": false,
    "AllowedMethods": {
      "Quantity": 7,
      "Items": [
        "HEAD",
        "DELETE",
        "POST",
        "GET",
        "OPTIONS",
        "PUT",
        "PATCH"
      ],
      "CachedMethods": {
        "Quantity": 2,
        "Items": [
          "HEAD",
          "GET"
        ]
      }
    }
  },
  "CacheBehaviors": {
    "Quantity": 0
  },
  "CustomErrorResponses": {
    "Quantity": 0
  },
  "Logging": {
    "Enabled": false,
    "IncludeCookies": false,
    "Bucket": "",
    "Prefix": ""
  },
  "PriceClass": "PriceClass_All",
  "Enabled": true,
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true,
    "MinimumProtocolVersion": "TLSv1",
    "CertificateSource": "cloudfront"
  },
  "Restrictions": {
    "GeoRestriction": {
      "RestrictionType": "none",
      "Quantity": 0
    }
  },
  "WebACLId": "",
  "HttpVersion": "http2",
  "IsIPV6Enabled": true
}
EOF

echo "🚀 Creating CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file://new-cloudfront-config-fixed.json --query 'Distribution.Id' --output text)

echo "✅ New CloudFront distribution created!"
echo "📋 Distribution ID: $DISTRIBUTION_ID"
echo "🌐 Domain: https://$DISTRIBUTION_ID.cloudfront.net"

# Save distribution info
cat > new-cloudfront-info.txt << EOF
New CloudFront Distribution Created
==================================
Distribution ID: $DISTRIBUTION_ID
Domain: https://$DISTRIBUTION_ID.cloudfront.net
S3 Bucket: $S3_BUCKET
Created: $(date)
Purpose: Break cache issues for MINED token integration
EOF

echo ""
echo "📝 Distribution info saved to: new-cloudfront-info.txt"
echo ""
echo "⏳ Distribution is being deployed..."
echo "🌐 You can access your site at: https://$DISTRIBUTION_ID.cloudfront.net"
echo ""
echo "🔧 Next steps:"
echo "1. Test the new distribution: https://$DISTRIBUTION_ID.cloudfront.net"
echo "2. Test MINED token page: https://$DISTRIBUTION_ID.cloudfront.net/token"
echo "3. Once confirmed working, update DNS to point to new distribution"
