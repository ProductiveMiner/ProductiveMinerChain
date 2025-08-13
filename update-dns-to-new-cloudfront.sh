#!/bin/bash

# Update DNS to point to new CloudFront distribution
set -e

echo "=========================================="
echo "🌐 Updating DNS to New CloudFront Distribution"
echo "=========================================="

# Configuration
NEW_DISTRIBUTION_ID="E1V33BV296V552"
DOMAIN_NAME="productiveminer.org"
HOSTED_ZONE_ID="Z1234567890ABC" # You'll need to replace this with your actual hosted zone ID

echo "📋 Getting CloudFront distribution domain..."
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $NEW_DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)

echo "🌐 CloudFront Domain: $CLOUDFRONT_DOMAIN"

# Create Route53 change batch
cat > route53-change.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN_NAME",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CLOUDFRONT_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.$DOMAIN_NAME",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CLOUDFRONT_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

echo "📝 Route53 change batch created: route53-change.json"
echo ""
echo "🔧 To apply DNS changes, run:"
echo "aws route53 change-resource-record-sets --hosted-zone-id YOUR_HOSTED_ZONE_ID --change-batch file://route53-change.json"
echo ""
echo "📋 You can find your hosted zone ID with:"
echo "aws route53 list-hosted-zones --query 'HostedZones[?Name==\`$DOMAIN_NAME.\`].Id' --output text"
echo ""
echo "🌐 New CloudFront URL: https://$CLOUDFRONT_DOMAIN"
echo "🪙 MINED Token Page: https://$CLOUDFRONT_DOMAIN/token"
