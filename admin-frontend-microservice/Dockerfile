# Stage 1: Build the React app
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for configuration
ARG GRPC_WEB_URL=http://10.9.21.201/admin-tbd
ARG BASE_PATH=/admin-tbd

# Build the app with PUBLIC_URL set
ENV REACT_APP_GRPC_WEB_URL=$GRPC_WEB_URL
ENV REACT_APP_BASE_PATH=$BASE_PATH
ENV PUBLIC_URL=/admin-tbd
ENV GENERATE_SOURCEMAP=false

RUN npm run build

# Stage 2: Production with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create config.js file that will be overridden by ConfigMap
RUN echo 'window.CONFIG = { GRPC_WEB_URL: "/admin-tbd", BASE_PATH: "/admin-tbd" };' > /usr/share/nginx/html/config.js

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]