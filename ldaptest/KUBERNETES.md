# Kubernetes Deployment Guide - LDAP GraphQL Server

This guide covers deploying the ldaptest GraphQL server to your Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (K3s, K8s, etc.)
- `kubectl` configured
- Docker installed (for building images)
- LDAP server accessible from the cluster

## Quick Start

### 1. Build and Deploy (Automated)

```bash
chmod +x deploy.sh
./deploy.sh
```

### 2. Manual Deployment

#### Step 1: Build Docker Image

```bash
docker build -t ldaptest-graphql:latest .
```

#### Step 2: Load Image into K3s (if using K3s)

```bash
docker save ldaptest-graphql:latest | sudo k3s ctr images import -
```

For other Kubernetes distributions, push to your container registry:

```bash
# Tag for your registry
docker tag ldaptest-graphql:latest your-registry/ldaptest-graphql:latest

# Push to registry
docker push your-registry/ldaptest-graphql:latest

# Update k8s-deployment.yaml to use the registry image
```

#### Step 3: Deploy to Kubernetes

```bash
kubectl apply -f k8s-deployment.yaml
```

#### Step 4: Verify Deployment

```bash
# Check deployment status
kubectl get deployments -n ldaptest

# Check pods
kubectl get pods -n ldaptest

# Check services
kubectl get svc -n ldaptest

# View logs
kubectl logs -f deployment/ldaptest-graphql -n ldaptest
```

## Configuration

### Environment Variables

Update the ConfigMap in `k8s-deployment.yaml`:

```yaml
data:
  LDAP_HOST: "openldap.openldap.svc.cluster.local"  # Your LDAP service
  PORT: "8090"
```

### LDAP Connection

The service expects LDAP to be accessible at:
- **Host**: Set via `LDAP_HOST` environment variable
- **Port**: `389` (default LDAP port)
- **Base DN**: `dc=dbsaas,dc=local`
- **Admin DN**: `cn=admin,dc=dbsaas,dc=local`

Update these in `backend/ldap/client.go` if your LDAP configuration differs.

### JWT Secret

**IMPORTANT**: Change the JWT secret in production!

Update in `k8s-deployment.yaml`:

```yaml
env:
- name: JWT_SECRET
  value: "your-production-secret-key-here"
```

Or use a Kubernetes Secret (recommended):

```bash
# Create secret
kubectl create secret generic ldaptest-jwt-secret \
  --from-literal=JWT_SECRET='your-production-secret' \
  -n ldaptest

# Update deployment to use secret
```

## Access Methods

### 1. Port Forward (Development)

Forward the service port to your local machine:

```bash
kubectl port-forward -n ldaptest svc/ldaptest-graphql-service 8090:8090
```

Access:
- GraphQL Playground: `http://localhost:8090`
- GraphQL Endpoint: `http://localhost:8090/query`

### 2. LoadBalancer Service

The deployment includes a LoadBalancer service. Get the external IP:

```bash
kubectl get svc ldaptest-graphql-lb -n ldaptest
```

Access via the EXTERNAL-IP on port 8090.

### 3. Traefik IngressRoute

If using Traefik (default in K3s):

```bash
# The service will be available at:
# http://graphql.dbsaas.local
# or any path with /graphql prefix
```

Update your `/etc/hosts` or DNS:

```
<cluster-ip> graphql.dbsaas.local
```

### 4. ClusterIP (Internal Only)

From within the cluster, services can access:

```
http://ldaptest-graphql-service.ldaptest.svc.cluster.local:8090/query
```

## Testing from the Cluster

### Create a Test Pod

```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n ldaptest -- sh
```

Inside the pod:

