// Enhanced Admin Service Client with LDAP and Namespace Management
import { AdminServiceClient } from '../generated/admin_grpc_web_pb';
import {
  // Existing imports
  LoginRequest,
  RegisterRequest,
  CreateDatabaseRequest,
  GetUserDatabasesRequest,
  DeleteDatabaseRequest,
  GetAllNamespacesRequest,
  
  // New LDAP Management imports
  ListLDAPUsersRequest,
  GetLDAPUserRequest,
  CreateLDAPUserRequest,
  UpdateLDAPUserRequest,
  DeleteLDAPUserRequest,
  UpdateLDAPPasswordRequest,
  
  // New Namespace Management imports
  GetNamespaceDetailsRequest,
  DeleteNamespaceRequest,
  CleanupNamespaceResourcesRequest,
  
  // New Resource Management imports
  ListNamespaceResourcesRequest,
  DeleteNamespaceResourceRequest,
  
  // New Admin Operations imports
  GetSystemHealthRequest,
  GetAdminStatsRequest
} from '../generated/admin_pb';

class EnhancedAdminService {
  constructor() {
    const grpcUrl = process.env.REACT_APP_GRPC_URL || 'http://localhost:8080';
    this.client = new AdminServiceClient(grpcUrl, null, null);
    console.log('🔧 Enhanced Admin Service initialized with URL:', grpcUrl);
  }

