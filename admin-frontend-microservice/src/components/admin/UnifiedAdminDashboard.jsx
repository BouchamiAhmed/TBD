// Create this file: src/components/admin/UnifiedAdminDashboard.jsx

import React, { useState, useEffect } from 'react';
//import adminService from 'adminService'; // We'll add this after creating the service

const UnifiedAdminDashboard = () => {
  const [namespaces, setNamespaces] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    initializeAdmin();
  }, []);

  const initializeAdmin = async () => {
    // For now, just set status to show the UI
    setConnectionStatus('testing');
    setError('Admin service integration pending - need to copy gRPC files first');
  };

  const testConnection = async () => {
    setError('Please copy your gRPC generated files first (admin_grpc_web_pb.js and admin_pb.js)');
  };

  const loadNamespaces = async () => {
    setError('gRPC service not connected yet');
  };

  const handleDeleteDatabase = async (database) => {
    alert('Delete functionality will work after gRPC setup');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="font-medium">
              gRPC Admin Service: {connectionStatus}
            </span>
            <span className="text-sm text-gray-500">
              (Port 50051)
            </span>
          </div>
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Connection
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-orange-600">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Namespaces</p>
              <p className="text-3xl font-bold text-blue-600">{namespaces.length}</p>
            </div>
            <div className="text-3xl">🏗️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Databases</p>
              <p className="text-3xl font-bold text-green-600">{databases.length}</p>
            </div>
            <div className="text-3xl">🗄️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Running Services</p>
              <p className="text-3xl font-bold text-purple-600">0</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">
          🚀 Setup Instructions
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>1. Copy gRPC Files:</strong></p>
          <code className="block bg-blue-100 p-2 rounded font-mono text-xs">
            copy ..\src\generated\admin_grpc_web_pb.js src\generated\<br/>
            copy ..\src\generated\admin_pb.js src\generated\
          </code>
          
          <p className="pt-2"><strong>2. Start Admin gRPC Service:</strong></p>
          <code className="block bg-blue-100 p-2 rounded font-mono text-xs">
            cd Adminms/admin-service && go run cmd/main.go
          </code>
          
          <p className="pt-2"><strong>3. Uncomment adminService import in this file</strong></p>
        </div>
      </div>

      {/* Placeholder Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Database Deployments (Waiting for gRPC connection...)
          </h3>
        </div>
        
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Waiting for gRPC setup...</p>
          <p className="text-sm text-gray-400 mt-2">
            Copy your generated gRPC files to see real data
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAdminDashboard;