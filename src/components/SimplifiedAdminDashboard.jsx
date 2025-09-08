// src/components/SimplifiedAdminDashboard.jsx - Fixed import path and enhanced with LDAP info
import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const SimplifiedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalNamespaces: 0,
    totalDatabases: 0,
    totalUsers: 0
  });
  const [adminService, setAdminService] = useState(null);

  // Load admin service dynamically
  useEffect(() => {
    loadAdminService();
  }, []);

  const loadAdminService = async () => {
    try {
      // Fixed import path
      const module = await import('../services/adminService');
      setAdminService(module.default);
      console.log('Admin service loaded successfully');
      loadNamespaces();
    } catch (err) {
      console.warn('Admin service not available, using fallback mode:', err.message);
      // Use mock data if service is not available
      loadMockData();
    }
  };

  const loadMockData = () => {
    const mockNamespaces = [
      {
        name: '1admin',
        createdAt: new Date(),
        databaseCount: 2,
        status: 'Active'
      },
      {
        name: '2john',
        createdAt: new Date(),
        databaseCount: 1,
        status: 'Active'
      }
    ];
    setNamespaces(mockNamespaces);
    calculateStats(mockNamespaces);
    setSuccess('Admin data loaded (demonstration mode)');
  };

  const loadNamespaces = async () => {
    if (!adminService) {
      loadMockData();
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await adminService.getAllNamespaces();
      if (response && response.success) {
        setNamespaces(response.namespaces || []);
        calculateStats(response.namespaces || []);
        setSuccess('Admin data loaded successfully via gRPC');
      } else {
        throw new Error('Failed to load from service');
      }
    } catch (err) {
      setError('Error loading admin data: ' + err.message);
      console.error('Error in loadNamespaces:', err);
      // Fallback to mock data
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (namespaceList) => {
    const totalDatabases = namespaceList.reduce((sum, ns) => sum + (ns.databaseCount || 0), 0);
    setStats({
      totalNamespaces: namespaceList.length,
      totalDatabases: totalDatabases,
      totalUsers: namespaceList.length // Each namespace represents a user
    });
  };

  const loadDatabasesForNamespace = async (namespace) => {
    if (!adminService) {
      // Mock data for demonstration
      setDatabases([
        {
          name: 'test-db',
          type: 'mysql',
          status: 'running',
          namespace: namespace,
          userId: '1',
          adminUrl: `http://10.9.21.201/${namespace}/test-db-phpmyadmin`,
          adminType: 'phpMyAdmin',
          createdAt: new Date()
        }
      ]);
      setSelectedNamespace(namespace);
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.getUserDatabases(namespace);
      setDatabases(response.databases || []);
      setSelectedNamespace(namespace);
      setSuccess(`Loaded ${response.databases?.length || 0} databases from ${namespace}`);
    } catch (err) {
      setError('Error loading databases: ' + err.message);
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDatabase = async (namespace, dbName) => {
    if (!window.confirm(`Are you sure you want to delete database "${dbName}"?`)) {
      return;
    }

    if (!adminService) {
      setSuccess(`Database "${dbName}" would be deleted (demo mode)`);
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.deleteDatabase(namespace, dbName);
      if (response.success) {
        setSuccess(`Database "${dbName}" deleted successfully`);
        // Reload databases for current namespace
        await loadDatabasesForNamespace(namespace);
        // Reload namespaces to update counts
        await loadNamespaces();
      } else {
        setError(response.message || 'Failed to delete database');
      }
    } catch (err) {
      setError('Error deleting database: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'active':
        return 'badge-success';
      case 'creating':
      case 'pending':
        return 'badge-warning';
      case 'failed':
      case 'error':
        return 'badge-error';
      default:
        return 'badge-default';
    }
  };

  // Get current user info to determine if they're an admin
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userType = localStorage.getItem('userType');
  const isLDAPAuth = localStorage.getItem('ldapAuth') === 'true';

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛠️ Admin Dashboard</h1>
        <div className="connection-status">
          <span className="status-indicator"></span>
          {adminService ? 'gRPC Connected' : 'Demo Mode'}
        </div>
      </div>

      {/* User Info Bar */}
      <div className="alert alert-info">
        <strong>Logged in as:</strong> {currentUser.username} | 
        <strong> Type:</strong> {userType || 'Unknown'} | 
        <strong> Auth:</strong> {isLDAPAuth ? 'LDAP' : 'Local'}
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗄️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalDatabases}</div>
            <div className="stat-label">Total Databases</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalNamespaces}</div>
            <div className="stat-label">Active Namespaces</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'databases' ? 'active' : ''}`}
          onClick={() => setActiveTab('databases')}
        >
          🗄️ Database Management
        </button>
      </div>

      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="section-header">
              <h2>System Overview</h2>
              <button 
                onClick={adminService ? loadNamespaces : loadMockData} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
              </button>
            </div>

            <div className="overview-grid">
              <div className="overview-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {namespaces.slice(0, 5).map((namespace) => (
                    <div key={namespace.name} className="activity-item">
                      <div className="activity-icon">👤</div>
                      <div className="activity-content">
                        <div className="activity-title">User: {namespace.name}</div>
                        <div className="activity-subtitle">
                          {namespace.databaseCount} databases • Created {formatDate(namespace.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overview-card">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="quick-action-btn"
                  >
                    <div className="quick-action-icon">👥</div>
                    <div className="quick-action-text">Manage Users</div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('databases')}
                    className="quick-action-btn"
                  >
                    <div className="quick-action-icon">🗄️</div>
                    <div className="quick-action-text">View Databases</div>
                  </button>
                  <button 
                    onClick={adminService ? loadNamespaces : loadMockData}
                    className="quick-action-btn"
                  >
                    <div className="quick-action-icon">🔄</div>
                    <div className="quick-action-text">Refresh Data</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>User Management ({namespaces.length} users)</h2>
              <button 
                onClick={adminService ? loadNamespaces : loadMockData} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>

            <div className="namespaces-grid">
              {namespaces.map((namespace) => (
                <div key={namespace.name} className="namespace-card">
                  <div className="card-header">
                    <h3>👤 {namespace.name}</h3>
                    <span className={`badge ${getStatusBadgeClass(namespace.status)}`}>
                      {namespace.status}
                    </span>
                  </div>
                  
                  <div className="card-content">
                    <div className="namespace-info">
                      <div className="info-item">
                        <strong>Databases:</strong> {namespace.databaseCount}
                      </div>
                      <div className="info-item">
                        <strong>Created:</strong> {formatDate(namespace.createdAt)}
                      </div>
                      <div className="info-item">
                        <strong>Namespace:</strong> {namespace.name}
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button 
                        onClick={() => {
                          loadDatabasesForNamespace(namespace.name);
                          setActiveTab('databases');
                        }}
                        className="btn btn-secondary btn-sm"
                        disabled={loading}
                      >
                        View Databases
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {namespaces.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No Users Found</h3>
                <p>Users will appear here when they create their first database.</p>
              </div>
            )}
          </div>
        )}

        {/* Database Management Tab */}
        {activeTab === 'databases' && (
          <div className="databases-section">
            <div className="section-header">
              <h2>Database Management</h2>
              {selectedNamespace && (
                <div className="current-namespace">
                  Viewing: <strong>{selectedNamespace}</strong>
                </div>
              )}
            </div>

            {!selectedNamespace ? (
              <div className="namespace-selector">
                <h3>Select a user to view their databases:</h3>
                <div className="namespace-buttons">
                  {namespaces.map((namespace) => (
                    <button
                      key={namespace.name}
                      onClick={() => loadDatabasesForNamespace(namespace.name)}
                      className="btn btn-outline"
                      disabled={loading}
                    >
                      👤 {namespace.name} ({namespace.databaseCount} DBs)
                    </button>
                  ))}
                </div>
                {namespaces.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🗄️</div>
                    <h3>No Users Available</h3>
                    <p>Load user data first to view their databases.</p>
                    <button onClick={adminService ? loadNamespaces : loadMockData} className="btn btn-primary">
                      Load Users
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="databases-list">
                <div className="databases-header">
                  <h3>Databases for user: {selectedNamespace}</h3>
                  <div className="header-actions">
                    <button 
                      onClick={() => loadDatabasesForNamespace(selectedNamespace)}
                      className="btn btn-secondary btn-sm"
                      disabled={loading}
                    >
                      🔄 Refresh
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedNamespace('');
                        setDatabases([]);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      ← Back to Users
                    </button>
                  </div>
                </div>

                {databases.length > 0 ? (
                  <div className="databases-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Database Name</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Admin Panel</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {databases.map((db) => (
                          <tr key={db.name}>
                            <td>
                              <div className="db-name">
                                <strong>{db.name}</strong>
                                <small className="db-namespace">in {db.namespace}</small>
                              </div>
                            </td>
                            <td>
                              <span className="db-type">
                                {db.type === 'postgresql' ? '🐘' : '🐬'} {db.type}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(db.status)}`}>
                                {db.status}
                              </span>
                            </td>
                            <td>
                              {db.adminUrl ? (
                                <a 
                                  href={db.adminUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="admin-link"
                                >
                                  🔗 {db.adminType}
                                </a>
                              ) : (
                                <span className="text-muted">No admin panel</span>
                              )}
                            </td>
                            <td>
                              <div className="date-info">
                                {formatDate(db.createdAt)}
                              </div>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {db.adminUrl && (
                                  <a 
                                    href={db.adminUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm"
                                  >
                                    🔧 Manage
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteDatabase(selectedNamespace, db.name)}
                                  className="btn btn-danger btn-sm"
                                  disabled={loading}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🗄️</div>
                    <h3>No Databases Found</h3>
                    <p>This user hasn't created any databases yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedAdminDashboard;