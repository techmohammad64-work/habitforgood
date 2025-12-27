# Multi-stage build for Angular Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG API_URL
ENV API_URL=${API_URL}

# Generate environment file and build
RUN node scripts/generate-env.js && npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist/habitsforgood/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
