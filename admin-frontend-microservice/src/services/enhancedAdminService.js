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
import realAdminService from '../services/realAdminService';

// Enhanced Admin Dashboard - NO AUTHENTICATION
// Direct access for K3s LoadBalancer deployment
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

  // USING REAL ADMIN SERVICE NOW!
  const adminService = realAdminService;

  useEffect(() => {
    loadSystemHealth();
    loadAdminStats();
  }, []);

  const loadSystemHealth = async () => {
    try {
      const response = await adminService.getSystemHealth();
      setSystemHealth(response.health);
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
  };

  const loadAdminStats = async () => {
    try {
      const response = await adminService.getAdminStats();
      setAdminStats(response.stats);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const loadLdapUsers = async (userType = '') => {
    setLoading(true);
    try {
      const response = await adminService.listLDAPUsers(userType);
      setLdapUsers(response.users);
      setError('');
    } catch (err) {
      setError('Failed to load LDAP users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadNamespaces = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllNamespaces();
      setNamespaces(response.namespaces);
      setError('');
    } catch (err) {
      setError('Failed to load namespaces');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllDatabases();
      setDatabases(response.databases);
      setError('');
    } catch (err) {
      setError('Failed to load databases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDatabase = async (database) => {
    if (window.confirm(`Are you sure you want to delete database: ${database.name}?\n\nThis action cannot be undone.`)) {
      try {
        setLoading(true);
        // Call the REAL gRPC delete database function
        await adminService.deleteDatabase(database.name, database.namespace);
        
        setError('');
        alert(`✅ Database ${database.name} deleted successfully!`);
        
        // Reload databases list
        await loadDatabases();
      } catch (err) {
        setError(`Failed to delete database: ${err.message}`);
        console.error('Delete database error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteNamespace = async (namespaceName) => {
    if (window.confirm(`Are you sure you want to delete namespace: ${namespaceName}?`)) {
      alert('Delete functionality coming soon');
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

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user: ${user.firstName} ${user.lastName} (@${user.uid})?\n\nThis will also delete their namespace and all associated databases.`)) {
      try {
        setLoading(true);
        // Here you would call the real gRPC delete user function
        // await adminService.deleteLDAPUser(user.uid);
        
        // For now, just show success message
        alert(`User ${user.uid} deleted successfully (mock)`);
        
        // Reload users list
        await loadLdapUsers();
        setError('');
      } catch (err) {
        setError(`Failed to delete user: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

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