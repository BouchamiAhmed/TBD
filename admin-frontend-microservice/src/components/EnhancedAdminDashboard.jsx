import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Database, 
  Server, 
  Trash2, 
  Plus, 
  Edit, 
  Eye, 
  Key,
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
} from 'lucide-react';
import { AdminServiceClient } from '../generated/admin_grpc_web_pb';
import { 
  ListLDAPUsersRequest,
  GetAllNamespacesRequest,
  GetNamespaceDetailsRequest,
  DeleteNamespaceRequest,
  DeleteLDAPUserRequest,
  GetUserDatabasesRequest,
  DeleteDatabaseRequest
} from '../generated/admin_pb';

// Enhanced Admin Dashboard - REAL GRPC SERVICE
const EnhancedAdminDashboard = () => {
  // Define tabs at the TOP of the component
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'ldap', label: 'LDAP Users', icon: Users },
    { id: 'namespaces', label: 'Namespaces', icon: Server },
    { id: 'databases', label: 'Databases', icon: Database },
  ];

  const [activeTab, setActiveTab] = useState('dashboard');
  const [ldapUsers, setLdapUsers] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // REAL gRPC Client - LoadBalancer on port 8032
  const grpcUrl = process.env.REACT_APP_GRPC_URL || 'http://localhost:8032';
  const [grpcClient] = useState(() => {
    console.log('🔌 Connecting to gRPC service:', grpcUrl);
    return new AdminServiceClient(grpcUrl, null, null);
  });

  // Helper to convert gRPC timestamp to Date
  const timestampToDate = (timestamp) => {
    if (!timestamp) return new Date();
    return new Date(timestamp.getSeconds() * 1000 + timestamp.getNanos() / 1000000);
  };

  useEffect(() => {
    loadSystemHealth();
    loadAdminStats();
  }, []);

  const loadSystemHealth = async () => {
    // Mock for now - implement GetSystemHealth RPC in backend if needed
    setSystemHealth({
      status: 'healthy',
      database: { status: 'connected', message: 'OK' },
      kubernetes: { status: 'connected', message: 'OK' },
      ldap: { status: 'connected', message: 'OK' },
      traefik: { status: 'connected', message: 'OK' }
    });
  };

  const loadAdminStats = async () => {
    try {
      // Calculate stats from real data
      const ldapResponse = await loadLdapUsersData('', 1, 1000);
      const namespacesResponse = await loadNamespacesData();
      const databasesResponse = await loadDatabasesData();

      const mysqlCount = databasesResponse.filter(db => db.type === 'mysql').length;
      const postgresCount = databasesResponse.filter(db => db.type === 'postgresql').length;
      const internalUsers = ldapResponse.filter(u => u.userType === 'internal').length;
      const externalUsers = ldapResponse.filter(u => u.userType === 'external').length;

      setAdminStats({
        totalUsers: ldapResponse.length,
        totalNamespaces: namespacesResponse.length,
        totalDatabases: databasesResponse.length,
        activeDeployments: databasesResponse.length,
        databaseTypes: { mysql: mysqlCount, postgresql: postgresCount },
        userTypes: { internal: internalUsers, external: externalUsers }
      });
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const loadLdapUsersData = (userType = '', page = 1, limit = 1000) => {
    return new Promise((resolve, reject) => {
      const request = new ListLDAPUsersRequest();
      request.setUserType(userType);
      request.setPage(page);
      request.setLimit(limit);

      console.log('📡 gRPC: ListLDAPUsers', { userType, page, limit });

      grpcClient.listLDAPUsers(request, {}, (err, response) => {
        if (err) {
          console.error('❌ gRPC ListLDAPUsers failed:', err);
          reject(err);
          return;
        }

        const users = response.getUsersList().map(user => ({
          uid: user.getUid(),
          email: user.getEmail(),
          firstName: user.getFirstName(),
          lastName: user.getLastName(),
          userType: user.getUserType(),
          status: user.getStatus(),
          dn: user.getDn()
        }));

        console.log('✅ Retrieved', users.length, 'LDAP users');
        resolve(users);
      });
    });
  };

  const loadLdapUsers = async (userType = '') => {
    setLoading(true);
    try {
      const users = await loadLdapUsersData(userType);
      setLdapUsers(users);
      setError('');
    } catch (err) {
      setError('Failed to load LDAP users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNamespacesData = () => {
    return new Promise((resolve, reject) => {
      const request = new GetAllNamespacesRequest();

      console.log('📡 gRPC: GetAllNamespaces');

      grpcClient.getAllNamespaces(request, {}, (err, response) => {
        if (err) {
          console.error('❌ gRPC GetAllNamespaces failed:', err);
          reject(err);
          return;
        }

        const namespaces = response.getNamespacesList().map(ns => ({
          name: ns.getName(),
          createdAt: timestampToDate(ns.getCreatedAt()),
          databaseCount: ns.getDatabaseCount(),
          status: ns.getStatus()
        }));

        console.log('✅ Retrieved', namespaces.length, 'namespaces');
        resolve(namespaces);
      });
    });
  };

  const loadNamespaces = async () => {
    setLoading(true);
    try {
      const namespaces = await loadNamespacesData();
      setNamespaces(namespaces);
      setError('');
    } catch (err) {
      setError('Failed to load namespaces: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDatabasesData = async () => {
    try {
      // Get all namespaces first
      const namespacesList = await loadNamespacesData();
      const allDatabases = [];

      // Get databases for each namespace
      for (const namespace of namespacesList) {
        await new Promise((resolve) => {
          const request = new GetUserDatabasesRequest();
          request.setNamespace(namespace.name);

          grpcClient.getUserDatabases(request, {}, (err, response) => {
            if (err) {
              console.warn(`Failed to get databases for ${namespace.name}:`, err.message);
              resolve();
              return;
            }

            const dbs = response.getDatabasesList().map(db => ({
              name: db.getName(),
              type: db.getType(),
              namespace: db.getNamespace(),
              status: db.getStatus(),
              createdAt: timestampToDate(db.getCreatedAt()),
              username: db.getUsername(),
              adminUrl: db.getAdminUrl(),
              adminType: db.getAdminType()
            }));

            allDatabases.push(...dbs);
            resolve();
          });
        });
      }

      console.log('✅ Retrieved', allDatabases.length, 'total databases');
      return allDatabases;
    } catch (err) {
      console.error('Failed to load databases:', err);
      return [];
    }
  };

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const databases = await loadDatabasesData();
      setDatabases(databases);
      setError('');
    } catch (err) {
      setError('Failed to load databases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user: ${user.firstName} ${user.lastName} (@${user.uid})?\n\nThis will also delete their namespace and all associated databases.`)) {
      setLoading(true);
      try {
        await new Promise((resolve, reject) => {
          const request = new DeleteLDAPUserRequest();
          request.setUsername(user.uid);
          request.setForce(true); // Delete everything

          console.log('📡 gRPC: DeleteLDAPUser', user.uid);

          grpcClient.deleteLDAPUser(request, {}, (err, response) => {
            if (err) {
              console.error('❌ gRPC DeleteLDAPUser failed:', err);
              reject(err);
              return;
            }

            console.log('✅ User deleted:', user.uid);
            resolve(response);
          });
        });

        alert(`✅ User ${user.uid} and all resources deleted successfully!`);
        await loadLdapUsers();
        setError('');
      } catch (err) {
        setError(`Failed to delete user: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteNamespace = async (namespaceName) => {
    if (window.confirm(`Are you sure you want to delete namespace: ${namespaceName}?\n\nThis will delete all databases and resources in this namespace.`)) {
      setLoading(true);
      try {
        await new Promise((resolve, reject) => {
          const request = new DeleteNamespaceRequest();
          request.setNamespace(namespaceName);

          console.log('📡 gRPC: DeleteNamespace', namespaceName);

          grpcClient.deleteNamespace(request, {}, (err, response) => {
            if (err) {
              console.error('❌ gRPC DeleteNamespace failed:', err);
              reject(err);
              return;
            }

            console.log('✅ Namespace deleted:', namespaceName);
            resolve(response);
          });
        });

        alert(`✅ Namespace ${namespaceName} deleted successfully!`);
        await loadNamespaces();
        setError('');
      } catch (err) {
        setError(`Failed to delete namespace: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteDatabase = async (database) => {
    if (window.confirm(`Are you sure you want to delete database: ${database.name}?\n\nThis action cannot be undone.`)) {
      setLoading(true);
      try {
        await new Promise((resolve, reject) => {
          const request = new DeleteDatabaseRequest();
          request.setName(database.name);
          request.setNamespace(database.namespace);

          console.log('📡 gRPC: DeleteDatabase', { name: database.name, namespace: database.namespace });

          grpcClient.deleteDatabase(request, {}, (err, response) => {
            if (err) {
              console.error('❌ gRPC DeleteDatabase failed:', err);
              reject(err);
              return;
            }

            console.log('✅ Database deleted:', database.name);
            resolve(response);
          });
        });

        alert(`✅ Database ${database.name} deleted successfully!`);
        await loadDatabases();
        setError('');
      } catch (err) {
        setError(`Failed to delete database: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">System Health</h3>
        </div>
        
        {systemHealth && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemHealth).map(([key, value]) => {
              if (key === 'status') return null;
              return (
                <div key={key} className="flex items-center gap-2">
                  {value.status === 'connected' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium capitalize">{key}</p>
                    <p className="text-xs text-gray-500">{value.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Admin Statistics</h3>
        </div>
        
        {adminStats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{adminStats.totalUsers}</p>
                <p className="text-sm text-gray-600 mt-1">Total Users</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{adminStats.totalNamespaces}</p>
                <p className="text-sm text-gray-600 mt-1">Namespaces</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{adminStats.totalDatabases}</p>
                <p className="text-sm text-gray-600 mt-1">Databases</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{adminStats.activeDeployments}</p>
                <p className="text-sm text-gray-600 mt-1">Deployments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Database Types</h4>
                <div className="space-y-2">
                  {Object.entries(adminStats.databaseTypes || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-sm">
                      <span className="capitalize text-gray-700">{type}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">User Types</h4>
                <div className="space-y-2">
                  {Object.entries(adminStats.userTypes || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-sm">
                      <span className="capitalize text-gray-700">{type}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderLDAPManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">LDAP User Management</h2>
        <div className="flex gap-2">
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => loadLdapUsers(e.target.value)}
          >
            <option value="">All Users</option>
            <option value="internal">Internal Users</option>
            <option value="external">External Users</option>
          </select>
          <button 
            onClick={() => loadLdapUsers()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ldapUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>Click "Refresh" to load LDAP users</p>
                </td>
              </tr>
            ) : (
              ldapUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">@{user.uid}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.userType === 'internal' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`Edit user: ${user.uid}\n(Edit functionality coming soon)`)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNamespaceManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Namespace Management</h2>
        <div className="flex gap-2">
          <button 
            onClick={loadNamespaces}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Namespace
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {namespaces.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <Server className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Click "Refresh" to load namespaces</p>
          </div>
        ) : (
          namespaces.map((namespace) => (
            <div key={namespace.name} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium text-gray-900">{namespace.name}</h3>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  namespace.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {namespace.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Databases:</span>
                  <span className="font-medium text-gray-900">{namespace.databaseCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(namespace.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedNamespace(namespace)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-1 font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Details
                </button>
                <button 
                  onClick={() => handleDeleteNamespace(namespace.name)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderDatabaseManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Database Management</h2>
        <div className="flex gap-2">
          <button 
            onClick={loadDatabases}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Database</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Namespace</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Panel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {databases.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <Database className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>Click "Refresh" to load databases</p>
                </td>
              </tr>
            ) : (
              databases.map((db) => (
                <tr key={db.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Database className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{db.name}</div>
                        <div className="text-sm text-gray-500">User: {db.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      db.type === 'mysql' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {db.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {db.namespace}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      db.status === 'running' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {db.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={db.adminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Key className="w-4 h-4" />
                      {db.adminType}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteDatabase(db)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow">
        <nav className="flex border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'ldap') loadLdapUsers();
                  if (tab.id === 'namespaces') loadNamespaces();
                  if (tab.id === 'databases') loadDatabases();
                }}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'ldap' && renderLDAPManagement()}
          {activeTab === 'namespaces' && renderNamespaceManagement()}
          {activeTab === 'databases' && renderDatabaseManagement()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;