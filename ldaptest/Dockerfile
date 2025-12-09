# Multi-stage build for Go GraphQL LDAP Server
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy source code
COPY backend/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o ldaptest-server .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/ldaptest-server .

# Expose port
EXPOSE 8090

# Run the server
CMD ["./ldaptest-server"]
