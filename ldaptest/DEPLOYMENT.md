# Deployment Files Explanation

## Overview

The ldaptest project includes **three Kubernetes deployment files** to give you flexibility:

### 1. `k8s-openldap.yaml` - LDAP Server Only
Deploys only the OpenLDAP server with:
- Namespace: `openldap`
- PersistentVolume for data storage
- Initial LDAP structure (OUs, groups)
- Services (ClusterIP + LoadBalancer)

**Use when:** You want to deploy LDAP separately or already have the GraphQL service running.

### 2. `k8s-deployment.yaml` - GraphQL Service Only
Deploys only the ldaptest GraphQL authentication service with:
- Namespace: `ldaptest`
- ConfigMap pointing to existing LDAP (`openldap.openldap.svc.cluster.local`)
- Services (ClusterIP + LoadBalancer)
- Traefik IngressRoute

**Use when:** You already have OpenLDAP running in your cluster.

### 3. `k8s-complete.yaml` - Complete Stack (RECOMMENDED)
Deploys both OpenLDAP and GraphQL service together:
- Everything from `k8s-openldap.yaml`
- Everything from `k8s-deployment.yaml`
- Properly configured to work together

**Use when:** Starting fresh or want to deploy the entire stack at once.

## Deployment Files Breakdown

### k8s-openldap.yaml Components:

```yaml
Namespace: openldap
├── PersistentVolumeClaim: openldap-data (1Gi)
├── ConfigMap: openldap-init (LDIF initialization)
├── Deployment: openldap
│   └── Container: osixia/openldap:1.5.0
│       ├── Base DN: dc=dbsaas,dc=local
│       ├── Admin password: admin123
│       └── Volumes: PVC + ConfigMaps
├── Service: openldap (ClusterIP, port 389)
└── Service: openldap-lb (LoadBalancer, port 389)
```

**LDAP Structure Created:**
```
dc=dbsaas,dc=local
├── ou=internal
│   └── ou=users
├── ou=external
│   └── ou=users
├── ou=groups
│   ├── cn=admins (gid: 1001)
│   └── cn=clients (gid: 2001)
└── cn=readonly (service account)
```

### k8s-deployment.yaml Components:

```yaml
Namespace: ldaptest
├── ConfigMap: ldaptest-config
│   └── LDAP_HOST: openldap.openldap.svc.cluster.local
├── Deployment: ldaptest-graphql
│   └── Container: ldaptest-graphql:latest
│       └── Port: 8090
├── Service: ldaptest-graphql-service (ClusterIP)
├── Service: ldaptest-graphql-lb (LoadBalancer)
└── IngressRoute: ldaptest-graphql-ingress (Traefik)
```

## Quick Start Deployment

### Complete Stack (Recommended)

```bash
# 1. Build the image
cd TBD
docker build -t ldaptest-graphql:latest ldaptest/

# 2. Load into K3s
docker save ldaptest-graphql:latest | sudo k3s ctr images import -

# 3. Deploy everything
kubectl apply -f ldaptest/k8s-complete.yaml

# 4. Check status
kubectl get all -n openldap
kubectl get all -n ldaptest

# 5. Test LDAP connectivity
kubectl exec -it deployment/openldap -n openldap -- \
  ldapsearch -x -b "dc=dbsaas,dc=local" -D "cn=admin,dc=dbsaas,dc=local" -w admin123

# 6. Access GraphQL Playground
kubectl port-forward -n ldaptest svc/ldaptest-graphql-service 8090:8090
# Open: http://localhost:8090
```

### Separate Deployment

```bash
# Deploy LDAP first
kubectl apply -f ldaptest/k8s-openldap.yaml
kubectl wait --for=condition=available --timeout=120s deployment/openldap -n openldap

# Deploy GraphQL service
kubectl apply -f ldaptest/k8s-deployment.yaml
kubectl wait --for=condition=available --timeout=120s deployment/ldaptest-graphql -n ldaptest
```

## Service Access

### OpenLDAP

**Internal (from cluster):**
```
openldap.openldap.svc.cluster.local:389
```

**External (LoadBalancer):**
```bash
# Get external IP
kubectl get svc openldap-lb -n openldap

# Use the EXTERNAL-IP
ldapsearch -x -H ldap://<EXTERNAL-IP>:389 -b "dc=dbsaas,dc=local"
```

**Port-forward (for testing):**
```bash
kubectl port-forward -n openldap svc/openldap 389:389
ldapsearch -x -H ldap://localhost:389 -b "dc=dbsaas,dc=local"
```

