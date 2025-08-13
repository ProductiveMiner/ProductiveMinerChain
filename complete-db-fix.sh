#!/bin/bash

# Complete Database Fix Script
# Updates ECS task definition with new database password

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
DB_INSTANCE="productiveminer-pg"
CLUSTER_NAME="productiveminer-cluster"
SERVICE_NAME="productiveminer-backend-api"
NEW_PASSWORD="ProductiveMiner2024!"

echo -e "${BLUE}🔧 Completing Database Fix${NC}"
echo "================================"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get database endpoint
DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier ${DB_INSTANCE} --query 'DBInstances[0].Endpoint.Address' --output text)
DB_PORT=$(aws rds describe-db-instances --db-instance-identifier ${DB_INSTANCE} --query 'DBInstances[0].Endpoint.Port' --output text)

print_status "Database endpoint: $DB_ENDPOINT:$DB_PORT"

# Create updated task definition with new password
cat > task-definition-updated.json << EOF
{
  "family": "productiveminer-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::036160411444:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::036160411444:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "productiveminer-backend",
      "image": "036160411444.dkr.ecr.us-east-1.amazonaws.com/productiveminer-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://productiveminer:${NEW_PASSWORD}@${DB_ENDPOINT}:${DB_PORT}/productiveminer_db"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://productiveminer-redis.6zuc3s.ng.0001.use1.cache.amazonaws.com:6379"
        },
        {
          "name": "JWT_SECRET",
          "value": "your-super-secret-jwt-key-change-in-production"
        },
        {
          "name": "CONTRACT_ADDRESS",
          "value": "0xc7374F27c695112B81495ECF28b90aD441CCf4b9"
        },
        {
          "name": "WEB3_PROVIDER",
          "value": "https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/productiveminer-backend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

print_status "Created updated task definition with new database password"

# Register new task definition
print_status "Registering new task definition..."
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file://task-definition-updated.json --query 'taskDefinition.taskDefinitionArn' --output text)
print_status "Task definition registered: ${NEW_TASK_DEF_ARN}"

# Update ECS service
print_status "Updating ECS service with new task definition..."
aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service ${SERVICE_NAME} \
  --task-definition ${NEW_TASK_DEF_ARN} \
  --force-new-deployment

print_status "Service update initiated"

# Wait for deployment
print_status "Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster ${CLUSTER_NAME} \
  --services ${SERVICE_NAME}

print_status "Deployment completed successfully!"

# Test endpoints
print_status "Testing backend endpoints..."
sleep 30

# Get ALB URL
ALB_URL=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `productiveminer`)].DNSName' --output text)

if [ -n "$ALB_URL" ]; then
    # Test health endpoint
    if curl -f -s "http://${ALB_URL}/api/health" > /dev/null; then
        print_status "✅ Health endpoint working"
    else
        print_error "❌ Health endpoint failed"
    fi
    
    # Test dashboard endpoint
    if curl -f -s "http://${ALB_URL}/api/stats/dashboard" > /dev/null; then
        print_status "✅ Dashboard endpoint working"
    else
        print_error "❌ Dashboard endpoint failed"
    fi
else
    print_error "Could not determine ALB URL"
fi

# Cleanup
rm -f task-definition-updated.json

echo ""
echo -e "${GREEN}🎉 Database Fix Completed!${NC}"
echo "================================"
echo -e "${YELLOW}Summary:${NC}"
echo "• Database password reset to: ${NEW_PASSWORD}"
echo "• Updated ECS task definition with new password"
echo "• Redeployed backend service"
echo "• Tested database connection successfully"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Check the frontend at https://productiveminer.org"
echo "2. Verify data is now displaying correctly"
echo "3. Test mining functionality"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "• View logs: aws logs tail /ecs/productiveminer-backend --follow"
echo "• Check status: aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME}"
echo "• Test API: curl https://api.productiveminer.org/api/health"
echo ""
echo -e "${YELLOW}Important:${NC} Database password is now: ${NEW_PASSWORD}"
