FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment variables for the build (same-origin defaults; can be overridden)
ENV REACT_APP_API_URL=/api
ENV REACT_APP_BLOCKCHAIN_URL=/api
ENV REACT_APP_MATH_ENGINE_URL=/engine
ENV REACT_APP_WS_URL=ws://localhost:3001
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

# Expose port
EXPOSE 80

# Start the application
CMD ["serve", "-s", "build", "-l", "80"]
