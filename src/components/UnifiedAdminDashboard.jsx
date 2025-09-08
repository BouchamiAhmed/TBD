// src/components/UnifiedAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import adminService from '../services/adminService';

const UnifiedAdminDashboard = () => {
  const navigate = useNavigate();
  
  // State management
  const [namespaces, setNamespaces] = useState([]);
  const [stats, setStats] = useState({
    totalNamespaces: 0,
    totalDatabases: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [grpcStatus, setGrpcStatus] = useState('connecting');

  // Load initial data
  useEffect(() => {
    testGrpcConnection();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const testGrpcConnection = async () => {
    try {
      console.log('🔄 Testing gRPC connection...');
      const response = await adminService.getAllNamespaces();
      const isConnected = response && response.success;
      setGrpcStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        loadNamespaces();
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setGrpcStatus('disconnected');
    }
  };

  const loadNamespaces = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Loading namespaces via gRPC...');
      const response = await adminService.getAllNamespaces();
      console.log('✅ Namespaces loaded:', response);
      
      setNamespaces(response.namespaces || []);
      calculateStats(response.namespaces || []);
      setSuccess(`Loaded ${response.namespaces?.length || 0} namespaces via gRPC`);
    } catch (err) {
      console.error('❌ Error loading namespaces:', err);
      setError(err.message);
      setNamespaces([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (namespaceList) => {
    const totalDatabases = namespaceList.reduce((sum, ns) => sum + (ns.databaseCount || 0), 0);
    setStats({
      totalNamespaces: namespaceList.length,
      totalDatabases: totalDatabases,
      totalUsers: namespaceList.length
    });
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

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>🛠️ Admin Dashboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${grpcStatus}`}></span>
          gRPC {grpcStatus}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-content">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
            <button onClick={clearMessages} className="alert-close">×</button>
          </div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <div className="alert-content">
            <i className="fas fa-check-circle"></i>
            <span>{success}</span>
            <button onClick={clearMessages} className="alert-close">×</button>
          </div>
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

      {/* Quick Actions */}
      <div className="overview-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
          <button 
            onClick={loadNamespaces} 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh Data'}
          </button>
        </div>

        <div className="overview-grid">
          <div className="overview-card">
            <h3>Database Services</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">🗄️</div>
                <div className="activity-content">
                  <div className="activity-title">Manage All Databases</div>
                  <div className="activity-subtitle">Create, view, and manage databases</div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/services')}
              className="btn btn-primary"
            >
              <i className="fas fa-database me-2"></i>
              Go to Database Services
            </button>
          </div>

          <div className="overview-card">
            <h3>System Status</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">📊</div>
                <div className="activity-content">
                  <div className="activity-title">gRPC Status: {grpcStatus}</div>
                  <div className="activity-subtitle">Connection to admin microservice</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">👤</div>
                <div className="activity-content">
                  <div className="activity-title">{namespaces.length} Active Users</div>
                  <div className="activity-subtitle">Users with namespaces</div>
                </div>
              </div>
            </div>
            <button 
              onClick={testGrpcConnection}
              className="btn btn-secondary"
            >
              <i className="fas fa-sync-alt me-2"></i>
              Test Connection
            </button>
          </div>
        </div>
      </div>

      {/* User Namespaces List */}
      {namespaces.length > 0 && (
        <div className="overview-section">
          <div className="section-header">
            <h2>User Namespaces ({namespaces.length})</h2>
          </div>
          
          <div className="namespaces-grid">
            {namespaces.map((namespace) => (
              <div key={namespace.name} className="namespace-card">
                <div className="namespace-header">
                  <h3>👤 {namespace.name}</h3>
                  <span className={`badge ${getStatusBadgeClass(namespace.status)}`}>
                    {namespace.status}
                  </span>
                </div>
                <div className="namespace-details">
                  <div className="detail-item">
                    <span className="detail-label">Databases:</span>
                    <span className="detail-value">{namespace.databaseCount || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(namespace.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
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

export default UnifiedAdminDashboard;