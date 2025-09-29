// Enhanced Admin Service Client - Compatible with older JS
import { AdminServiceClient } from '../generated/admin_grpc_web_pb';
import {
  ListLDAPUsersRequest,
  GetLDAPUserRequest,
  DeleteLDAPUserRequest,
  UpdateLDAPPasswordRequest,
  GetNamespaceDetailsRequest,
  DeleteNamespaceRequest,
  GetAllNamespacesRequest,
  ListNamespaceResourcesRequest,
  GetSystemHealthRequest,
  GetAdminStatsRequest,
  GetUserDatabasesRequest,
} from '../generated/admin_pb';

class EnhancedAdminService {
  constructor() {
    const grpcUrl = process.env.REACT_APP_GRPC_URL || 'http://localhost:8080';
    this.client = new AdminServiceClient(grpcUrl, null, null);
    console.log('🔧 Enhanced Admin Service initialized with URL:', grpcUrl);
  }

  // Helper method for error handling
  handleError(err, operation) {
    console.error(`❌ gRPC ${operation} error:`, err);
    
    const errorMap = {
      14: 'Service unavailable - Admin service is down',
      13: 'Internal server error',
      16: 'Authentication required',
      7: 'Permission denied',
      5: 'Resource not found',
      3: 'Invalid request parameters',
      4: 'Operation timeout'
    };

    const message = errorMap[err.code] || err.message || 'Unknown error occurred';
    return new Error(message);
  }

