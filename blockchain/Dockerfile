FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++ \
    git \
    bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/config

# Set permissions
RUN chown -R node:node /app
USER node

# Expose ports
EXPOSE 8545 8546 30303

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8545/health || exit 1

# Start the blockchain node
CMD ["node", "src/index.js"]
