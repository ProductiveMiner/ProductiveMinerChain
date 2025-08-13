#!/bin/bash

# ProductiveMiner Complete Redeployment Script
# Fixes database issues and ensures Linux compatibility

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
ECR_REPO="036160411444.dkr.ecr.us-east-1.amazonaws.com/productiveminer-backend"
CLUSTER_NAME="productiveminer-cluster"
SERVICE_NAME="productiveminer-backend-api"
S3_BUCKET="productiveminer-org-1754678214"

echo -e "${BLUE}🚀 ProductiveMiner Complete Redeployment${NC}"
echo "=========================================="
echo -e "${YELLOW}This script will:${NC}"
echo "1. Fix database connectivity issues"
echo "2. Redeploy backend with Linux compatibility"
echo "3. Redeploy frontend to S3"
echo "4. Test all endpoints"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Step 1: Fix Database Configuration
echo -e "${BLUE}📊 Step 1: Fixing Database Configuration${NC}"
echo "=============================================="

# Check current database configuration
print_status "Checking current database configuration..."

# Create updated task definition with proper database configuration
cat > task-definition-fixed.json << EOF
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
      "image": "${ECR_REPO}:latest",
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
          "value": "postgresql://productiveminer:changeme123@productiveminer-pg.c0lmo082cafp.us-east-1.rds.amazonaws.com:5432/productiveminer_db"
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

print_status "Created updated task definition with proper database configuration"

# Step 2: Build and Deploy Backend
echo -e "${BLUE}🔧 Step 2: Building and Deploying Backend${NC}"
echo "=============================================="

# Build Docker image with Linux compatibility
print_status "Building Docker image with Linux compatibility..."

# Create a Linux-compatible Dockerfile
cat > backend/Dockerfile.linux << EOF
FROM node:18-alpine

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/server.js"]
EOF

# Build the image
cd backend
docker build -f Dockerfile.linux -t ${ECR_REPO}:latest .

# Login to ECR
print_status "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO}

# Push the image
print_status "Pushing image to ECR..."
docker push ${ECR_REPO}:latest

cd ..

# Register new task definition
print_status "Registering new task definition..."
TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file://task-definition-fixed.json --query 'taskDefinition.taskDefinitionArn' --output text)
print_status "Task definition registered: ${TASK_DEF_ARN}"

# Update the service
print_status "Updating ECS service..."
aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service ${SERVICE_NAME} \
  --task-definition ${TASK_DEF_ARN} \
  --force-new-deployment

# Wait for deployment to complete
print_status "Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster ${CLUSTER_NAME} \
  --services ${SERVICE_NAME}

print_status "Backend deployment completed!"

# Step 3: Build and Deploy Frontend
echo -e "${BLUE}🌐 Step 3: Building and Deploying Frontend${NC}"
echo "=============================================="

# Build frontend
print_status "Building frontend..."
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Sync to S3
print_status "Deploying to S3..."
aws s3 sync build/ s3://${S3_BUCKET} --delete

# Invalidate CloudFront cache
print_status "Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'productiveminer.org')]].Id" --output text)
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"

cd ..

print_status "Frontend deployment completed!"

# Step 4: Test Endpoints
echo -e "${BLUE}🧪 Step 4: Testing Endpoints${NC}"
echo "================================"

# Wait a moment for services to stabilize
sleep 30

# Get the ALB URL
print_status "Getting ALB URL..."
ALB_URL=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `productiveminer`)].DNSName' --output text)

if [ -n "$ALB_URL" ]; then
    print_status "Testing backend endpoints..."
    
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
    
    # Test frontend
    print_status "Testing frontend..."
    if curl -f -s "https://productiveminer.org" > /dev/null; then
        print_status "✅ Frontend accessible"
    else
        print_error "❌ Frontend not accessible"
    fi
else
    print_warning "Could not determine ALB URL"
fi

# Step 5: Database Connection Test
echo -e "${BLUE}🗄️ Step 5: Testing Database Connection${NC}"
echo "=========================================="

# Create a database test script
cat > test-database-connection.js << EOF
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://productiveminer:changeme123@productiveminer-pg.c0lmo082cafp.us-east-1.rds.amazonaws.com:5432/productiveminer_db',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connection successful');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].db_version);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
EOF

print_status "Testing database connection..."
node test-database-connection.js

# Step 6: Final Status Check
echo -e "${BLUE}📋 Step 6: Final Status Check${NC}"
echo "================================"

print_status "Checking ECS service status..."
aws ecs describe-services \
  --cluster ${CLUSTER_NAME} \
  --services ${SERVICE_NAME} \
  --query 'services[0].{status:status,desiredCount:desiredCount,runningCount:runningCount,pendingCount:pendingCount}' \
  --output table

print_status "Checking S3 bucket contents..."
aws s3 ls s3://${S3_BUCKET} --recursive --human-readable --summarize | tail -5

echo ""
echo -e "${GREEN}🎉 Redeployment Complete!${NC}"
echo "================================"
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test the frontend at https://productiveminer.org"
echo "2. Check that data is now displaying correctly"
echo "3. Test mining functionality"
echo "4. Monitor CloudWatch logs for any issues"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "• View backend logs: aws logs tail /ecs/productiveminer-backend --follow"
echo "• Check ECS status: aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME}"
echo "• Test endpoints: curl https://api.productiveminer.org/api/health"
echo ""

# Cleanup
rm -f task-definition-fixed.json test-database-connection.js
rm -f backend/Dockerfile.linux

print_status "Cleanup completed"
