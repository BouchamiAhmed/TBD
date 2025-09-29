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
  Settings
} from 'lucide-react';

const EnhancedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ldapUsers, setLdapUsers] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock admin service - replace with actual gRPC calls
  const adminService = {
    async listLDAPUsers(userType = '', page = 1, limit = 10) {
      // Mock implementation
      return {
        success: true,
        users: [
          {
            uid: 'john.doe',
            email: 'john.doe@company.com',
            firstName: 'John',
            lastName: 'Doe',
            userType: 'external',
            status: 'active'
          },
          {
            uid: 'admin.user',
            email: 'admin@company.com',
            firstName: 'Admin',
            lastName: 'User',
            userType: 'internal',
            status: 'active'
          }
        ],
        totalCount: 2,
        page,
        limit
      };
    },

    async getSystemHealth() {
      return {
        success: true,
        health: {
          status: 'healthy',
          database: { status: 'connected', message: 'OK' },
          kubernetes: { status: 'connected', message: 'OK' },
          ldap: { status: 'connected', message: 'OK' },
          traefik: { status: 'connected', message: 'OK' }
        }
      };
    },

    async getAdminStats() {
      return {
        success: true,
        stats: {
          totalUsers: 25,
          totalNamespaces: 12,
          totalDatabases: 18,
          activeDeployments: 35,
          databaseTypes: { mysql: 10, postgresql: 8 },
          userTypes: { internal: 5, external: 20 }
        }
      };
    },

    async getAllNamespaces() {
      return {
        success: true,
        namespaces: [
          {
            name: 'user-john-doe',
            createdAt: new Date().toISOString(),
            databaseCount: 3,
            status: 'Active'
          },
          {
            name: 'user-jane-smith',
            createdAt: new Date().toISOString(),
            databaseCount: 2,
            status: 'Active'
          }
        ]
      };
    },

    async getNamespaceDetails(namespace) {
      return {
        success: true,
        details: {
          name: namespace,
          createdAt: new Date().toISOString(),
          databaseCount: 2,
          status: 'Active',
          resources: [
            {
              name: 'mysql-db',
              kind: 'Deployment',
              namespace,
              status: 'Ready'
            },
            {
              name: 'mysql-service',
              kind: 'Service',
              namespace,
              status: 'ClusterIP'
            }
          ],
          ownerUid: 'john.doe',
          labels: { 'user-uid': 'john.doe', 'managed-by': 'admin-service' }
        }
      };
    },

    async deleteLDAPUser(username, force = false) {
      return {
        success: true,
        message: 'User deleted successfully',
        username,
        deletedResources: force ? ['namespace:user-' + username, 'databases'] : []
      };
    },

    async deleteNamespace(namespace, force = false) {
      return {
        success: true,
        message: 'Namespace deleted successfully',
        namespace,
        deletedResources: force ? ['deployment:mysql-db', 'service:mysql-service'] : []
      };
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [healthData, statsData, namespacesData] = await Promise.all([
        adminService.getSystemHealth(),
        adminService.getAdminStats(),
        adminService.getAllNamespaces()
      ]);

      setSystemHealth(healthData.health);
      setAdminStats(statsData.stats);
      setNamespaces(namespacesData.namespaces);
    } catch (err) {
      setError('Failed to load dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLdapUsers = async (userType = '') => {
    setLoading(true);
    try {
      const response = await adminService.listLDAPUsers(userType);
      setLdapUsers(response.users);
    } catch (err) {
      setError('Failed to load LDAP users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLDAPUser = async (username) => {
    const confirmDelete = window.confirm(
      `⚠️ DELETE LDAP USER: "${username}"\n\n` +
      `This will permanently remove the user from LDAP.\n` +
      `Do you want to force delete and remove all associated resources?`
    );

    if (!confirmDelete) return;

    const forceDelete = window.confirm(
      `Force delete with resources cleanup?\n\n` +
      `YES = Delete user + namespace + databases\n` +
      `NO = Delete user only`
    );

    try {
      setLoading(true);
      const response = await adminService.deleteLDAPUser(username, forceDelete);
      
      if (response.success) {
        setLdapUsers(prev => prev.filter(user => user.uid !== username));
        alert(`✅ User "${username}" deleted successfully.\n\nDeleted resources: ${response.deletedResources.join(', ')}`);
      }
    } catch (err) {
      setError('Failed to delete user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNamespace = async (namespaceName) => {
    const confirmDelete = window.confirm(
      `⚠️ DELETE NAMESPACE: "${namespaceName}"\n\n` +
      `This will permanently remove the namespace.\n` +
      `Do you want to force delete and remove all resources?`
    );

    if (!confirmDelete) return;

    const forceDelete = window.confirm(
      `Force delete with all resources?\n\n` +
      `YES = Delete namespace + deployments + services + databases\n` +
      `NO = Delete namespace only (may fail if resources exist)`
    );

    try {
      setLoading(true);
      const response = await adminService.deleteNamespace(namespaceName, forceDelete);
      
      if (response.success) {
        setNamespaces(prev => prev.filter(ns => ns.name !== namespaceName));
        alert(`✅ Namespace "${namespaceName}" deleted successfully.\n\nDeleted resources: ${response.deletedResources.join(', ')}`);
      }
    } catch (err) {
      setError('Failed to delete namespace: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'connected':
      case 'healthy':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">System Health</h3>
          <button 
            onClick={loadDashboardData}
            className="ml-auto text-blue-500 hover:text-blue-700"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {systemHealth && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              {getStatusIcon(systemHealth.database?.status)}
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-gray-600">{systemHealth.database?.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              {getStatusIcon(systemHealth.kubernetes?.status)}
              <div>
                <p className="text-sm font-medium">Kubernetes</p>
                <p className="text-xs text-gray-600">{systemHealth.kubernetes?.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              {getStatusIcon(systemHealth.ldap?.status)}
              <div>
                <p className="text-sm font-medium">LDAP</p>
                <p className="text-xs text-gray-600">{systemHealth.ldap?.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              {getStatusIcon(systemHealth.traefik?.status)}
              <div>
                <p className="text-sm font-medium">Traefik</p>
                <p className="text-xs text-gray-600">{systemHealth.traefik?.message}</p>
              </div>
            </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-2xl font-bold text-blue-600">{adminStats.totalUsers}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-2xl font-bold text-green-600">{adminStats.totalNamespaces}</p>
              <p className="text-sm text-gray-600">Namespaces</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <p className="text-2xl font-bold text-yellow-600">{adminStats.totalDatabases}</p>
              <p className="text-sm text-gray-600">Databases</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <p className="text-2xl font-bold text-purple-600">{adminStats.activeDeployments}</p>
              <p className="text-sm text-gray-600">Deployments</p>
            </div>
          </div>
        )}

        {adminStats && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">Database Types</h4>
              <div className="space-y-1">
                {Object.entries(adminStats.databaseTypes || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">User Types</h4>
              <div className="space-y-1">
                {Object.entries(adminStats.userTypes || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            className="px-3 py-1 border rounded"
            onChange={(e) => loadLdapUsers(e.target.value)}
          >
            <option value="">All Users</option>
            <option value="internal">Internal Users</option>
            <option value="external">External Users</option>
          </select>
          <button 
            onClick={() => loadLdapUsers()}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ldapUsers.map((user) => (
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
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.userType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-900" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900" title="Edit User">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-yellow-600 hover:text-yellow-900" title="Reset Password">
                      <Key className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteLDAPUser(user.uid)}
                      className="text-red-600 hover:text-red-900" 
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {ldapUsers.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No LDAP users found. Click refresh to load users.
          </div>
        )}
      </div>
    </div>
  );

  const renderNamespaceManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Namespace Management</h2>
        <button 
          onClick={() => adminService.getAllNamespaces().then(response => setNamespaces(response.namespaces))}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {namespaces.map((namespace) => (
          <div key={namespace.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium">{namespace.name}</h3>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                namespace.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {namespace.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Databases:</span>
                <span className="font-medium">{namespace.databaseCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(namespace.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedNamespace(namespace)}
                className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                <Eye className="w-3 h-3 inline mr-1" />
                Details
              </button>
              <button 
                onClick={() => handleDeleteNamespace(namespace.name)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedNamespace && (
        <NamespaceDetailsModal 
          namespace={selectedNamespace}
          onClose={() => setSelectedNamespace(null)}
          adminService={adminService}
        />
      )}
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'ldap', label: 'LDAP Users', icon: Users },
    { id: 'namespaces', label: 'Namespaces', icon: Server },
    { id: 'databases', label: 'Databases', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              <span>gRPC Admin Service</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'ldap') loadLdapUsers();
                  }}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'ldap' && renderLDAPManagement()}
          {activeTab === 'namespaces' && renderNamespaceManagement()}
          {activeTab === 'databases' && (
            <div className="text-center py-12 text-gray-500">
              Database management functionality to be implemented
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Namespace Details Modal Component
const NamespaceDetailsModal = ({ namespace, onClose, adminService }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const response = await adminService.getNamespaceDetails(namespace.name);
        setDetails(response.details);
      } catch (err) {
        console.error('Failed to load namespace details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [namespace.name, adminService]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Namespace Details: {namespace.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
              <p className="mt-2 text-gray-600">Loading details...</p>
            </div>
          ) : details ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Basic Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-600">Name:</span> {details.name}</div>
                    <div><span className="text-gray-600">Owner:</span> {details.ownerUid || 'Unknown'}</div>
                    <div><span className="text-gray-600">Status:</span> {details.status}</div>
                    <div><span className="text-gray-600">Created:</span> {new Date(details.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Statistics</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-600">Databases:</span> {details.databaseCount}</div>
                    <div><span className="text-gray-600">Resources:</span> {details.resources?.length || 0}</div>
                  </div>
                </div>
              </div>

              {details.resources && details.resources.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Resources</h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Kind
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {details.resources.map((resource, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{resource.name}</td>
                            <td className="px-4 py-2 text-sm">{resource.kind}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                {resource.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {details.labels && Object.keys(details.labels).length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Labels</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {Object.entries(details.labels).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-gray-600">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load namespace details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;