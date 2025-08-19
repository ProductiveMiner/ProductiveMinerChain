FROM node:18-alpine

# Set working directory
WORKDIR /app

# Accept build arguments
ARG REACT_APP_API_URL=/api
ARG REACT_APP_BLOCKCHAIN_URL=/api
ARG REACT_APP_MATH_ENGINE_URL=/engine
ARG REACT_APP_WS_URL=ws://localhost:3001
ARG NODE_ENV=production

# Set environment variables for the build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_BLOCKCHAIN_URL=$REACT_APP_BLOCKCHAIN_URL
ENV REACT_APP_MATH_ENGINE_URL=$REACT_APP_MATH_ENGINE_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV NODE_ENV=$NODE_ENV

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
