import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';

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
    await testConnection();
    await loadNamespaces();
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const isConnected = await adminService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (!isConnected) {
        setError('Failed to connect to admin gRPC service on port 50051');
      }
    } catch (error) {
      setConnectionStatus('error');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNamespaces = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllNamespaces();
      setNamespaces(response.namespaces || []);
      
      // Load databases for all namespaces
      await loadAllDatabases(response.namespaces || []);
      
      setError('');
    } catch (error) {
      setError(error.message);
      console.error('Error loading namespaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllDatabases = async (namespaceList) => {
    const allDatabases = [];
    
    for (const namespace of namespaceList) {
      try {
        const response = await adminService.getUserDatabases(null, namespace.name);
        allDatabases.push(...response.databases);
      } catch (error) {
        console.error(`Error loading databases for ${namespace.name}:`, error);
      }
    }
    
    setDatabases(allDatabases);
  };

  const handleDeleteDatabase = async (database) => {
    if (!window.confirm(`Are you sure you want to delete ${database.name}?`)) {
      return;
    }

    try {
      await adminService.deleteDatabase(database.name, database.namespace);
      await loadNamespaces(); // Refresh all data
    } catch (error) {
      setError(`Failed to delete database: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredDatabases = selectedNamespace 
    ? databases.filter(db => db.namespace === selectedNamespace)
    : databases;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${
        connectionStatus === 'connected' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
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
          <div className="mt-2 text-sm text-red-600">
            {error}
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
              <p className="text-3xl font-bold text-purple-600">
                {databases.filter(db => db.status === 'running').length}
              </p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns.name} value={ns.name}>
                  {ns.name} ({ns.databaseCount} DBs)
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadNamespaces}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <span>🔄</span>
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Databases Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Database Deployments ({filteredDatabases.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500">Loading databases...</p>
          </div>
        ) : filteredDatabases.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🗃️</div>
            <p className="text-gray-500">No databases found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Namespace</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDatabases.map((database, index) => (
                  <tr key={`${database.namespace}-${database.name}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {database.type === 'mysql' ? '🐬' : '🐘'}
                        </span>
                        <div className="text-sm font-medium text-gray-900">
                          {database.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        database.type === 'mysql' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {database.type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {database.namespace}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(database.status)}`}>
                        {database.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {database.adminUrl ? (
                        <a
                          href={database.adminUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                        >
                          <span>🔗</span>
                          <span>{database.adminType}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteDatabase(database)}
                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedAdminDashboard;