import { AdminServiceClient } from '../generated/admin_grpc_web_pb';
import { 
  GetUserDatabasesRequest,
  DeleteDatabaseRequest,
  GetAllNamespacesRequest,
  CreateDatabaseRequest 
} from '../generated/admin_pb';

class AdminService {
  constructor() {
    // Configuration for admin microservice
    this.config = {
      local: {
        url: 'http://localhost:50051', // Your existing admin gRPC service
        useProxy: false
      },
      production: {
        url: 'http://localhost:8080', // Through Envoy proxy
        useProxy: true
      }
    };

    this.currentEnv = process.env.REACT_APP_USE_DIRECT_GRPC === 'true' ? 'local' : 'production';
    this.clientConfig = this.config[this.currentEnv];
    
    console.log(`🚀 Admin Microservice connecting to: ${this.clientConfig.url}`);

    this.client = new AdminServiceClient(this.clientConfig.url, null, {
      unaryInterceptors: this.currentEnv === 'local' ? [] : undefined,
      streamInterceptors: this.currentEnv === 'local' ? [] : undefined
    });
  }

  // Get connection info
  getConnectionInfo() {
    return {
      environment: this.currentEnv,
      url: this.clientConfig.url,
      useProxy: this.clientConfig.useProxy
    };
  }

  // Convert gRPC timestamp to Date
  timestampToDate(timestamp) {
    if (!timestamp) return new Date();
    return new Date(timestamp.getSeconds() * 1000 + timestamp.getNanos() / 1000000);
  }

  // Handle gRPC errors
  handleError(err, operation) {
    console.error(`❌ gRPC ${operation} error:`, err);
    return new Error(`Failed to ${operation}: ${err.message}`);
  }

  // Get all namespaces
  async getAllNamespaces() {
    return new Promise((resolve, reject) => {
      const request = new GetAllNamespacesRequest();
      
      this.client.getAllNamespaces(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get all namespaces'));
          return;
        }

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

  // Get user databases
  async getUserDatabases(userId = null, namespace = null) {
    return new Promise((resolve, reject) => {
      const request = new GetUserDatabasesRequest();
      
      if (userId) request.setUserId(userId);
      if (namespace) request.setNamespace(namespace);

      this.client.getUserDatabases(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'get user databases'));
          return;
        }

        const databases = response.getDatabasesList().map(db => ({
          name: db.getName(),
          type: db.getType(),
          status: db.getStatus(),
          namespace: db.getNamespace(),
          userId: db.getUserId(),
          adminUrl: db.getAdminUrl(),
          adminType: db.getAdminType(),
          createdAt: this.timestampToDate(db.getCreatedAt())
        }));

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          databases
        });
      });
    });
  }

  // Delete database
  async deleteDatabase(name, namespace) {
    return new Promise((resolve, reject) => {
      const request = new DeleteDatabaseRequest();
      request.setName(name);
      request.setNamespace(namespace);

      this.client.deleteDatabase(request, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'delete database'));
          return;
        }

        resolve({
          success: response.getSuccess(),
          message: response.getMessage(),
          name: response.getName(),
          namespace: response.getNamespace()
        });
      });
    });
  }

  // Create database
  async createDatabase(request) {
    return new Promise((resolve, reject) => {
      const grpcRequest = new CreateDatabaseRequest();
      grpcRequest.setName(request.name);
      grpcRequest.setUsername(request.username);
      grpcRequest.setPassword(request.password);
      grpcRequest.setType(request.type);
      grpcRequest.setUserId(request.userId);

      this.client.createDatabase(grpcRequest, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'create database'));
          return;
        }

        resolve({
          name: response.getName(),
          host: response.getHost(),
          port: response.getPort(),
          username: response.getUsername(),
          type: response.getType(),
          status: response.getStatus(),
          message: response.getMessage(),
          namespace: response.getNamespace(),
          adminUrl: response.getAdminUrl(),
          adminType: response.getAdminType()
        });
      });
    });
  }

  // Test connection
  async testConnection() {
    try {
      await this.getAllNamespaces();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export default new AdminService();