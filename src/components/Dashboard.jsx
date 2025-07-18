// src/components/Dashboard.jsx - Updated with admin access
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDatabaseManager from './AdminDatabaseManager';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      // Redirect to login if no user data found
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Check if user is admin (you can customize this logic)
  const isAdmin = () => {
    return user && (
      user.username === 'admin' || 
      user.email?.includes('admin') ||
      user.id === 1 // or any other admin check logic
    );
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // If admin panel is shown, render it
  if (showAdminPanel) {
    return (
      <div>
        {/* Admin Panel Header */}
        <div className="container-fluid mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowAdminPanel(false)}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Dashboard
            </button>
            <div className="text-muted">
              <small>Admin: {user?.firstName} {user?.lastName}</small>
            </div>
          </div>
        </div>
        
        {/* Admin Component */}
        <AdminDatabaseManager />
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">User Profile</h4>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              </div>
              <h5 className="card-title text-center">{user?.firstName} {user?.lastName}</h5>
              <p className="card-text text-center text-muted">@{user?.username}</p>
              
              {/* Admin Badge */}
              {isAdmin() && (
                <div className="text-center mb-3">
                  <span className="badge bg-danger">
                    <i className="fas fa-crown me-1"></i>
                    Administrator
                  </span>
                </div>
              )}
              
              <hr />
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Account created:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
              <p><strong>User ID:</strong> {user?.id}</p>
              
              <button 
                className="btn btn-danger w-100 mt-3" 
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Dashboard</h4>
            </div>
            <div className="card-body">
              <h5>Welcome, {user?.firstName}!</h5>
              <p>This is your dashboard where you can manage your databases and services.</p>
              
              <div className="d-grid gap-3 mt-4">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => navigate('/services')}
                >
                  <i className="fas fa-database me-2"></i>
                  Manage My Databases
                </button>
                
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => navigate('/users')}
                >
                  <i className="fas fa-users me-2"></i>
                  User Management
                </button>

                {/* Admin-only button */}
                {isAdmin() && (
                  <button 
                    className="btn btn-outline-danger"
                    onClick={() => setShowAdminPanel(true)}
                  >
                    <i className="fas fa-users-cog me-2"></i>
                    Admin: Cluster Database Manager
                    <span className="badge bg-danger ms-2">gRPC</span>
                  </button>
                )}
              </div>
              
              <div className="alert alert-info mt-4">
                <h6 className="alert-heading">Getting Started</h6>
                <p>
                  To create a new database, navigate to the Services page and select the database type you want to deploy.
                </p>
                {isAdmin() && (
                  <p className="mb-0">
                    <strong>Admin:</strong> Use the Cluster Database Manager to view and manage all databases across all namespaces via gRPC.
                  </p>
                )}
              </div>

              {/* System Information */}
              <div className="card mt-4">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    System Information
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Your Resources:</h6>
                      <ul className="list-unstyled">
                        <li><strong>Namespace:</strong> {user?.id}{user?.username}</li>
                        <li><strong>Backend:</strong> TBDback REST API</li>
                        <li><strong>Database Creation:</strong> Enabled</li>
                        <li><strong>Admin Access:</strong> {isAdmin() ? 'Yes' : 'No'}</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h6>Available Services:</h6>
                      <ul className="list-unstyled">
                        <li><i className="fas fa-check text-success me-2"></i>MySQL Deployment</li>
                        <li><i className="fas fa-check text-success me-2"></i>PostgreSQL Deployment</li>
                        <li><i className="fas fa-check text-success me-2"></i>Database Management</li>
                        {isAdmin() && (
                          <li><i className="fas fa-check text-success me-2"></i>gRPC Admin Panel</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;