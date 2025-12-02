# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a microservice-based Database-as-a-Service (DBaaS) platform built with React, Go, gRPC, and Kubernetes. The system enables users to deploy and manage MySQL/PostgreSQL instances with LDAP authentication integration.

## Architecture

The project consists of multiple interconnected components:

### Backend Services

1. **TBDback/** - Main REST API backend (Go)
   - HTTP REST API server using Gorilla Mux
   - LDAP authentication integration
   - PostgreSQL database for user/database metadata
   - Kubernetes client for managing database deployments
   - Traefik IngressRoute management for dynamic routing

2. **Adminms/admin-service/** - gRPC Admin Microservice (Go)
   - Protocol Buffers-based gRPC service (admin.proto)
   - LDAP user management (create, update, delete LDAP users)
   - Kubernetes namespace and resource management
   - Database deployment orchestration
   - Admin operations and system health monitoring

3. **LDAP-client/** - Standalone LDAP authentication service (Go)
   - Minimal LDAP authentication microservice
   - Can be deployed independently for auth validation

### Frontend Applications

1. **Root (src/)** - Main React frontend
   - React 18 with React Router v6
   - User-facing database management interface
   - Connects to TBDback REST API (proxy: http://localhost:8080)
   - LDAP-aware authentication (distinguishes internal/external users)
   - Bootstrap 5 + Tailwind CSS for styling

2. **admin-frontend-microservice/** - Independent Admin React Frontend
   - Separate admin dashboard for system-wide management
   - gRPC-Web client communicating with admin-service
   - Connects to admin gRPC service (proxy: http://localhost:8082)
   - Tailwind CSS for styling
   - Namespace/resource management UI
   - LDAP user administration interface

3. **k3s-dbaas-presentation/** - Presentation/Demo Frontend
   - Standalone presentation app (separate from main system)
   - Used for demos and documentation

## Development Commands

### Main React Frontend (Root)
```bash
npm install          # Install dependencies
npm start            # Start dev server (port 3000, proxies to :8080)
npm run build        # Production build
npm test             # Run tests
```

### Admin Frontend Microservice
```bash
cd admin-frontend-microservice
npm install          # Install dependencies
npm start            # Start admin frontend (port 3000, proxies to :8082)
npm run build        # Production build
```

### Go Backend Services

**TBDback (Main REST API):**
```bash
cd TBDback
go mod download      # Download dependencies
go run .             # Run development server (port 8080)
go build             # Build binary
```

**Admin gRPC Service:**
```bash
cd Adminms/admin-service
go mod download      # Download dependencies
go run .             # Run gRPC server (port 8082)
go build             # Build binary
```

**LDAP Client Service:**
```bash
cd LDAP-client
go mod download      # Download dependencies
go run .             # Run LDAP auth service
go build             # Build binary
```

### Protocol Buffers

The admin service uses gRPC with Protocol Buffers:
- **Proto definition:** `admin-frontend-microservice/admin.proto` or `Adminms/admin-service/proto/admin.proto`
- **Generated Go code:** `Adminms/admin-service/pkg/pb/`
- **Generated JS code:** `src/generated/` and `admin-frontend-microservice/src/generated/`

To regenerate proto files:
```bash
# For Go server
cd Adminms/admin-service
protoc --go_out=. --go_opt=paths=source_relative \
  --go-grpc_out=. --go-grpc_opt=paths=source_relative \
  proto/admin.proto

# For JavaScript/gRPC-Web clients
protoc -I=. admin.proto \
  --js_out=import_style=commonjs:./src/generated \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:./src/generated
```

## Key Technical Details

### Dual Authentication System

The platform supports two authentication modes:
- **External Users (Database Users):** Register/login through traditional username/password stored in PostgreSQL
- **Internal Users (LDAP):** Authenticate against LDAP directory (identified by userType='internal')
- Admin access is granted to LDAP internal users or users with specific criteria (username='admin', id=1, etc.)

Admin route logic is in `src/App.js:26-53` - the `AdminRoute` component checks both traditional and LDAP-based admin status.

### Communication Patterns

1. **Main Frontend → TBDback:** HTTP REST (axios, fetch)
   - Endpoints: /auth/login, /auth/register, /databases, /user-databases, etc.
   - Service abstraction in `src/services/api.js`

2. **Admin Frontend → Admin Service:** gRPC-Web
   - Uses generated protobuf stubs from admin.proto
   - Service client in `admin-frontend-microservice/src/services/`
   - Bidirectional streaming not supported (gRPC-Web limitation)

3. **Backend Services → Kubernetes:** Native Go client-go
   - Manages Deployments, Services, PersistentVolumeClaims, Namespaces
   - Creates phpMyAdmin/pgAdmin instances alongside databases
   - Uses dynamic client for Traefik IngressRoute CRDs

### Database Deployment Flow

1. User requests database creation via frontend
2. Request routed to backend (TBDback or admin-service)
3. Backend creates user-specific Kubernetes namespace (e.g., `user-{username}-db`)
4. Deploys MySQL/PostgreSQL as StatefulSet/Deployment with PVC
5. Creates admin tool (phpMyAdmin/pgAdmin) deployment
6. Configures Traefik IngressRoute for external access
7. Stores metadata in PostgreSQL (database name, type, owner, namespace)

### Kubernetes Integration

- **Kubeconfig:** Both Go services load K8s config from `kubeconfig.yaml` or in-cluster config
- **Namespaces:** User isolation via dedicated namespaces (pattern: `user-{username}-db`)
- **Resource Types Managed:**
  - Deployments/StatefulSets (database pods)
  - Services (ClusterIP for internal access)
  - PersistentVolumeClaims (database storage)
  - IngressRoute (Traefik CRD for external routing)
  - Secrets (database credentials)

### LDAP Integration

LDAP functionality is distributed across:
- **TBDback/ldap_manager.go:** LDAP user operations (CRUD)
- **Adminms/admin-service/ldap_manager.go:** gRPC-exposed LDAP operations
- **LDAP-client/:** Standalone authentication microservice

LDAP configuration typically includes:
- Server URL (ldap:// or ldaps://)
- Base DN for user searches
- Admin bind credentials
- User/group organizational units

## Project Structure Patterns

### Backend Code Organization
- **main.go:** Server initialization, routing setup, middleware
- **auth.go / auth_handlers.go:** Authentication logic and JWT handling
- **database_handler.go:** Database CRUD operations
- **deployer.go:** Kubernetes deployment orchestration
- **ldap_manager.go:** LDAP operations
- **connectdb.go:** PostgreSQL connection and queries
- **config.go:** Configuration management

### Frontend Code Organization
- **src/components/:** React components (Dashboard, Login, Register, Services, etc.)
- **src/services/:** API clients and service abstractions
- **src/generated/:** Auto-generated protobuf stubs
- **src/utils/:** Utility functions
- **App.js:** Main routing and protected route logic

## Environment Configuration

### Backend Services
- `DB_HOST`: PostgreSQL host for metadata storage (default: 10.9.21.201)
- `LDAP_SERVER`: LDAP server URL
- `LDAP_BASE_DN`: Base DN for LDAP queries
- Kubernetes config loaded from: kubeconfig.yaml or in-cluster

### Frontend Applications
- Proxies configured in package.json:
  - Main frontend: `http://localhost:8080` (TBDback)
  - Admin frontend: `http://localhost:8082` (admin-service)

## Common Development Tasks

### Adding a New Database Type
1. Update proto definition with new database type enum
2. Implement deployment logic in `deployer.go`
3. Add UI options in `Services.jsx` or relevant component
4. Update database creation handlers in backend

### Adding New Admin Operations
1. Define new RPC in `admin.proto`
2. Implement handler in `admin_grpc_handlers.go`
3. Regenerate protobuf stubs
4. Update admin frontend to call new RPC
5. Add UI components in `admin-frontend-microservice/src/`

### Modifying LDAP Behavior
1. Update LDAP manager functions in `ldap_manager.go`
2. Adjust authentication checks in `auth_handlers.go`
3. Update frontend logic in `Login.jsx` to handle new userType scenarios

## Testing

The project uses:
- **React Testing Library:** For frontend component tests
- **Go testing package:** For backend unit tests (create files with `_test.go` suffix)

Run tests:
```bash
npm test                    # Frontend tests (interactive)
npm test -- --coverage      # With coverage
go test ./...               # All Go packages
go test -v ./...            # Verbose output
```

## Deployment

### Docker Build
Each service has a Dockerfile:
```bash
# Main frontend
docker build -t dbsaas-frontend:latest .

# Admin frontend
docker build -t admin-frontend:latest admin-frontend-microservice/

# Backend services
docker build -t tbd-backend:latest TBDback/
docker build -t admin-service:latest Adminms/admin-service/
```

### Kubernetes Deployment
- K3s is the recommended Kubernetes distribution
- Configuration files: `k8s-dev.yaml`, `deployment.yaml`
- Uses Traefik as ingress controller (comes with K3s)

## Important Notes

- The root `package.json` is for the main React frontend, not a monorepo orchestrator
- Multiple independent frontends exist - ensure you're working in the correct directory
- gRPC-Web has limitations compared to native gRPC (no bidirectional streaming)
- LDAP internal users have elevated privileges - be cautious with userType assignments
- Database namespaces follow strict naming: `user-{username}-db` - changing this breaks resource lookups
- Traefik IngressRoutes use CRDs - requires dynamic client, not standard typed client
