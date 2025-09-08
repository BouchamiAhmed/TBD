# Dockerfile for LDAP Auth Microservice
# Save as: ldap-auth-service/Dockerfile

FROM golang:1.24-alpine AS builder

# Install required packages for LDAP
RUN apk add --no-cache gcc musl-dev openldap-dev

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o ldap-auth-service .

# Production stage
FROM alpine:latest

# Install runtime dependencies for LDAP
RUN apk --no-cache add ca-certificates openldap-dev

# Create non-root user
RUN adduser -D -s /bin/sh appuser

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/ldap-auth-service .

# Change ownership to non-root user
RUN chown appuser:appuser ldap-auth-service

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/health || exit 1

# Run the application
CMD ["./ldap-auth-service"]