  // LDAP Management
  listLDAPUsers(userType = '', page = 1, limit = 10) {
    return new Promise((resolve, reject) => {
      const request = new ListLDAPUsersRequest();
      request.setUserType(userType);
      request.setPage(page);
      request.setLimit(limit);

      console.log('🔄 gRPC call: ListLDAPUsers:', { userType, page, limit });

      this.client.listLDAPUsers(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'list LDAP users'));
          return;
        }

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          users: response.getUsersList().map(user => ({
            dn: user.getDn(),
            uid: user.getUid(),
            email: user.getEmail(),
            firstName: user.getFirstName(),
            lastName: user.getLastName(),
            userType: user.getUserType(),
            status: user.getStatus()
          })),
          totalCount: response.getTotalCount(),
          page: response.getPage(),
          limit: response.getLimit()
        });
      });
    });
  }

  getLDAPUser(username) {
    return new Promise((resolve, reject) => {
      const request = new GetLDAPUserRequest();
      request.setUsername(username);

      this.client.getLDAPUser(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get LDAP user'));
          return;
        }

        const user = response.getUser();
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          user: {
            dn: user.getDn(),
            uid: user.getUid(),
            email: user.getEmail(),
            firstName: user.getFirstName(),
            lastName: user.getLastName(),
            userType: user.getUserType(),
            status: user.getStatus()
          }
        });
      });
    });
  }

  deleteLDAPUser(username, force = false) {
    return new Promise((resolve, reject) => {
      const request = new DeleteLDAPUserRequest();
      request.setUsername(username);
      request.setForce(force);

      this.client.deleteLDAPUser(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'delete LDAP user'));
          return;
        }

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          username: response.getUsername(),
          deletedResources: response.getDeletedResourcesList()
        });
      });
    });
  }

  updateLDAPPassword(username, newPassword) {
    return new Promise((resolve, reject) => {
      const request = new UpdateLDAPPasswordRequest();
      request.setUsername(username);
      request.setNewPassword(newPassword);

      this.client.updateLDAPPassword(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'update LDAP password'));
          return;
        }

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          username: response.getUsername()
        });
      });
    });
  }

  // Namespace Management
  getAllNamespaces() {
    return new Promise((resolve, reject) => {
      const request = new GetAllNamespacesRequest();

      this.client.getAllNamespaces(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get all namespaces'));
          return;
        }

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          namespaces: response.getNamespacesList().map(ns => ({
            name: ns.getName(),
            createdAt: ns.getCreatedAt(),
            databaseCount: ns.getDatabaseCount(),
            status: ns.getStatus()
          }))
        });
      });
    });
  }

  getNamespaceDetails(namespace) {
    return new Promise((resolve, reject) => {
      const request = new GetNamespaceDetailsRequest();
      request.setNamespace(namespace);

      this.client.getNamespaceDetails(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get namespace details'));
          return;
        }

        const details = response.getDetails();
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          details: {
            name: details.getName(),
            createdAt: details.getCreatedAt(),
            databaseCount: details.getDatabaseCount(),
            status: details.getStatus(),
            resources: details.getResourcesList().map(resource => ({
              name: resource.getName(),
              kind: resource.getKind(),
              namespace: resource.getNamespace(),
              status: resource.getStatus()
            })),
            ownerUid: details.getOwnerUid()
          }
        });
      });
    });
  }

  deleteNamespace(namespace, force = false) {
    return new Promise((resolve, reject) => {
      const request = new DeleteNamespaceRequest();
      request.setNamespace(namespace);
      request.setForce(force);

      this.client.deleteNamespace(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'delete namespace'));
          return;
        }

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          namespace: response.getNamespace(),
          deletedResources: response.getDeletedResourcesList()
        });
      });
    });
  }

  listNamespaceResources(namespace, resourceType = '') {
    return new Promise((resolve, reject) => {
      const request = new ListNamespaceResourcesRequest();
      request.setNamespace(namespace);
      request.setResourceType(resourceType);

      this.client.listNamespaceResources(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'list namespace resources'));
          return;
        }

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          namespace: response.getNamespace(),
          resources: response.getResourcesList().map(resource => ({
            name: resource.getName(),
            kind: resource.getKind(),
            namespace: resource.getNamespace(),
            status: resource.getStatus()
          }))
        });
      });
    });
  }

  // Admin Operations
  getSystemHealth() {
    return new Promise((resolve, reject) => {
      const request = new GetSystemHealthRequest();

      this.client.getSystemHealth(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get system health'));
          return;
        }

        const health = response.getHealth();
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          health: {
            status: health.getStatus(),
            database: {
              status: health.getDatabase().getStatus(),
              message: health.getDatabase().getMessage()
            },
            kubernetes: {
              status: health.getKubernetes().getStatus(),
              message: health.getKubernetes().getMessage()
            },
            ldap: {
              status: health.getLdap().getStatus(),
              message: health.getLdap().getMessage()
            },
            traefik: {
              status: health.getTraefik().getStatus(),
              message: health.getTraefik().getMessage()
            }
          }
        });
      });
    });
  }

  getAdminStats() {
    return new Promise((resolve, reject) => {
      const request = new GetAdminStatsRequest();

      this.client.getAdminStats(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get admin stats'));
          return;
        }

        const stats = response.getStats();
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          stats: {
            totalUsers: stats.getTotalUsers(),
            totalNamespaces: stats.getTotalNamespaces(),
            totalDatabases: stats.getTotalDatabases(),
            activeDeployments: stats.getActiveDeployments()
          }
        });
      });
    });
  }

  getUserDatabases(namespace) {
    return new Promise((resolve, reject) => {
      const request = new GetUserDatabasesRequest();
      request.setNamespace(namespace);

      this.client.getUserDatabases(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get user databases'));
          return;
        }

        resolve({
          success: response.getSuccess(),
          namespace: response.getNamespace(),
          databases: response.getDatabasesList().map(db => ({
            name: db.getName(),
            type: db.getType(),
            status: db.getStatus(),
            namespace: db.getNamespace(),
            adminUrl: db.getAdminUrl(),
            adminType: db.getAdminType()
          })),
          count: response.getCount()
        });
      });
    });
  }

  // Test connection
  testConnection() {
    return this.getSystemHealth()
      .then(() => ({ connected: true, message: 'gRPC connection successful' }))
      .catch(error => ({ connected: false, message: error.message }));
  }
}

// Export singleton instance
const enhancedAdminService = new EnhancedAdminService();
export default enhancedAdminService;
export { EnhancedAdminService };