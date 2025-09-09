# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - Using busybox httpd (super lightweight)
FROM busybox:1.35
WORKDIR /app
COPY --from=builder /app/build ./
EXPOSE 3000
CMD ["httpd", "-f", "-v", "-p", "3000", "-h", "/app"]