### GraphQL Service

**Internal (from cluster):**
```
http://ldaptest-graphql-service.ldaptest.svc.cluster.local:8090/query
```

**External (LoadBalancer):**
```bash
# Get external IP
kubectl get svc ldaptest-graphql-lb -n ldaptest

# Access at
http://<EXTERNAL-IP>:8090
```

**Port-forward (recommended):**
```bash
kubectl port-forward -n ldaptest svc/ldaptest-graphql-service 8090:8090
# Access: http://localhost:8090
```

**Traefik Ingress:**
```
http://graphql.dbsaas.local
```

## Configuration Details

### OpenLDAP Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| LDAP_ORGANISATION | DBaaS Platform | Organization name |
| LDAP_DOMAIN | dbsaas.local | Domain name |
| LDAP_BASE_DN | dc=dbsaas,dc=local | Base DN |
| LDAP_ADMIN_PASSWORD | admin123 | Admin password |
| LDAP_READONLY_USER_PASSWORD | readonly123 | Readonly service account |

### GraphQL Service Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| LDAP_HOST | openldap.openldap.svc.cluster.local | LDAP server address |
| PORT | 8090 | GraphQL server port |
| JWT_SECRET | (change in prod!) | JWT signing key |

## Verification Steps

### 1. Check OpenLDAP is Running

```bash
# Check pods
kubectl get pods -n openldap

# Check logs
kubectl logs -f deployment/openldap -n openldap

# Test LDAP connection
kubectl run -it --rm ldap-test --image=osixia/openldap:1.5.0 --restart=Never -n openldap -- \
  ldapsearch -x -H ldap://openldap:389 -b "dc=dbsaas,dc=local" -D "cn=admin,dc=dbsaas,dc=local" -w admin123
```

### 2. Check GraphQL Service is Running

```bash
# Check pods
kubectl get pods -n ldaptest

# Check logs
kubectl logs -f deployment/ldaptest-graphql -n ldaptest

# Should see:
# ✅ Connected to LDAP server successfully
# ✅ GraphQL Server running on http://localhost:8090
```

### 3. Test GraphQL API

```bash
# Port-forward
kubectl port-forward -n ldaptest svc/ldaptest-graphql-service 8090:8090 &

# Health check
curl -X POST http://localhost:8090/query \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'

# Register a test user
curl -X POST http://localhost:8090/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(username: \"testuser\", password: \"pass123\", email: \"test@example.com\", firstName: \"Test\", lastName: \"User\", userType: \"external\") { token user { username email userType } } }"
  }'
```

### 4. Verify User in LDAP

```bash
# Search for the created user
kubectl exec -it deployment/openldap -n openldap -- \
  ldapsearch -x -b "ou=users,ou=external,dc=dbsaas,dc=local" \
  -D "cn=admin,dc=dbsaas,dc=local" -w admin123 \
  "(uid=testuser)"
```

## Troubleshooting

### OpenLDAP Pod Not Starting

```bash
# Check events
kubectl describe pod <openldap-pod> -n openldap

# Common issues:
# - PVC not bound: Check storage class
# - Image pull errors: Check image availability
```

### GraphQL Service Can't Connect to LDAP

```bash
# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -n ldaptest -- \
  nslookup openldap.openldap.svc.cluster.local

# Test port connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n ldaptest -- \
  nc -zv openldap.openldap.svc.cluster.local 389
```

### Data Persistence Issues

```bash
# Check PVC status
kubectl get pvc -n openldap

# Check PV
kubectl get pv

# Delete and recreate if needed (WARNING: loses data)
kubectl delete pvc openldap-data -n openldap
kubectl apply -f ldaptest/k8s-openldap.yaml
```

## Cleanup

### Remove Everything

```bash
kubectl delete -f ldaptest/k8s-complete.yaml
```

### Remove Separately

```bash
# Remove GraphQL service
kubectl delete namespace ldaptest

# Remove OpenLDAP
kubectl delete namespace openldap

# Note: PVC might be retained based on storage class reclaim policy
```

## Production Considerations

1. **Change default passwords** in ConfigMaps/environment variables
2. **Use Kubernetes Secrets** instead of plain text passwords
3. **Enable TLS** for LDAP (ldaps://)
4. **Enable HTTPS** for GraphQL endpoint
5. **Increase PVC size** based on user count
6. **Set up backups** for LDAP data
7. **Use proper storage class** with redundancy
8. **Configure resource limits** appropriately
9. **Set up monitoring** (Prometheus/Grafana)
10. **Implement rate limiting** on GraphQL endpoint