  async deleteLDAPUser(username, force = false) {
    return new Promise((resolve, reject) => {
      const request = new DeleteLDAPUserRequest();
      request.setUsername(username);
      request.setForce(force);

      console.log('🔄 gRPC call: DeleteLDAPUser:', { username, force });

      this.client.deleteLDAPUser(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'delete LDAP user'));
          return;
        }

        console.log('✅ gRPC deleteLDAPUser response:', response);
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          username: response.getUsername(),
          deletedResources: response.getDeletedResourcesList()
        });
      });
    });
  }

  async updateLDAPPassword(username, newPassword) {
    return new Promise((resolve, reject) => {
      const request = new UpdateLDAPPasswordRequest();
      request.setUsername(username);
      request.setNewPassword(newPassword);

      console.log('🔄 gRPC call: UpdateLDAPPassword for:', username);

      this.client.updateLDAPPassword(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'update LDAP password'));
          return;
        }

        console.log('✅ gRPC updateLDAPPassword response:', response);
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          username: response.getUsername()
        });
      });
    });
  }

  // ============ NEW NAMESPACE MANAGEMENT METHODS ============

  async getNamespaceDetails(namespace) {
    return new Promise((resolve, reject) => {
      const request = new GetNamespaceDetailsRequest();
      request.setNamespace(namespace);

      console.log('🔄 gRPC call: GetNamespaceDetails for:', namespace);

      this.client.getNamespaceDetails(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get namespace details'));
          return;
        }

        console.log('✅ gRPC getNamespaceDetails response:', response);
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
              createdAt: resource.getCreatedAt(),
              labels: resource.getLabelsMap(),
              status: resource.getStatus(),
              ownerReference: resource.getOwnerReference()
            })),
            ownerUid: details.getOwnerUid(),
            labels: details.getLabelsMap(),
            annotations: details.getAnnotationsMap()
          }
        });
      });
    });
  }

  async deleteNamespace(namespace, force = false) {
    return new Promise((resolve, reject) => {
      const request = new DeleteNamespaceRequest();
      request.setNamespace(namespace);
      request.setForce(force);

      console.log('🔄 gRPC call: DeleteNamespace:', { namespace, force });

      this.client.deleteNamespace(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'delete namespace'));
          return;
        }

        console.log('✅ gRPC deleteNamespace response:', response);
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          namespace: response.getNamespace(),
          deletedResources: response.getDeletedResourcesList()
        });
      });
    });
  }

  async cleanupNamespaceResources(namespace, resourceTypes) {
    return new Promise((resolve, reject) => {
      const request = new CleanupNamespaceResourcesRequest();
      request.setNamespace(namespace);
      request.setResourceTypesList(resourceTypes);

      console.log('🔄 gRPC call: CleanupNamespaceResources:', { namespace, resourceTypes });

      this.client.cleanupNamespaceResources(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'cleanup namespace resources'));
          return;
        }

        console.log('✅ gRPC cleanupNamespaceResources response:', response);
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          namespace: response.getNamespace(),
          cleanupResults: response.getCleanupResultsList().map(result => ({
            resourceType: result.getResourceType(),
            resourceName: result.getResourceName(),
            deleted: result.getDeleted(),
            errorMessage: result.getErrorMessage()
          }))
        });
      });
    });
  }

  // ============ NEW RESOURCE MANAGEMENT METHODS ============

  async listNamespaceResources(namespace, resourceType = '') {
    return new Promise((resolve, reject) => {
      const request = new ListNamespaceResourcesRequest();
      request.setNamespace(namespace);
      request.setResourceType(resourceType);

      console.log('🔄 gRPC call: ListNamespaceResources:', { namespace, resourceType });

      this.client.listNamespaceResources(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'list namespace resources'));
          return;
        }

        console.log('✅ gRPC listNamespaceResources response:', response);
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          namespace: response.getNamespace(),
          resources: response.getResourcesList().map(resource => ({
            name: resource.getName(),
            kind: resource.getKind(),
            namespace: resource.getNamespace(),
            createdAt: resource.getCreatedAt(),
            labels: resource.getLabelsMap(),
            status: resource.getStatus(),
            ownerReference: resource.getOwnerReference()
          }))
        });
      });
    });
  }

  async deleteNamespaceResource(namespace, resourceType, resourceName) {
    return new Promise((resolve, reject) => {
      const request = new DeleteNamespaceResourceRequest();
      request.setNamespace(namespace);
      request.setResourceType(resourceType);
      request.setResourceName(resourceName);

      console.log('🔄 gRPC call: DeleteNamespaceResource:', { namespace, resourceType, resourceName });

      this.client.deleteNamespaceResource(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'delete namespace resource'));
          return;
        }

        console.log('✅ gRPC deleteNamespaceResource response:', response);
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          namespace: response.getNamespace(),
          resourceType: response.getResourceType(),
          resourceName: response.getResourceName()
        });
      });
    });
  }

  // ============ NEW ADMIN OPERATIONS METHODS ============

  async getSystemHealth() {
    return new Promise((resolve, reject) => {
      const request = new GetSystemHealthRequest();

      console.log('🔄 gRPC call: GetSystemHealth');

      this.client.getSystemHealth(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get system health'));
          return;
        }

        console.log('✅ gRPC getSystemHealth response:', response);
        const health = response.getHealth();
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          health: {
            status: health.getStatus(),
            database: {
              status: health.getDatabase().getStatus(),
              message: health.getDatabase().getMessage(),
              lastCheck: health.getDatabase().getLastCheck()
            },
            kubernetes: {
              status: health.getKubernetes().getStatus(),
              message: health.getKubernetes().getMessage(),
              lastCheck: health.getKubernetes().getLastCheck()
            },
            ldap: {
              status: health.getLdap().getStatus(),
              message: health.getLdap().getMessage(),
              lastCheck: health.getLdap().getLastCheck()
            },
            traefik: {
              status: health.getTraefik().getStatus(),
              message: health.getTraefik().getMessage(),
              lastCheck: health.getTraefik().getLastCheck()
            },
            metrics: health.getMetricsMap()
          }
        });
      });
    });
  }

  async getAdminStats() {
    return new Promise((resolve, reject) => {
      const request = new GetAdminStatsRequest();

      console.log('🔄 gRPC call: GetAdminStats');

      this.client.getAdminStats(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get admin stats'));
          return;
        }

        console.log('✅ gRPC getAdminStats response:', response);
        const stats = response.getStats();
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          stats: {
            totalUsers: stats.getTotalUsers(),
            totalNamespaces: stats.getTotalNamespaces(),
            totalDatabases: stats.getTotalDatabases(),
            activeDeployments: stats.getActiveDeployments(),
            databaseTypes: stats.getDatabaseTypesMap(),
            userTypes: stats.getUserTypesMap(),
            lastUpdated: stats.getLastUpdated()
          }
        });
      });
    });
  }

  // ============ UTILITY METHODS ============

  // Test gRPC connection
  async testConnection() {
    try {
      await this.getSystemHealth();
      return { connected: true, message: 'gRPC connection successful' };
    } catch (error) {
      console.error('🔌 gRPC connection test failed:', error);
      return { connected: false, message: error.message };
    }
  }

  // Batch operations for efficiency
  async batchDeleteResources(namespace, resources) {
    const results = [];
    
    for (const resource of resources) {
      try {
        const result = await this.deleteNamespaceResource(
          namespace, 
          resource.kind.toLowerCase(), 
          resource.name
        );
        results.push({ ...resource, success: true, message: result.message });
      } catch (error) {
        results.push({ ...resource, success: false, message: error.message });
      }
    }
    
    return results;
  }

  // Search LDAP users with filters
  async searchLDAPUsers(searchTerm, userType = '') {
    try {
      const response = await this.listLDAPUsers(userType, 1, 100);
      
      if (!searchTerm) {
        return response;
      }

      const filteredUsers = response.users.filter(user => 
        user.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return {
        ...response,
        users: filteredUsers,
        totalCount: filteredUsers.length
      };
    } catch (error) {
      throw this.handleError(error, 'search LDAP users');
    }
  }

  // Get namespace summary with enhanced details
  async getNamespaceSummary(namespace) {
    try {
      const [details, databases] = await Promise.all([
        this.getNamespaceDetails(namespace),
        this.getUserDatabases(namespace)
      ]);

      return {
        ...details.details,
        databases: databases.databases,
        summary: {
          totalResources: details.details.resources.length,
          totalDatabases: databases.count,
          resourceTypes: [...new Set(details.details.resources.map(r => r.kind))],
          databaseTypes: [...new Set(databases.databases.map(db => db.type))]
        }
      };
    } catch (error) {
      throw this.handleError(error, 'get namespace summary');
    }
  }

  // Monitor system health with polling
  startHealthMonitoring(callback, intervalMs = 30000) {
    const monitor = async () => {
      try {
        const health = await this.getSystemHealth();
        callback(null, health);
      } catch (error) {
        callback(error, null);
      }
    };

    // Initial check
    monitor();
    
    // Set up interval
    const intervalId = setInterval(monitor, intervalMs);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

// Export singleton instance
const enhancedAdminService = new EnhancedAdminService();
export default enhancedAdminService;

// Also export the class for custom instances
export { EnhancedAdminService };

// Usage examples in comments:
/*
// Basic usage:
import adminService from './services/enhancedAdminService';

// LDAP Management
const users = await adminService.listLDAPUsers('external', 1, 20);
const user = await adminService.getLDAPUser('john.doe');
await adminService.deleteLDAPUser('john.doe', true); // force delete

// Namespace Management
const namespaces = await adminService.getAllNamespaces();
const details = await adminService.getNamespaceDetails('user-john-doe');
await adminService.deleteNamespace('user-john-doe', true); // force delete

// Resource Management
const resources = await adminService.listNamespaceResources('user-john-doe', 'deployments');
await adminService.deleteNamespaceResource('user-john-doe', 'deployment', 'mysql-db');

// Admin Operations
const health = await adminService.getSystemHealth();
const stats = await adminService.getAdminStats();

// Utility functions
const summary = await adminService.getNamespaceSummary('user-john-doe');
const searchResults = await adminService.searchLDAPUsers('john', 'external');

// Health monitoring
const stopMonitoring = adminService.startHealthMonitoring((err, health) => {
  if (err) {
    console.error('Health check failed:', err);
  } else {
    console.log('System status:', health.health.status);
  }
}, 60000); // Check every minute

// Stop monitoring when component unmounts
// stopMonitoring();
*/

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

  // ============ EXISTING METHODS ============
  
  async login(username, password) {
    return new Promise((resolve, reject) => {
      const request = new LoginRequest();
      request.setUsername(username);
      request.setPassword(password);

      console.log('🔄 gRPC call: Login for user:', username);

      this.client.login(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'login'));
          return;
        }

        console.log('✅ gRPC login response:', response);
        resolve({
          user: response.getUser(),
          token: response.getToken()
        });
      });
    });
  }

  async getUserDatabases(namespace) {
    return new Promise((resolve, reject) => {
      const request = new GetUserDatabasesRequest();
      request.setNamespace(namespace);

      console.log('🔄 gRPC call: GetUserDatabases for namespace:', namespace);

      this.client.getUserDatabases(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get user databases'));
          return;
        }

        console.log('✅ gRPC getUserDatabases response:', response);
        resolve({
          success: response.getSuccess(),
          namespace: response.getNamespace(),
          databases: response.getDatabasesList().map(db => ({
            name: db.getName(),
            type: db.getType(),
            status: db.getStatus(),
            namespace: db.getNamespace(),
            userId: db.getUserId(),
            adminUrl: db.getAdminUrl(),
            adminType: db.getAdminType(),
            createdAt: db.getCreatedAt()
          })),
          count: response.getCount()
        });
      });
    });
  }

  async deleteDatabase(namespace, name) {
    return new Promise((resolve, reject) => {
      const request = new DeleteDatabaseRequest();
      request.setNamespace(namespace);
      request.setName(name);

      console.log('🔄 gRPC call: DeleteDatabase:', { namespace, name });

      this.client.deleteDatabase(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'delete database'));
          return;
        }

        console.log('✅ gRPC deleteDatabase response:', response);
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          name: response.getName(),
          namespace: response.getNamespace()
        });
      });
    });
  }

  async getAllNamespaces() {
    return new Promise((resolve, reject) => {
      const request = new GetAllNamespacesRequest();

      console.log('🔄 gRPC call: GetAllNamespaces');

      this.client.getAllNamespaces(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get all namespaces'));
          return;
        }

        console.log('✅ gRPC getAllNamespaces response:', response);
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

  // ============ NEW LDAP MANAGEMENT METHODS ============

  async listLDAPUsers(userType = '', page = 1, limit = 10) {
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

        console.log('✅ gRPC listLDAPUsers response:', response);
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
            createdAt: user.getCreatedAt(),
            status: user.getStatus()
          })),
          totalCount: response.getTotalCount(),
          page: response.getPage(),
          limit: response.getLimit()
        });
      });
    });
  }

  async getLDAPUser(username) {
    return new Promise((resolve, reject) => {
      const request = new GetLDAPUserRequest();
      request.setUsername(username);

      console.log('🔄 gRPC call: GetLDAPUser for:', username);

      this.client.getLDAPUser(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get LDAP user'));
          return;
        }

        console.log('✅ gRPC getLDAPUser response:', response);
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
            createdAt: user.getCreatedAt(),
            status: user.getStatus()
          }
        });
      });
    });
  }

  async createLDAPUser(userData) {
    return new Promise((resolve, reject) => {
      const request = new CreateLDAPUserRequest();
      request.setUsername(userData.username);
      request.setEmail(userData.email);
      request.setPassword(userData.password);
      request.setFirstName(userData.firstName);
      request.setLastName(userData.lastName);
      request.setUserType(userData.userType);

      console.log('🔄 gRPC call: CreateLDAPUser:', userData.username);

      this.client.createLDAPUser(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'create LDAP user'));
          return;
        }

        console.log('✅ gRPC createLDAPUser response:', response);
        const user = response.getUser();
        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          user: {
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

  async updateLDAPUser(username, userData) {
    return new Promise((resolve, reject) => {
      const request = new UpdateLDAPUserRequest();
      request.setUsername(username);
      request.setEmail(userData.email);
      request.setFirstName(userData.firstName);
      request.setLastName(userData.lastName);
      request.setUserType(userData.userType);

      console.log('🔄 gRPC call: UpdateLDAPUser:', username);

      this.client.updateLDAPUser(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'update LDAP user'));
          return;
        }

        console.log('✅ gRPC updateLDAPUser response:', response);
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