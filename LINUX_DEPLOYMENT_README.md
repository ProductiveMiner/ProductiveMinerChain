# ProductiveMiner Linux-Compatible Deployment Guide

This guide provides comprehensive instructions for deploying the ProductiveMiner frontend to AWS S3 with Linux compatibility.

## 🚀 Quick Start

### Option 1: Quick S3 Deployment (Recommended for most cases)
```bash
./quick-s3-deploy.sh
```

### Option 2: Full Deployment (S3 + Docker)
```bash
./deploy-full-linux.sh
```

### Option 3: S3 Only with Full Verification
```bash
./redeploy-s3-linux.sh
```

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **AWS CLI** (v2 or higher)
- **Docker** (optional, for container deployment)

### Installation Guides
- **Node.js**: https://nodejs.org/
- **AWS CLI**: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- **Docker**: https://docs.docker.com/get-docker/

### AWS Configuration
Ensure your AWS CLI is configured with appropriate credentials:
```bash
aws configure
```

Required permissions:
- S3: Full access to `productiveminer` bucket
- CloudFront: Create invalidations for distribution `E2UPXPNR94V8IA`

## 🔧 Deployment Scripts

### 1. `quick-s3-deploy.sh`
**Purpose**: Rapid deployment for development and testing
**Features**:
- Clean build with cache busting
- S3 sync with deletion of old files
- CloudFront cache invalidation
- Minimal verification

**Usage**:
```bash
./quick-s3-deploy.sh
```

### 2. `redeploy-s3-linux.sh`
**Purpose**: Comprehensive S3 deployment with full verification
**Features**:
- Pre-flight dependency checks
- Clean dependency installation
- Build verification
- Proper cache headers for different file types
- CloudFront invalidation with wait
- Deployment verification

**Usage**:
```bash
./redeploy-s3-linux.sh
```

### 3. `deploy-full-linux.sh`
**Purpose**: Full deployment including Docker container
**Features**:
- All features from `redeploy-s3-linux.sh`
- Docker image building
- Optional ECR push
- Container deployment ready

**Usage**:
```bash
./deploy-full-linux.sh
```

## 🐳 Docker Deployment

### Linux-Compatible Dockerfile
The `frontend/Dockerfile.linux` provides:
- Multi-stage build for optimal image size
- Alpine Linux base for security
- Nginx for serving static files
- Health checks
- Proper file permissions

### Building Docker Image
```bash
cd frontend
docker build -f Dockerfile.linux -t productiveminer-frontend:latest .
```

### Running Locally
```bash
docker run -p 80:80 productiveminer-frontend:latest
```

### Pushing to ECR
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag productiveminer-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/productiveminer-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/productiveminer-frontend:latest
```

## 📁 File Structure

```
ProductiveMiner.v2/
├── frontend/
│   ├── src/                    # React source code
│   ├── public/                 # Static assets
│   ├── package.json           # Dependencies
│   ├── Dockerfile.linux       # Linux-compatible Dockerfile
│   └── nginx.conf             # Nginx configuration
├── redeploy-s3-linux.sh       # Comprehensive S3 deployment
├── deploy-full-linux.sh       # Full deployment (S3 + Docker)
├── quick-s3-deploy.sh         # Quick S3 deployment
└── LINUX_DEPLOYMENT_README.md # This file
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Failures
**Symptoms**: Script exits with build errors
**Solutions**:
- Ensure Node.js version is 16+
- Clear node_modules: `rm -rf frontend/node_modules`
- Check for missing dependencies in package.json

#### 2. AWS Permission Errors
**Symptoms**: S3 sync or CloudFront invalidation fails
**Solutions**:
- Verify AWS credentials: `aws sts get-caller-identity`
- Check S3 bucket permissions
- Ensure CloudFront distribution access

#### 3. Cache Issues
**Symptoms**: Old content still showing after deployment
**Solutions**:
- Wait 5-10 minutes for global cache propagation
- Hard refresh browser (Ctrl+F5)
- Clear browser cache completely
- Check CloudFront invalidation status

#### 4. Docker Build Failures
**Symptoms**: Docker image build fails
**Solutions**:
- Ensure Docker is running
- Check available disk space
- Verify Dockerfile syntax
- Try building without cache: `docker build --no-cache`

### Debug Commands

#### Check Build Contents
```bash
ls -la frontend/build/
find frontend/build/ -name "*.js" | head -5
```

#### Verify S3 Deployment
```bash
aws s3 ls s3://productiveminer/ --recursive | wc -l
aws s3 cp s3://productiveminer/index.html - | head -10
```

#### Check CloudFront Status
```bash
aws cloudfront list-invalidations --distribution-id E2UPXPNR94V8IA
```

#### Test Docker Image
```bash
docker run --rm -p 8080:80 productiveminer-frontend:latest
curl http://localhost:8080
```

## 🚀 Production Deployment Checklist

- [ ] All tests pass locally
- [ ] Environment variables configured
- [ ] AWS credentials verified
- [ ] S3 bucket permissions checked
- [ ] CloudFront distribution configured
- [ ] DNS records updated (if applicable)
- [ ] SSL certificate valid
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

## 📊 Performance Optimization

### S3 Optimization
- Static assets cached for 1 year
- HTML files with no-cache headers
- Gzip compression enabled
- CDN distribution via CloudFront

### Docker Optimization
- Multi-stage build reduces image size
- Alpine Linux base image
- Non-root user for security
- Health checks for monitoring

### Build Optimization
- Source maps disabled in production
- Cache busting with timestamps
- Tree shaking enabled
- Code splitting for better loading

## 🔒 Security Considerations

- Non-root Docker user
- Minimal base images
- No sensitive data in build artifacts
- HTTPS enforcement
- CSP headers configured
- Regular dependency updates

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify CloudFront distribution status
4. Test locally with Docker
5. Check browser developer tools for errors

## 📝 Changelog

### v1.0.0
- Initial Linux-compatible deployment scripts
- Multi-stage Docker build
- Comprehensive error handling
- Cache optimization
- Health checks
