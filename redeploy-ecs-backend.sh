#!/bin/bash

# ECS Backend Redeployment Script
# This script redeploys the backend with updated contract addresses

set -e

echo "🚀 ECS Backend Redeployment with Fixed Contracts"
echo "================================================"

# Configuration
CLUSTER_NAME="productiveminer-cluster"
SERVICE_NAME="productiveminer-backend-api"
TASK_DEFINITION_NAME="productiveminer-backend"
ECR_REPOSITORY="productiveminer-backend"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY"

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

# Build and push Docker image
build_and_push_image() {
    print_status "🔨 Building Docker image..."
    
    # Ensure Docker buildx is available
    print_status "🔧 Setting up Docker buildx for cross-platform builds..."
    docker buildx create --use --name multiarch-builder || true
    
    cd backend
    
    # Ensure ECR repository exists
    print_status "🔍 Checking ECR repository..."
    aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $REGION 2>/dev/null || {
        print_status "Creating ECR repository..."
        aws ecr create-repository --repository-name $ECR_REPOSITORY --region $REGION
    }
    
    # Get ECR login token
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI
    
    # Build the image for Linux platform (required for ECS)
    docker buildx build --platform linux/amd64 -f Dockerfile.linux -t $ECR_URI:latest .
    
    # Push the image
    docker push $ECR_URI:latest
    
    cd ..
    
    print_success "Docker image built and pushed"
}

# Create new task definition
create_new_task_definition() {
    print_status "📋 Creating new task definition..."
    
    # Get the current task definition
    print_status "Getting current task definition: $TASK_DEFINITION_NAME"
    CURRENT_TASK_DEF=$(aws ecs describe-task-definition --task-definition $TASK_DEFINITION_NAME --region $REGION)
    
    # Extract the current task definition (without the taskDefinitionArn and revision)
    TASK_DEF=$(echo $CURRENT_TASK_DEF | jq '.taskDefinition | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')
    
    # Update the image URI to use the latest tag
    UPDATED_TASK_DEF=$(echo $TASK_DEF | jq --arg IMAGE "$ECR_URI:latest" '.containerDefinitions[0].image = $IMAGE')
    
    print_status "Updated image URI: $ECR_URI:latest"
    
    # Save the updated task definition to a temporary file
    echo "$UPDATED_TASK_DEF" > /tmp/updated-task-definition.json
    
    # Register the new task definition
    print_status "Registering new task definition..."
    NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file:///tmp/updated-task-definition.json --region $REGION --query 'taskDefinition.taskDefinitionArn' --output text)
    
    # Clean up temporary file
    rm -f /tmp/updated-task-definition.json
    
    print_success "New task definition created: $NEW_TASK_DEF_ARN"
    echo $NEW_TASK_DEF_ARN
}

# Update ECS service
update_ecs_service() {
    print_status "🔄 Updating ECS service..."
    
    NEW_TASK_DEF_ARN=$1
    
    # Update the service with the new task definition
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $NEW_TASK_DEF_ARN \
        --region $REGION
    
    print_success "ECS service updated"
}

# Wait for deployment to complete
wait_for_deployment() {
    print_status "⏳ Waiting for deployment to complete..."
    
    # Wait for the service to reach steady state
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION
    
    print_success "Deployment completed successfully"
}

# Verify deployment
verify_deployment() {
    print_status "🔍 Verifying deployment..."
    
    # Get service status
    SERVICE_STATUS=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --query 'services[0].status' \
        --output text)
    
    # Get running count
    RUNNING_COUNT=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --query 'services[0].runningCount' \
        --output text)
    
    # Get desired count
    DESIRED_COUNT=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --query 'services[0].desiredCount' \
        --output text)
    
    print_status "Service Status: $SERVICE_STATUS"
    print_status "Running Tasks: $RUNNING_COUNT"
    print_status "Desired Tasks: $DESIRED_COUNT"
    
    if [ "$SERVICE_STATUS" = "ACTIVE" ] && [ "$RUNNING_COUNT" = "$DESIRED_COUNT" ]; then
        print_success "Deployment verification successful"
    else
        print_error "Deployment verification failed"
        exit 1
    fi
}

# Test backend connectivity
test_backend() {
    print_status "🧪 Testing backend connectivity..."
    
    # Get the ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --region $REGION \
        --query 'LoadBalancers[?contains(LoadBalancerName, `productiveminer`)].DNSName' \
        --output text)
    
    if [ -n "$ALB_DNS" ]; then
        print_status "Testing backend at: http://$ALB_DNS"
        
        # Test health endpoint
        HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://$ALB_DNS/health" || echo "000")
        
        if [ "$HEALTH_RESPONSE" = "200" ]; then
            print_success "Backend health check passed"
        else
            print_warning "Backend health check returned: $HEALTH_RESPONSE"
        fi
        
        # Test contract info endpoint
        CONTRACT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://$ALB_DNS/api/contract/info" || echo "000")
        
        if [ "$CONTRACT_RESPONSE" = "200" ]; then
            print_success "Contract info endpoint working"
        else
            print_warning "Contract info endpoint returned: $CONTRACT_RESPONSE"
        fi
    else
        print_warning "Could not find ALB DNS name"
    fi
}

# Main deployment process
main() {
    echo ""
    print_status "Starting ECS backend redeployment with fixed contracts..."
    echo ""
    
    # Build and push Docker image
    build_and_push_image
    
    # Create new task definition
    NEW_TASK_DEF_ARN=$(create_new_task_definition)
    
    if [ -z "$NEW_TASK_DEF_ARN" ]; then
        print_error "Failed to create new task definition"
        exit 1
    fi
    
    print_status "New task definition ARN: $NEW_TASK_DEF_ARN"
    
    # Update ECS service
    update_ecs_service $NEW_TASK_DEF_ARN
    
    # Wait for deployment to complete
    wait_for_deployment
    
    # Verify deployment
    verify_deployment
    
    # Test backend
    test_backend
    
    echo ""
    print_success "🚀 ECS Backend Redeployment Completed Successfully!"
    echo ""
    print_status "Updated Contract Addresses:"
    echo "   ProductiveMinerFixed: 0xf58fA04DC5E087991EdC6f4ADEF1F87814f9F68b"
    echo "   MINEDTokenFixed: 0x1a963782dB0e5502defb04d662B7031FaB9e15E2"
    echo ""
    print_status "Backend is now using the fixed contracts with proper MINED token integration!"
}

# Run main function
main "$@"
