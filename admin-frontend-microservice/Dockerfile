# admin-frontend-microservice/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments for configuration
ARG GRPC_WEB_URL=http://10.9.21.201/admin-tbd
ARG BASE_PATH=/admin-tbd

# Build the app
ENV REACT_APP_GRPC_WEB_URL=$GRPC_WEB_URL
ENV REACT_APP_BASE_PATH=$BASE_PATH
ENV GENERATE_SOURCEMAP=false

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Create config.js file that will be overridden by ConfigMap
RUN echo "window.CONFIG = { GRPC_WEB_URL: '/admin-tbd', BASE_PATH: '/admin-tbd' };" > /usr/share/nginx/html/config.js

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]