#!/bin/bash

# ProductiveMiner Complete Rebuild Script
# Rebuilds the entire Docker environment from scratch

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ProductiveMiner"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_section "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    log_info "Docker: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    log_info "Docker Compose: $(docker-compose --version)"
    
    # Check Python (for mathematical engine)
    if ! command -v python3 &> /dev/null; then
        log_warn "Python 3 is not installed. Mathematical engine may not work properly."
    else
        log_info "Python: $(python3 --version)"
    fi
    
    # Check Node.js (for backend/frontend)
    if ! command -v node &> /dev/null; then
        log_warn "Node.js is not installed. Backend/Frontend development may be limited."
    else
        log_info "Node.js: $(node --version)"
    fi
    
    log_info "Prerequisites check completed ✓"
}

# Backup existing data
backup_existing_data() {
    log_section "Backing Up Existing Data"
    
    if [ -d "./data" ] || [ -f "blockchain-data.json" ] || [ -f ".env" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        
        # Backup data directory
        if [ -d "./data" ]; then
            log_info "Backing up data directory..."
            cp -r ./data "$BACKUP_DIR/" 2>/dev/null || true
        fi
        
        # Backup blockchain data
        if [ -f "blockchain-data.json" ]; then
            log_info "Backing up blockchain data..."
            cp blockchain-data.json "$BACKUP_DIR/" 2>/dev/null || true
        fi
        
        # Backup environment file
        if [ -f ".env" ]; then
            log_info "Backing up environment file..."
            cp .env "$BACKUP_DIR/" 2>/dev/null || true
        fi
        
        # Backup docker volumes
        log_info "Backing up Docker volumes..."
        docker run --rm -v productiveminer_postgres-data:/data -v "$BACKUP_DIR":/backup alpine tar czf /backup/postgres-data.tar.gz -C /data . 2>/dev/null || true
        docker run --rm -v productiveminer_redis-data:/data -v "$BACKUP_DIR":/backup alpine tar czf /backup/redis-data.tar.gz -C /data . 2>/dev/null || true
        
        log_info "Backup completed in: $BACKUP_DIR"
    else
        log_info "No existing data to backup"
    fi
}

# Stop and clean existing containers
clean_existing_setup() {
    log_section "Cleaning Existing Setup"
    
    log_info "Stopping all ProductiveMiner containers..."
    docker-compose down 2>/dev/null || true
    
    log_info "Removing orphaned containers..."
    docker container prune -f 2>/dev/null || true
    
    log_info "Cleaning unused images..."
    docker image prune -f 2>/dev/null || true
    
    log_info "Cleaning unused volumes (keeping named volumes)..."
    docker volume prune -f 2>/dev/null || true
    
    log_info "Cleanup completed ✓"
}

# Create directory structure
create_directory_structure() {
    log_section "Creating Directory Structure"
    
    # Root directories
    directories=(
        "blockchain"
        "backend"
        "frontend"
        "engine"
        "database"
        "ml"
        "research"
        "validator"
        "nginx"
        "monitoring"
        "ssl"
        "scripts"
        "data"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    done
    
    # Sub-directories
    mkdir -p backend/{src,config,logs,data}
    mkdir -p frontend/{src,public,build}
    mkdir -p engine/{config,data,logs}
    mkdir -p blockchain/{config,data,logs}
    mkdir -p database/{init,backups}
    mkdir -p ml/{models,data,logs}
    mkdir -p research/{data,docs}
    mkdir -p validator/{data,keys}
    mkdir -p nginx/conf.d
    mkdir -p monitoring/{prometheus,grafana/dashboards,grafana/datasources}
    mkdir -p data/{postgres,redis,blockchain,engine,ml,research}
    
    log_info "Directory structure created ✓"
}

# Create environment file
create_env_file() {
    log_section "Creating Environment File"
    
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
# ProductiveMiner Environment Configuration
# Generated: $(date)

# Security - CHANGE THESE IN PRODUCTION!
POSTGRES_PASSWORD=productiveminer_secure_2024
JWT_SECRET=jwt_secret_$(openssl rand -hex 32)
ENCRYPTION_KEY=encryption_key_$(openssl rand -hex 16)
VALIDATOR_ADDRESS=0x0000000000000000000000000000000000000000

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=productiveminer

# Network Configuration
NODE_ENV=production
NETWORK_ID=1337
CHAIN_ID=31337

# API Configuration
API_PORT=3000
WS_PORT=3001
ENGINE_PORT=5001
ML_PORT=5002
RESEARCH_PORT=5003
VALIDATOR_PORT=5004

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=productiveminer_db
DB_USER=productiveminer

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Blockchain Configuration
CONSENSUS_TYPE=hybrid
ENABLE_MINING=true
MATHEMATICAL_ENGINES=9
QUANTUM_SECURITY_LEVEL=256
ADAPTIVE_LEARNING=true

# Tokenomics
TOTAL_SUPPLY=1000000000
CIRCULATING_SUPPLY=500000000
STAKING_APY=0.12
EMISSION_RATE=1000
BURN_RATE=0.1

# Mining Configuration
MAX_CONCURRENT_SESSIONS=50
DEFAULT_DIFFICULTY=25
BLOCK_TIME=20
REWARD_MULTIPLIER=1.0

# ML Configuration
ML_MODELS_COUNT=9
LEARNING_RATE=0.001
TRAINING_CYCLES=1000
MOMENTUM=0.9
BATCH_SIZE=32
EPOCHS=100

# Research Repository
ENABLE_API_ACCESS=true
ACCESS_TIERS=basic,premium,enterprise

# Monitoring
ENABLE_MONITORING=true
METRICS_PORT=9090
EOF
        
        log_info "Environment file created ✓"
        log_warn "Please update the passwords and secrets in .env file!"
    else
        log_info "Environment file already exists, keeping existing configuration"
    fi
}

# Create mathematical engine files
create_engine_files() {
    log_section "Creating Mathematical Engine Files"
    
    # Create simplified engine.py
    cat > engine/engine.py << 'EOF'
#!/usr/bin/env python3
"""
ProductiveMiner Mathematical Computation Engine
Simplified version for Docker deployment
"""

import os
import json
import time
import logging
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
ENGINE_TYPE = os.getenv('ENGINE_TYPE', 'multi')
PORT = int(os.getenv('PORT', '5000'))

class ComputationRequest(BaseModel):
    work_type: str
    difficulty: int
    parameters: Dict[str, Any]

class ComputationResult(BaseModel):
    work_type: str
    success: bool
    result: Dict[str, Any]
    computation_time: float
    research_value: float

# FastAPI app
app = FastAPI(title="ProductiveMiner Mathematical Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "engine_type": ENGINE_TYPE}

@app.post("/compute")
async def compute(request: ComputationRequest) -> ComputationResult:
    start_time = time.time()
    
    # Simplified computation (replace with actual mathematical work)
    result = {
        "work_type": request.work_type,
        "difficulty": request.difficulty,
        "solution": f"Solution for {request.work_type}",
        "proof": f"Mathematical proof for {request.work_type}"
    }
    
    computation_time = time.time() - start_time
    research_value = request.difficulty * 10
    
    return ComputationResult(
        work_type=request.work_type,
        success=True,
        result=result,
        computation_time=computation_time,
        research_value=research_value
    )

if __name__ == "__main__":
    logger.info(f"Starting Mathematical Engine on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
EOF
    
    chmod +x engine/engine.py
    log_info "Mathematical engine created ✓"
}

# Create backend files
create_backend_files() {
    log_section "Creating Backend Files"
    
    # Create package.json
    cat > backend/package.json << 'EOF'
{
  "name": "productiveminer-backend",
  "version": "1.0.0",
  "description": "ProductiveMiner Backend Service",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "dotenv": "^16.0.3",
    "pg": "^8.11.0",
    "redis": "^4.6.7",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "socket.io": "^4.6.2",
    "axios": "^1.4.0",
    "winston": "^3.9.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0"
  }
}
EOF
    
    # Create basic server.js
    cat > backend/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'productiveminer-backend'
    });
});

