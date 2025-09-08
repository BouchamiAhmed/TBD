// src/components/Dashboard.jsx - Enhanced Bootstrap with modern styling
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isLDAPAuth, setIsLDAPAuth] = useState(false);
  const [AdminPanel, setAdminPanel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    const ldapAuth = localStorage.getItem('ldapAuth') === 'true';

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUserType(storedUserType);
      setIsLDAPAuth(ldapAuth);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('ldapAuth');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loadAdminPanel = async () => {
    try {
      const AdminModule = await import('./AdminDatabaseManager');
      const AdminDatabaseManager = AdminModule.default;
      
      return (
        <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="bg-white shadow-sm border-bottom">
            <div className="container py-3">
              <div className="d-flex justify-content-between align-items-center">
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Dashboard
                </button>
                <small className="text-muted">
                  Admin: {user?.firstName} {user?.lastName} ({userType})
                </small>
              </div>
            </div>
          </div>
          <AdminDatabaseManager />
        </div>
      );
    } catch (error) {
      console.error('Failed to load admin panel:', error);
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="alert alert-danger border-0" style={{ borderRadius: '15px' }}>
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-triangle text-danger me-2"></i>
              <div>
                <h6 className="alert-heading mb-1">Admin Panel Error</h6>
                <p className="mb-0">Failed to load admin panel. Please check your configuration.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  useEffect(() => {
    if (showAdminPanel) {
      loadAdminPanel().then(setAdminPanel);
    } else {
      setAdminPanel(null);
    }
  }, [showAdminPanel]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('ldapAuth');
    navigate('/login');
  };

  const isAdmin = () => {
    return user && (
      userType === 'internal' ||
      user.username === 'admin' || 
      user.email?.includes('admin') ||
      user.id === 1
    );
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (showAdminPanel) {
    return AdminPanel || (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container py-5">
        <div className="row g-4">
          
          {/* User Profile Card */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
              <div className="card-header text-white text-center py-4 border-0" 
                   style={{
                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                     borderRadius: '15px 15px 0 0'
                   }}>
                <div className="d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{
                       width: '80px', 
                       height: '80px', 
                       backgroundColor: 'rgba(255, 255, 255, 0.2)',
                       borderRadius: '50%'
                     }}>
                  <span className="fs-2 fw-bold text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <h4 className="mb-1">{user?.firstName} {user?.lastName}</h4>
                <p className="mb-0 opacity-75">@{user?.username}</p>
              </div>
              
              <div className="card-body p-4">
                {/* User Type and Auth Badges */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {userType && (
                    <span className={`badge px-3 py-2 ${
                      userType === 'internal' 
                        ? 'bg-danger bg-opacity-10 text-danger' 
                        : 'bg-primary bg-opacity-10 text-primary'
                    }`} style={{ borderRadius: '10px' }}>
                      <i className={`fas ${userType === 'internal' ? 'fa-crown' : 'fa-user'} me-1`}></i>
                      {userType === 'internal' ? 'Internal User' : 'External User'}
                    </span>
                  )}
                  
                  <span className={`badge px-3 py-2 ${
                    isLDAPAuth 
                      ? 'bg-success bg-opacity-10 text-success' 
                      : 'bg-secondary bg-opacity-10 text-secondary'
                  }`} style={{ borderRadius: '10px' }}>
                    <i className={`fas ${isLDAPAuth ? 'fa-shield-alt' : 'fa-database'} me-1`}></i>
                    {isLDAPAuth ? 'LDAP Auth' : 'Local Auth'}
                  </span>
                </div>

                {/* Admin Badge */}
                {isAdmin() && (
                  <div className="mb-4">
                    <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2" style={{ borderRadius: '10px' }}>
                      <i className="fas fa-user-shield me-1"></i>
                      Administrator Access
                    </span>
                  </div>
                )}

                {/* User Details */}
                <div className="mb-4">
                  <div className="row g-2 small">
                    <div className="col-4"><strong>Email:</strong></div>
                    <div className="col-8">{user?.email}</div>
                    
                    <div className="col-4"><strong>User ID:</strong></div>
                    <div className="col-8">{user?.id}</div>
                    
                    <div className="col-4"><strong>Auth:</strong></div>
                    <div className="col-8">{isLDAPAuth ? 'LDAP Directory' : 'Local Database'}</div>
                    
                    <div className="col-4"><strong>Created:</strong></div>
                    <div className="col-8">{new Date(user?.createdAt).toLocaleDateString()}</div>
                    
                    {userType && (
                      <>
                        <div className="col-4"><strong>Type:</strong></div>
                        <div className="col-8">{userType === 'internal' ? 'Internal (Admin)' : 'External (Client)'}</div>
                      </>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="btn btn-danger w-100 py-2"
                  style={{ borderRadius: '10px' }}
                >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-8">
            <div className="row g-4">
              
              {/* Welcome Card */}
              <div className="col-12">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center">
                      <div className="d-inline-flex align-items-center justify-content-center me-3" 
                           style={{
                             width: '50px', 
                             height: '50px', 
                             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                             borderRadius: '12px'
                           }}>
                        <i className="fas fa-tachometer-alt text-white"></i>
                      </div>
                      <div>
                        <h3 className="mb-1">Welcome back, {user?.firstName}!</h3>
                        <p className="text-muted mb-0">Manage your databases and services from your dashboard</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="col-12">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-4">
                      <i className="fas fa-bolt me-2 text-primary"></i>
                      Quick Actions
                    </h5>
                    <div className="row g-3">
                      
                      <div className="col-md-6">
                        <button 
                          onClick={() => navigate('/services')}
                          className="btn w-100 p-4 text-start border-0 position-relative"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px',
                            color: 'white'
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <i className="fas fa-database fa-2x me-3"></i>
                            <div>
                              <h6 className="mb-1">Manage Databases</h6>
                              <small className="opacity-75">Create and manage your databases</small>
                            </div>
                          </div>
                        </button>
                      </div>

                      <div className="col-md-6">
                        <button 
                          onClick={() => navigate('/users')}
                          className="btn w-100 p-4 text-start border-0"
                          style={{
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            borderRadius: '12px',
                            color: 'white'
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <i className="fas fa-users fa-2x me-3"></i>
                            <div>
                              <h6 className="mb-1">User Management</h6>
                              <small className="opacity-75">Manage system users</small>
                            </div>
                          </div>
                        </button>
                      </div>

                      {isAdmin() && (
                        <div className="col-md-6">
                          <button 
                            onClick={() => setShowAdminPanel(true)}
                            className="btn w-100 p-4 text-start border-0 position-relative"
                            style={{
                              background: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
                              borderRadius: '12px',
                              color: 'white'
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <i className="fas fa-cogs fa-2x me-3"></i>
                              <div>
                                <h6 className="mb-1">Admin Panel</h6>
                                <small className="opacity-75">Cluster database manager</small>
                              </div>
                            </div>
                            <span className="position-absolute top-0 end-0 badge bg-warning text-dark m-2">
                              gRPC
                            </span>
                          </button>
                        </div>
                      )}

                      {isAdmin() && (
                        <div className="col-md-6">
                          <button 
                            onClick={() => navigate('/admin')}
                            className="btn w-100 p-4 text-start border-0"
                            style={{
                              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                              borderRadius: '12px',
                              color: '#333'
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <i className="fas fa-chart-bar fa-2x me-3"></i>
                              <div>
                                <h6 className="mb-1">Admin Dashboard</h6>
                                <small className="opacity-75">Simplified admin interface</small>
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="col-12">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-4">
                      <i className="fas fa-info-circle me-2 text-info"></i>
                      System Information
                    </h5>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="text-primary mb-3">Your Resources</h6>
                        <div className="bg-light rounded-3 p-3">
                          <div className="row g-2 small">
                            <div className="col-5"><strong>Namespace:</strong></div>
                            <div className="col-7">
                              <code className="bg-dark text-light px-2 py-1 rounded">
                                {user?.id}{user?.username}
                              </code>
                            </div>
                            
                            <div className="col-5"><strong>Backend:</strong></div>
                            <div className="col-7">TBDback REST API + LDAP</div>
                            
                            <div className="col-5"><strong>DB Creation:</strong></div>
                            <div className="col-7">
                              <span className="badge bg-success bg-opacity-10 text-success">
                                <i className="fas fa-check me-1"></i>Enabled
                              </span>
                            </div>
                            
                            <div className="col-5"><strong>Admin Access:</strong></div>
                            <div className="col-7">
                              <span className={`badge ${isAdmin() ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                                <i className={`fas ${isAdmin() ? 'fa-check' : 'fa-times'} me-1`}></i>
                                {isAdmin() ? 'Yes' : 'No'}
                              </span>
                            </div>
                            
                            <div className="col-5"><strong>LDAP Group:</strong></div>
                            <div className="col-7">{userType === 'internal' ? 'Admins' : 'Clients'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <h6 className="text-primary mb-3">Available Services</h6>
                        <div className="bg-light rounded-3 p-3">
                          <div className="list-unstyled mb-0">
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-check text-success me-2"></i>
                              <span>MySQL Deployment</span>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-check text-success me-2"></i>
                              <span>PostgreSQL Deployment</span>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-check text-success me-2"></i>
                              <span>Database Management</span>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                              <i className="fas fa-check text-success me-2"></i>
                              <span>LDAP Authentication</span>
                            </div>
                            {isAdmin() && (
                              <>
                                <div className="d-flex align-items-center mb-2">
                                  <i className="fas fa-check text-success me-2"></i>
                                  <span>gRPC Admin Panel</span>
                                </div>
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-check text-success me-2"></i>
                                  <span>Cluster Management</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Getting Started / Admin Notice */}
              <div className="col-12">
                {!isAdmin() ? (
                  <div className="alert alert-info border-0" style={{ borderRadius: '15px' }}>
                    <div className="d-flex align-items-start">
                      <i className="fas fa-lightbulb text-info me-3 mt-1"></i>
                      <div>
                        <h6 className="alert-heading mb-2">Getting Started</h6>
                        <p className="mb-0">
                          To create a new database, navigate to the Services page and select the database type you want to deploy.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning border-0" style={{ borderRadius: '15px' }}>
                    <div className="d-flex align-items-start">
                      <i className="fas fa-shield-alt text-warning me-3 mt-1"></i>
                      <div>
                        <h6 className="alert-heading mb-2">Administrator Access</h6>
                        <p className="mb-0">
                          You have access to cluster-wide database management tools. Use them responsibly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;