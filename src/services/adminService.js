// src/services/adminService.js - gRPC service for admin operations
import { AdminServiceClient } from '../generated/admin_grpc_web_pb';
import { 
  GetUserDatabasesRequest,
  DeleteDatabaseRequest,
  GetAllNamespacesRequest 
} from '../generated/admin_pb';

class AdminService {
  constructor() {
    // Envoy proxy endpoint - adjust as needed
    this.client = new AdminServiceClient('http://localhost:8080', null, null);
  }

  // Convert gRPC timestamp to JavaScript Date
  timestampToDate(timestamp) {
    if (!timestamp) return new Date();
    return new Date(timestamp.getSeconds() * 1000 + timestamp.getNanos() / 1000000);
  }

  // Convert gRPC Database to frontend format
  convertDatabase(grpcDatabase) {
    return {
      name: grpcDatabase.getName(),
      type: grpcDatabase.getType(),
      status: grpcDatabase.getStatus(),
      namespace: grpcDatabase.getNamespace(),
      userId: grpcDatabase.getUserId(),
      adminUrl: grpcDatabase.getAdminUrl(),
      adminType: grpcDatabase.getAdminType(),
      createdAt: this.timestampToDate(grpcDatabase.getCreatedAt())
    };
  }

  // Get user databases via gRPC
  async getUserDatabases(namespace) {
    return new Promise((resolve, reject) => {
      const request = new GetUserDatabasesRequest();
      request.setNamespace(namespace);

      console.log('🔄 gRPC call: GetUserDatabases for namespace:', namespace);

      this.client.getUserDatabases(request, {}, (err, response) => {
        if (err) {
          console.error('❌ gRPC getUserDatabases error:', err);
          reject(new Error(err.message || 'Failed to get databases via gRPC'));
          return;
        }

        console.log('✅ gRPC getUserDatabases response:', response);

        const databases = response.getDatabasesList().map(db => this.convertDatabase(db));

        resolve({
          success: response.getSuccess(),
          namespace: response.getNamespace(),
          databases,
          count: response.getCount()
        });
      });
    });
  }

  // Delete database via gRPC
  async deleteDatabase(namespace, name) {
    return new Promise((resolve, reject) => {
      const request = new DeleteDatabaseRequest();
      request.setNamespace(namespace);
      request.setName(name);

      console.log('🔄 gRPC call: DeleteDatabase:', { namespace, name });

      this.client.deleteDatabase(request, {}, (err, response) => {
        if (err) {
          console.error('❌ gRPC deleteDatabase error:', err);
          reject(new Error(err.message || 'Failed to delete database via gRPC'));
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

  // Get all namespaces via gRPC (admin function)
  async getAllNamespaces() {
    return new Promise((resolve, reject) => {
      const request = new GetAllNamespacesRequest();

      console.log('🔄 gRPC call: GetAllNamespaces');

      this.client.getAllNamespaces(request, {}, (err, response) => {
        if (err) {
          console.error('❌ gRPC getAllNamespaces error:', err);
          reject(new Error(err.message || 'Failed to get namespaces via gRPC'));
          return;
        }

        console.log('✅ gRPC getAllNamespaces response:', response);

        const namespaces = response.getNamespacesList().map(ns => ({
          name: ns.getName(),
          createdAt: this.timestampToDate(ns.getCreatedAt()),
          databaseCount: ns.getDatabaseCount(),
          status: ns.getStatus()
        }));

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          namespaces
        });
      });
    });
  }

  // Health check / connection test
  async testConnection() {
    try {
      console.log('🔍 Testing gRPC connection...');
      await this.getAllNamespaces();
      console.log('✅ gRPC connection successful');
      return true;
    } catch (error) {
      console.error('❌ gRPC connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new AdminService();