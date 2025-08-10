FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy contract source files
COPY . .

# Create artifacts directory
RUN mkdir -p artifacts

# Compile contracts
RUN npx hardhat compile

# Expose port for contract interactions
EXPOSE 8545

# Set environment variables
ENV NODE_ENV=development

# Default command - run hardhat node (creates local network)
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0", "--port", "8545"]
