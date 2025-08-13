#!/bin/bash

echo "🔄 Updating Route53 records to point to new CloudFront distribution..."
echo "====================================================================="

NEW_DISTRIBUTION_DOMAIN="dz646qhm9c2az.cloudfront.net"
HOSTED_ZONE_ID="Z0381223PQQB7XHHRIQW"

echo "🌐 New CloudFront Domain: $NEW_DISTRIBUTION_DOMAIN"
echo "🏠 Hosted Zone ID: $HOSTED_ZONE_ID"

# Create the change batch for Route53
cat > route53-changes.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "productiveminer.org",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$NEW_DISTRIBUTION_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.productiveminer.org",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$NEW_DISTRIBUTION_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.productiveminer.org",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$NEW_DISTRIBUTION_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

echo "✅ Change batch file created: route53-changes.json"

echo ""
echo "🔧 Applying Route53 changes..."
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://route53-changes.json \
  --output json > route53-change-response.json

if [ $? -eq 0 ]; then
    CHANGE_ID=$(cat route53-change-response.json | jq -r '.ChangeInfo.Id')
    CHANGE_STATUS=$(cat route53-change-response.json | jq -r '.ChangeInfo.Status')
    
    echo "✅ Route53 changes submitted successfully!"
    echo "🆔 Change ID: $CHANGE_ID"
    echo "📊 Status: $CHANGE_STATUS"
    echo ""
    echo "📝 Next steps:"
    echo "1. Wait for DNS propagation (usually 5-10 minutes)"
    echo "2. Test the new distribution at: https://productiveminer.org"
    echo "3. Test the API at: https://api.productiveminer.org"
    echo "4. Once confirmed working, you can delete the old CloudFront distribution"
    echo ""
    echo "🔍 To check change status:"
    echo "   aws route53 get-change --id $CHANGE_ID"
else
    echo "❌ Failed to update Route53 records"
    cat route53-change-response.json
    exit 1
fi
