# LDAP Test - GraphQL Authentication Server

A Go-based GraphQL server with LDAP authentication, inspired by TBDback and LDAP-client implementations.

## Features

- **GraphQL API** using `gqlgen`
- **LDAP Authentication** with support for internal/external users
- **JWT Token-based** authentication
- **User Management** (registration, login, user queries)
- **GraphQL Playground** for interactive testing

## Project Structure

```
ldaptest/
├── backend/
│   ├── main.go                 # Server entry point
│   ├── schema.graphql          # GraphQL schema definition
│   ├── gqlgen.yml             # gqlgen configuration
│   ├── auth/
│   │   └── jwt.go             # JWT token handling
│   ├── ldap/
│   │   └── client.go          # LDAP client operations
│   ├── middleware/
│   │   └── auth.go            # Authentication middleware
│   └── graph/
│       ├── resolver.go         # Resolver dependencies
│       ├── schema.resolvers.go # GraphQL resolver implementations
│       └── model/              # Generated GraphQL models
└── frontend/                   # (Future React app with Apollo Client)
```

## Prerequisites

- Go 1.21+
- LDAP server running (default: `localhost:389`)
- LDAP structure:
  - Base DN: `dc=dbsaas,dc=local`
  - Internal users: `ou=users,ou=internal,dc=dbsaas,dc=local`
  - External users: `ou=users,ou=external,dc=dbsaas,dc=local`

## Installation

1. Navigate to the backend directory:
```bash
cd ldaptest/backend
```

2. Install Go dependencies:
```bash
go mod download
```

3. Run the server:
```bash
go run .
```

The server will start on `http://localhost:8090`

## Configuration

Environment variables (optional):
- `LDAP_HOST` - LDAP server host (default: `localhost`)
- `PORT` - Server port (default: `8090`)

LDAP connection details are in `backend/ldap/client.go`:
```go
Host:         "localhost"
Port:         389
BaseDN:       "dc=dbsaas,dc=local"
BindDN:       "cn=admin,dc=dbsaas,dc=local"
BindPassword: "admin123"
```

## GraphQL API

### Endpoint
- **URL:** `http://localhost:8090/query`
- **Playground:** `http://localhost:8090` (for browser-based testing)

### Operations

#### 1. Register User (Mutation)

Creates a new user in LDAP and returns JWT token.

**GraphQL Query:**
```graphql
mutation Register {
  register(
    username: "johndoe"
    password: "password123"
    email: "john@example.com"
    firstName: "John"
    lastName: "Doe"
    userType: "external"
  ) {
    token
    user {
      id
      username
      email
      firstName
      lastName
      userType
    }
  }
}
```

**Postman Request:**
- Method: `POST`
- URL: `http://localhost:8090/query`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "query": "mutation Register($username: String!, $password: String!, $email: String!, $firstName: String!, $lastName: String!, $userType: String!) { register(username: $username, password: $password, email: $email, firstName: $firstName, lastName: $lastName, userType: $userType) { token user { id username email firstName lastName userType } } }",
  "variables": {
    "username": "johndoe",
    "password": "password123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "external"
  }
}
```

#### 2. Login (Mutation)

Authenticates against LDAP and returns JWT token.

**GraphQL Query:**
```graphql
mutation Login {
  login(
    username: "johndoe"
    password: "password123"
  ) {
    token
    user {
      id
      username
      email
      firstName
      lastName
      userType
    }
  }
}
```

**Postman Request:**
- Method: `POST`
- URL: `http://localhost:8090/query`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "query": "mutation Login($username: String!, $password: String!) { login(username: $username, password: $password) { token user { id username email firstName lastName userType } } }",
  "variables": {
    "username": "johndoe",
    "password": "password123"
  }
}
```

#### 3. Get Current User (Query) - Requires Auth

Returns the authenticated user's information.

**GraphQL Query:**
```graphql
query Me {
  me {
    id
    username
    email
    firstName
    lastName
    userType
  }
}
```

**Postman Request:**
- Method: `POST`
- URL: `http://localhost:8090/query`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer <your-jwt-token>
  ```
- Body (raw JSON):
```json
{
  "query": "query Me { me { id username email firstName lastName userType } }"
}
```

#### 4. Get User by Username (Query) - Requires Auth

Returns information about a specific user.

**GraphQL Query:**
```graphql
query GetUser {
  user(username: "johndoe") {
    id
    username
    email
    firstName
    lastName
    userType
  }
}
```

**Postman Request:**
- Method: `POST`
- URL: `http://localhost:8090/query`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer <your-jwt-token>
  ```
- Body (raw JSON):
```json
{
  "query": "query GetUser($username: String!) { user(username: $username) { id username email firstName lastName userType } }",
  "variables": {
    "username": "johndoe"
  }
}
```

#### 5. Health Check (Query)

Simple health check endpoint.

**GraphQL Query:**
```graphql
query Health {
  health
}
```

**Postman Request:**
- Method: `POST`
- URL: `http://localhost:8090/query`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
```json
{
  "query": "query Health { health }"
}
```

## Testing with Postman

### Step-by-Step Testing Flow

1. **Register a new user:**
   - Use the Register mutation
   - Copy the returned `token` from the response

2. **Login with the user:**
   - Use the Login mutation
   - Verify you receive a token

3. **Test authenticated queries:**
   - Use the `me` query with the token in Authorization header
   - Use the `user` query with the token in Authorization header

### Example Response

```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "johndoe",
        "username": "johndoe",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "userType": "external"
      }
    }
  }
}
```

## Testing with GraphQL Playground

1. Open browser to `http://localhost:8090`
2. Use the built-in GraphQL Playground
3. Write queries/mutations in the left panel
4. Add authentication headers in the "HTTP HEADERS" section:
```json
{
  "Authorization": "Bearer <your-token-here>"
}
```

## LDAP Integration

### User Types

- **internal**: Created in `ou=users,ou=internal,dc=dbsaas,dc=local` (gidNumber: 1001)
- **external**: Created in `ou=users,ou=external,dc=dbsaas,dc=local` (gidNumber: 2001)

### LDAP Operations

The server performs the following LDAP operations:

1. **AuthenticateUser**: Searches for user and validates credentials via LDAP bind
2. **CreateUser**: Adds new inetOrgPerson entry with posixAccount attributes
3. **GetUserByUID**: Retrieves user information from LDAP

## Development

### Regenerate GraphQL Code

After modifying `schema.graphql`:

```bash
cd backend
go run github.com/99designs/gqlgen generate
```

### Add New Resolvers

1. Update `schema.graphql` with new queries/mutations
2. Run `go run github.com/99designs/gqlgen generate`
3. Implement resolver logic in `graph/schema.resolvers.go`

## Differences from TBDback

- Uses **GraphQL** instead of REST
- Simplified architecture (no PostgreSQL, no Kubernetes)
- JWT-only authentication (no database user management)
- Pure LDAP-based user storage
- Built-in GraphQL Playground for testing

## Future Enhancements

- [ ] React frontend with Apollo Client
- [ ] User password reset functionality
- [ ] User profile updates
- [ ] Role-based access control
- [ ] Refresh tokens
- [ ] LDAP connection pooling

## Troubleshooting

### LDAP Connection Failed

Make sure your LDAP server is running:
```bash
# Check if LDAP port is open
telnet localhost 389
```

Update LDAP configuration in `backend/ldap/client.go` if needed.

### Authorization Errors

Ensure you're sending the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### GraphQL Errors

Check the GraphQL Playground at `http://localhost:8090` for detailed error messages and schema documentation.
