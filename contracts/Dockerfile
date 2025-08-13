FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for OpenZeppelin contracts)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Create deployment script
RUN echo '#!/bin/sh' > deploy.sh && \
    echo 'echo "Installing dependencies..."' >> deploy.sh && \
    echo 'npm install --legacy-peer-deps' >> deploy.sh && \
    echo 'echo "Compiling contracts..."' >> deploy.sh && \
    echo 'npx hardhat compile' >> deploy.sh && \
    echo 'echo "Starting deployment..."' >> deploy.sh && \
    echo 'npx hardhat run scripts/deploy-asymptotic-token-system.js --network localhost' >> deploy.sh && \
    echo 'echo "Deployment completed!"' >> deploy.sh && \
    chmod +x deploy.sh

# Expose port for hardhat node
EXPOSE 8545

# Default command
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