// Basic routes
app.get('/api/status', (req, res) => {
    res.json({
        blockchain: {
            height: 0,
            status: 'initializing'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`ProductiveMiner Backend running on port ${PORT}`);
});
EOF
    
    log_info "Backend files created ✓"
}

# Create frontend files
create_frontend_files() {
    log_section "Creating Frontend Files"
    
    # Create package.json
    cat > frontend/package.json << 'EOF'
{
  "name": "productiveminer-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.2",
    "axios": "^1.4.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
EOF
    
    # Create public/index.html
    mkdir -p frontend/public
    cat > frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="ProductiveMiner - Mathematical Discovery-Backed Finance" />
    <title>ProductiveMiner ($MINED)</title>
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>
EOF
    
    # Create src files
    mkdir -p frontend/src
    cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
EOF
    
    cat > frontend/src/App.js << 'EOF'
import React, { useEffect, useState } from 'react';

function App() {
    const [status, setStatus] = useState('initializing...');
    
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/health`)
            .then(res => res.json())
            .then(data => setStatus(data.status))
            .catch(() => setStatus('offline'));
    }, []);
    
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>ProductiveMiner ($MINED)</h1>
            <h2>Mathematical Discovery-Backed Finance</h2>
            <p>Status: <strong>{status}</strong></p>
            <div>
                <h3>9 Mathematical Engines:</h3>
                <ul>
                    <li>Prime Pattern Discovery</li>
                    <li>Riemann Zero Computation</li>
                    <li>Yang-Mills Field Theory</li>
                    <li>Goldbach Conjecture Verification</li>
                    <li>Navier-Stokes Simulation</li>
                    <li>Birch-Swinnerton-Dyer</li>
                    <li>Elliptic Curve Cryptography</li>
                    <li>Lattice Cryptography</li>
                    <li>Poincaré Conjecture</li>
                </ul>
            </div>
        </div>
    );
}

export default App;
EOF
    
    log_info "Frontend files created ✓"
}

# Create nginx configuration
create_nginx_config() {
    log_section "Creating Nginx Configuration"
    
    cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;
    
    upstream backend {
        server productiveminer-backend:3000;
    }
    
    upstream engine {
        server mathematical-engine:5000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # Frontend
        location / {
            proxy_pass http://productiveminer-frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Mathematical Engine
        location /engine {
            proxy_pass http://engine;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # WebSocket
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
    
    log_info "Nginx configuration created ✓"
}

# Create monitoring configuration
create_monitoring_config() {
    log_section "Creating Monitoring Configuration"
    
    # Prometheus configuration
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'productiveminer-backend'
    static_configs:
      - targets: ['productiveminer-backend:3000']
  
  - job_name: 'mathematical-engine'
    static_configs:
      - targets: ['mathematical-engine:5000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF
    
    log_info "Monitoring configuration created ✓"
}

# Build and start Docker containers
start_docker_services() {
    log_section "Starting Docker Services"
    
    log_info "Building Docker images..."
    docker-compose build --no-cache
    
    log_info "Starting Docker containers..."
    docker-compose up -d
    
    log_info "Waiting for services to be ready..."
    sleep 10
    
    log_info "Docker services started ✓"
}

# Verify services
verify_services() {
    log_section "Verifying Services"
    
    # Check container status
    log_info "Container Status:"
    docker-compose ps
    
    # Check service health
    services=(
        "http://localhost:3000/api/health:Backend"
        "http://localhost:3002:Frontend"
        "http://localhost:5001/health:Mathematical Engine"
        "http://localhost:8080:Adminer"
        "http://localhost:9090:Prometheus"
        "http://localhost:3003:Grafana"
    )
    
    echo ""
    log_info "Service Health Checks:"
    for service in "${services[@]}"; do
        IFS=':' read -r url port name <<< "$service"
        full_url="${url}:${port}"
        if [ "$port" != "Frontend" ]; then
            if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|302"; then
                echo -e "  ${GREEN}✓${NC} ${name}: Running at ${url}"
            else
                echo -e "  ${RED}✗${NC} ${name}: Not responding at ${url}"
            fi
        else
            echo -e "  ${BLUE}ℹ${NC} ${port}: ${url}"
        fi
    done
    
    echo ""
    log_info "To view logs: docker-compose logs -f [service-name]"
    log_info "To stop all services: docker-compose down"
}

# Main execution
main() {
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║   ProductiveMiner Docker Rebuild      ║${NC}"
    echo -e "${MAGENTA}║   Mathematical Discovery-Backed       ║${NC}"
    echo -e "${MAGENTA}║   Blockchain System                   ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════╝${NC}"
    echo ""
    
    check_prerequisites
    backup_existing_data
    clean_existing_setup
    create_directory_structure
    create_env_file
    create_engine_files
    create_backend_files
    create_frontend_files
    create_nginx_config
    create_monitoring_config
    
    # Copy docker-compose.yml if not exists
    if [ ! -f docker-compose.yml ]; then
        log_warn "docker-compose.yml not found. Please create it from the provided configuration."
        exit 1
    fi
    
    start_docker_services
    verify_services
    
    echo ""
    log_section "Rebuild Complete! 🚀"
    echo -e "${GREEN}ProductiveMiner is now running!${NC}"
    echo ""
    echo "Access Points:"
    echo "  - Frontend:           http://localhost:3002"
    echo "  - Backend API:        http://localhost:3000"
    echo "  - Mathematical Engine: http://localhost:5001"
    echo "  - Database Admin:     http://localhost:8080"
    echo "  - Prometheus:         http://localhost:9090"
    echo "  - Grafana:           http://localhost:3003"
    echo ""
    echo "Default Credentials:"
    echo "  - Grafana: admin / productiveminer"
    echo "  - Database: productiveminer / (see .env file)"
    echo ""
    echo -e "${YELLOW}Remember to update passwords in .env file for production!${NC}"
}

# Run main function
main "$@"
