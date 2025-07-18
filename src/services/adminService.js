// src/services/adminService.js - gRPC service with direct connection support
import { AdminServiceClient } from '../generated/admin_grpc_web_pb';
import { 
  GetUserDatabasesRequest,
  DeleteDatabaseRequest,
  GetAllNamespacesRequest,
  CreateDatabaseRequest 
} from '../generated/admin_pb';

class AdminService {
  constructor() {
    // Configuration for different environments
    this.config = {
      // Local development - direct gRPC connection
      local: {
        url: 'http://localhost:50051',
        useProxy: false
      },
      // Production - through Envoy proxy
      production: {
        url: 'http://localhost:8080',
        useProxy: true
      }
    };

    // Determine environment (you can also use env variables)
    this.currentEnv = this.detectEnvironment();
    this.clientConfig = this.config[this.currentEnv];
    
    console.log(`🚀 gRPC Admin Service initialized in ${this.currentEnv} mode`);
    console.log(`📡 Connecting to: ${this.clientConfig.url}`);
    console.log(`🔄 Using proxy: ${this.clientConfig.useProxy}`);

    // Create gRPC client
    this.client = new AdminServiceClient(
      this.clientConfig.url, 
      null, 
      {
        // Add options for different environments
        unaryInterceptors: this.currentEnv === 'local' ? [] : undefined,
        streamInterceptors: this.currentEnv === 'local' ? [] : undefined
      }
    );
  }

  // Detect environment based on URL or explicit setting
  detectEnvironment() {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      // Check if REACT_APP_USE_DIRECT_GRPC is set
      if (process.env.REACT_APP_USE_DIRECT_GRPC === 'true') {
        return 'local';
      }
    }
    
    // Default to proxy mode
    return 'production';
  }

  // Switch between connection modes (for testing)
  switchToDirectMode() {
    console.log('🔄 Switching to direct gRPC mode...');
    this.currentEnv = 'local';
    this.clientConfig = this.config.local;
    this.client = new AdminServiceClient(this.clientConfig.url, null, null);
    console.log(`📡 Now connecting directly to: ${this.clientConfig.url}`);
  }

  switchToProxyMode() {
    console.log('🔄 Switching to proxy mode...');
    this.currentEnv = 'production';
    this.clientConfig = this.config.production;
    this.client = new AdminServiceClient(this.clientConfig.url, null, null);
    console.log(`📡 Now connecting through proxy: ${this.clientConfig.url}`);
  }

  // Get current connection info
  getConnectionInfo() {
    return {
      environment: this.currentEnv,
      url: this.clientConfig.url,
      useProxy: this.clientConfig.useProxy
    };
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

  // Enhanced error handling with connection mode info
  handleError(err, operation) {
    const connectionInfo = this.getConnectionInfo();
    console.error(`❌ gRPC ${operation} error (${connectionInfo.environment} mode):`, err);
    
    let errorMessage = err.message || `Failed to ${operation} via gRPC`;
    
    // Add helpful debugging info
    if (connectionInfo.environment === 'local') {
      errorMessage += `\n\n🔍 Debug Info (Local Mode):
- Connecting to: ${connectionInfo.url}
- Make sure your gRPC server is running on port 50051
- Check if the admin service is started: 'go run cmd/main.go'
- Verify gRPC reflection is enabled`;
    } else {
      errorMessage += `\n\n🔍 Debug Info (Proxy Mode):
- Connecting through: ${connectionInfo.url}
- Make sure Envoy proxy is running and configured
- Check if gRPC-Web transcoding is working`;
    }
    
    return new Error(errorMessage);
  }

  // Create database via gRPC
  async createDatabase(request) {
    return new Promise((resolve, reject) => {
      const grpcRequest = new CreateDatabaseRequest();
      grpcRequest.setName(request.name);
      grpcRequest.setUsername(request.username);
      grpcRequest.setPassword(request.password);
      grpcRequest.setType(request.type);
      grpcRequest.setUserId(request.userId);

      console.log('🔄 gRPC call: CreateDatabase', request);

      this.client.createDatabase(grpcRequest, {}, (err, response) => {
        if (err) {
          reject(this.handleError(err, 'create database'));
          return;
        }

        console.log('✅ gRPC createDatabase response:', response);

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

  // Get user databases via gRPC
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

  // Get all namespaces via gRPC (admin function)
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

  // Health check / connection test with detailed diagnostics
  async testConnection() {
    const connectionInfo = this.getConnectionInfo();
    
    try {
      console.log(`🔍 Testing gRPC connection (${connectionInfo.environment} mode)...`);
      console.log(`📡 Target: ${connectionInfo.url}`);
      
      const startTime = Date.now();
      await this.getAllNamespaces();
      const duration = Date.now() - startTime;
      
      console.log(`✅ gRPC connection successful in ${duration}ms`);
      return true;
    } catch (error) {
      console.error(`❌ gRPC connection failed (${connectionInfo.environment} mode):`, error.message);
      
      // Provide specific troubleshooting based on mode
      if (connectionInfo.environment === 'local') {
        console.log(`
🔧 Troubleshooting Direct gRPC Connection:
1. Ensure your admin service is running: 'cd Adminms/admin-service && go run cmd/main.go'
2. Check the service is listening on port 50051
3. Verify gRPC reflection is enabled in your server
4. Make sure there are no firewall issues
5. Try: 'grpcui -plaintext localhost:50051' to test the service
        `);
      } else {
        console.log(`
🔧 Troubleshooting Proxy Connection:
1. Ensure Envoy proxy is running and configured for gRPC-Web
2. Check proxy is listening on port 8080
3. Verify the proxy can reach the gRPC service
4. Check CORS configuration in Envoy
        `);
      }
      
      return false;
    }
  }

  // Diagnostic method to test both connection modes
  async diagnoseConnections() {
    console.log('🔍 Running comprehensive connection diagnostics...');
    
    const results = {
      direct: { success: false, error: null, duration: 0 },
      proxy: { success: false, error: null, duration: 0 }
    };

    // Test direct connection
    this.switchToDirectMode();
    try {
      const startTime = Date.now();
      await this.getAllNamespaces();
      results.direct.success = true;
      results.direct.duration = Date.now() - startTime;
      console.log('✅ Direct gRPC connection: SUCCESS');
    } catch (error) {
      results.direct.error = error.message;
      console.log('❌ Direct gRPC connection: FAILED');
    }

    // Test proxy connection
    this.switchToProxyMode();
    try {
      const startTime = Date.now();
      await this.getAllNamespaces();
      results.proxy.success = true;
      results.proxy.duration = Date.now() - startTime;
      console.log('✅ Proxy gRPC connection: SUCCESS');
    } catch (error) {
      results.proxy.error = error.message;
      console.log('❌ Proxy gRPC connection: FAILED');
    }

    console.log('📊 Diagnostic Results:', results);
    return results;
  }
}

// Export singleton instance
export default new AdminService();