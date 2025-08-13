#!/bin/bash

echo "🚀 Redeploying Backend with New Contract Addresses"
echo "=================================================="

       # New contract addresses (CORRECTED)
       NEW_CONTRACT_ADDRESS="0xB576afEfB7C466B0146ee81A9256a3DE1ACF2146"
       NEW_TOKEN_ADDRESS="0xC46C90F37B83868fA46A3653daf3C3b49a4f1604"

echo "📋 New Contract Addresses:"
echo "   ProductiveMinerFixed: $NEW_CONTRACT_ADDRESS"
echo "   MINEDTokenFixed: $NEW_TOKEN_ADDRESS"
echo ""

# Build and push new Docker image for linux/amd64 platform
echo "🔨 Building new Docker image for linux/amd64 platform..."
cd backend
docker build --platform linux/amd64 -t productiveminer-backend:latest .

echo "📤 Pushing to ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 036160411444.dkr.ecr.us-east-1.amazonaws.com
docker tag productiveminer-backend:latest 036160411444.dkr.ecr.us-east-1.amazonaws.com/productiveminer-backend:latest
docker push 036160411444.dkr.ecr.us-east-1.amazonaws.com/productiveminer-backend:latest

cd ..

# Create new task definition with updated environment variables
echo "📝 Creating new task definition..."
cat > updated-task-definition.json << EOF
{
    "family": "productiveminer-backend",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "arn:aws:iam::036160411444:role/ecsTaskExecutionRole",
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
                    "name": "PORT",
                    "value": "3000"
                },
                {
                    "name": "NODE_ENV",
                    "value": "production"
                },
                {
                    "name": "DATABASE_URL",
                    "value": "postgresql://productiveminer:productiveminer123@productiveminer-pg.c0lmo082cafp.us-east-1.rds.amazonaws.com:5432/productiveminer"
                },
                {
                    "name": "REDIS_URL",
                    "value": "redis://productiveminer-redis.cqj8k8k8k8k8.us-east-1.cache.amazonaws.com:6379"
                },
                {
                    "name": "JWT_SECRET",
                    "value": "your-super-secret-jwt-key-change-this-in-production"
                },
                {
                    "name": "CORS_ORIGIN",
                    "value": "https://productiveminer.org"
                },
                {
                    "name": "DEFAULT_DIFFICULTY",
                    "value": "25"
                },
                {
                    "name": "CONTRACT_ADDRESS",
                    "value": "$NEW_CONTRACT_ADDRESS"
                },
                {
                    "name": "TOKEN_ADDRESS",
                    "value": "$NEW_TOKEN_ADDRESS"
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
                    "awslogs-region": "us-east-1",
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

# Register new task definition
echo "📋 Registering new task definition..."
aws ecs register-task-definition --cli-input-json file://updated-task-definition.json

# Get the new task definition revision
NEW_REVISION=$(aws ecs describe-task-definition --task-definition productiveminer-backend --query 'taskDefinition.revision' --output text)
echo "✅ New task definition revision: $NEW_REVISION"

# Update the service to use the new task definition
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster productiveminer-cluster \
    --service productiveminer-backend-api \
    --task-definition productiveminer-backend:$NEW_REVISION

echo "⏳ Waiting for service to stabilize..."
aws ecs wait services-stable \
    --cluster productiveminer-cluster \
    --services productiveminer-backend-api

echo "✅ Backend redeployment complete!"
echo ""
echo "🔍 Verifying new addresses..."
sleep 10

# Test the health endpoint
echo "📊 Health check:"
curl -s https://api.productiveminer.org/api/contract/health | jq .

echo ""
echo "🎉 Backend successfully redeployed with new contract addresses!"