```bash
# Health check
curl http://ldaptest-graphql-service:8090/query \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'

# Register user
curl http://ldaptest-graphql-service:8090/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Register($username: String!, $password: String!, $email: String!, $firstName: String!, $lastName: String!, $userType: String!) { register(username: $username, password: $password, email: $email, firstName: $firstName, lastName: $lastName, userType: $userType) { token user { username email } } }",
    "variables": {
      "username": "testuser",
      "password": "password123",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "userType": "external"
    }
  }'

# Login
curl http://ldaptest-graphql-service:8090/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($username: String!, $password: String!) { login(username: $username, password: $password) { token user { username email } } }",
    "variables": {
      "username": "testuser",
      "password": "password123"
    }
  }'
```

## Scaling

Scale the deployment:

```bash
kubectl scale deployment ldaptest-graphql --replicas=3 -n ldaptest
```

## Monitoring

### View Logs

```bash
# Follow logs
kubectl logs -f deployment/ldaptest-graphql -n ldaptest

# View logs from specific pod
kubectl logs -f <pod-name> -n ldaptest

# View previous logs (if pod crashed)
kubectl logs --previous <pod-name> -n ldaptest
```

### Resource Usage

```bash
# Check resource usage
kubectl top pods -n ldaptest

# Check deployment details
kubectl describe deployment ldaptest-graphql -n ldaptest
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n ldaptest

# Check events
kubectl get events -n ldaptest --sort-by='.lastTimestamp'
```

### LDAP Connection Issues

1. Verify LDAP service is running:
```bash
kubectl get svc -n openldap  # Or your LDAP namespace
```

2. Test LDAP connectivity from the pod:
```bash
kubectl exec -it <pod-name> -n ldaptest -- sh
apk add openldap-clients
ldapsearch -x -H ldap://openldap.openldap.svc.cluster.local:389 -b "dc=dbsaas,dc=local"
```

3. Check LDAP_HOST configuration in ConfigMap:
```bash
kubectl get configmap ldaptest-config -n ldaptest -o yaml
```

### Image Pull Errors

If using `imagePullPolicy: Never`, ensure the image is loaded into the cluster:

```bash
# For K3s
docker save ldaptest-graphql:latest | sudo k3s ctr images import -

# For Docker Desktop Kubernetes
# Images built with Docker Desktop are automatically available
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints ldaptest-graphql-service -n ldaptest

# Test from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n ldaptest -- \
  curl http://ldaptest-graphql-service:8090/query \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'
```

## Cleanup

Remove all resources:

```bash
kubectl delete namespace ldaptest
```

Or remove individual resources:

```bash
kubectl delete -f k8s-deployment.yaml
```

## Integration with Existing Services

### Connect to Existing LDAP

Update the ConfigMap to point to your LDAP service:

```yaml
data:
  LDAP_HOST: "openldap.openldap.svc.cluster.local"
```

### Use with TBDback

The GraphQL service can work alongside TBDback:

1. TBDback uses REST API (port 8080)
2. ldaptest uses GraphQL (port 8090)
3. Both connect to the same LDAP server
4. Users can be created via either service

### Frontend Integration

Update your React frontend to use the GraphQL endpoint:

```javascript
const client = new ApolloClient({
  uri: 'http://graphql.dbsaas.local/query',
  // or
  uri: 'http://<loadbalancer-ip>:8090/query',
});
```

## Production Considerations

1. **Use Kubernetes Secrets** for sensitive data (JWT secret, LDAP passwords)
2. **Enable TLS** for LDAP connections (ldaps://)
3. **Set resource limits** appropriately based on load
4. **Enable HTTPS** for GraphQL endpoint (use cert-manager)
5. **Implement rate limiting** to prevent abuse
6. **Use external configuration** (ConfigMaps, Secrets) instead of hardcoded values
7. **Set up monitoring** with Prometheus/Grafana
8. **Configure backup** for persistent data (if added)
9. **Use multiple replicas** for high availability
10. **Implement health checks** properly

## Next Steps

- Set up Prometheus metrics
- Add OpenTelemetry tracing
- Implement GraphQL subscriptions (if needed)
- Add caching layer (Redis)
- Set up CI/CD pipeline
- Add integration tests
