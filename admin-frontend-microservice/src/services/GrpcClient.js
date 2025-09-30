// src/services/grpcClient.js
import { AdminServiceClient } from '../generated/admin_grpc_web_pb';
import * as pb from '../generated/admin_pb';

class GrpcWebClient {
  constructor() {
    const config = window.CONFIG || {};
    const grpcUrl = config.GRPC_WEB_URL || 'http://10.9.21.201/admin-tbd';
    
    console.log('Initializing gRPC-Web client:', grpcUrl);
    this.client = new AdminServiceClient(grpcUrl, null, null);
  }

  async login(username, password) {
    return new Promise((resolve, reject) => {
      const request = new pb.LoginRequest();
      request.setUsername(username);
      request.setPassword(password);

      this.client.login(request, {}, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          success: response.getSuccess(),
          token: response.getToken()
        });
      });
    });
  }

  async getUserDatabases(namespace) {
    return new Promise((resolve, reject) => {
      const request = new pb.GetUserDatabasesRequest();
      request.setNamespace(namespace);

      const token = localStorage.getItem('adminToken');
      const metadata = token ? { 'authorization': `Bearer ${token}` } : {};

      this.client.getUserDatabases(request, metadata, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          databases: response.getDatabasesList().map(db => ({
            name: db.getName(),
            type: db.getType(),
            status: db.getStatus()
          }))
        });
      });
    });
  }
}

export default new GrpcWebClient();