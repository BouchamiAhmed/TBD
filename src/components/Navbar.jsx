// src/components/Navbar.jsx - Complete with activeNav state
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isLDAPAuth, setIsLDAPAuth] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const storedUserType = localStorage.getItem('userType');
      const ldapAuth = localStorage.getItem('ldapAuth') === 'true';

      if (token && userData) {
        setIsAuthenticated(true);
        try {
          setUser(JSON.parse(userData));
          setUserType(storedUserType);
          setIsLDAPAuth(ldapAuth);
        } catch (error) {
          console.error('Error parsing user data:', error);
          handleLogout();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setUserType(null);
        setIsLDAPAuth(false);
      }
    };

    checkAuth();
    
    // Listen for storage changes and custom refresh events
    window.addEventListener('storage', checkAuth);
    window.addEventListener('refreshNavbar', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('refreshNavbar', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('ldapAuth');
    setIsAuthenticated(false);
    setUser(null);
    setUserType(null);
    setIsLDAPAuth(false);
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

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg shadow-sm" 
         style={{
           background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
         }}>
      <div className="container">
        {/* Logo */}
        <Link className="navbar-brand d-flex align-items-center text-white fw-bold" to="/">
          <div className="d-inline-flex align-items-center justify-content-center me-3" 
               style={{
                 width: '40px', 
                 height: '40px', 
                 backgroundColor: 'rgba(255, 255, 255, 0.2)',
                 borderRadius: '10px'
               }}>
            <i className="fas fa-database"></i>
          </div>
          <span className="fs-4">TBDplatform</span>
        </Link>

        {/* Mobile toggle */}
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          style={{ color: 'rgba(255, 255, 255, 0.8)' }}
        >
          <i className="fas fa-bars"></i>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Main Navigation */}
          <ul className="navbar-nav me-auto">
            {isAuthenticated && !isActive('/login') && !isActive('/register') && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${activeNav === 'dashboard' ? 'bg-white bg-opacity-20' : 'text-white'}`}
                    style={activeNav === 'dashboard' ? { color: '#764ba2' } : { color: 'white' }}
                    to="/dashboard"
                    onClick={() => setActiveNav('dashboard')}
                  >
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${activeNav === 'services' ? 'bg-white bg-opacity-20' : 'text-white'}`}
                    style={activeNav === 'services' ? { color: '#764ba2' } : { color: 'white' }}
                    to="/services"
                    onClick={() => setActiveNav('services')}
                  >
                    <i className="fas fa-cogs me-2"></i>
                    Services
                  </Link>
                </li>
                {isAdmin() && (
                  <li className="nav-item">
                    <Link 
                      className={`nav-link px-3 py-2 rounded position-relative ${activeNav === 'admin' ? 'bg-white bg-opacity-20' : 'text-white'}`}
                      style={activeNav === 'admin' ? { color: '#764ba2' } : { color: 'white' }}
                      to="/admin"
                      onClick={() => setActiveNav('admin')}
                    >
                      <i className="fas fa-user-shield me-2"></i>
                      Admin Panel
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        <i className="fas fa-crown" style={{ fontSize: '8px' }}></i>
                      </span>
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* User Menu */}
          <ul className="navbar-nav">
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle text-white d-flex align-items-center px-3 py-2"
                  href="#"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px'
                  }}
                >
                  <div className="d-inline-flex align-items-center justify-content-center me-2" 
                       style={{
                         width: '32px', 
                         height: '32px', 
                         backgroundColor: 'rgba(255, 255, 255, 0.2)',
                         borderRadius: '50%'
                       }}>
                    <span className="small fw-bold">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-start d-none d-md-block">
                    <div className="small fw-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="d-flex gap-1">
                      <span className={`badge ${
                        userType === 'internal' 
                          ? 'bg-danger bg-opacity-75' 
                          : 'bg-primary bg-opacity-75'
                      }`} style={{ fontSize: '9px' }}>
                        {userType === 'internal' ? 'Admin' : userType === 'external' ? 'User' : 'Local'}
                      </span>
                      <span className={`badge ${
                        isLDAPAuth 
                          ? 'bg-success bg-opacity-75' 
                          : 'bg-secondary bg-opacity-75'
                      }`} style={{ fontSize: '9px' }}>
                        {isLDAPAuth ? 'LDAP' : 'Local'}
                      </span>
                    </div>
                  </div>
                </a>

                {/* Dropdown Menu */}
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" 
                    style={{ borderRadius: '15px', minWidth: '300px' }}>
                  {/* User Info Header */}
                  <li className="px-3 py-2 border-bottom">
                    <div className="d-flex align-items-center">
                      <div className="d-inline-flex align-items-center justify-content-center me-3" 
                           style={{
                             width: '40px', 
                             height: '40px', 
                             background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                             borderRadius: '10px'
                           }}>
                        <span className="text-white fw-bold">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="fw-medium">@{user?.username}</div>
                        <small className="text-muted">{user?.email}</small>
                      </div>
                    </div>
                  </li>

                  {/* User Details */}
                  <li className="px-3 py-2 bg-light">
                    <div className="row g-1 small">
                      <div className="col-5 text-muted">Authentication:</div>
                      <div className="col-7">{isLDAPAuth ? 'LDAP Directory' : 'Local Database'}</div>
                      
                      <div className="col-5 text-muted">User Type:</div>
                      <div className="col-7">
                        {userType === 'internal' ? 'Internal (Admin)' : userType === 'external' ? 'External (Client)' : 'Local User'}
                      </div>
                      
                      <div className="col-5 text-muted">Namespace:</div>
                      <div className="col-7">
                        <code className="small">{user?.id}{user?.username}</code>
                      </div>
                    </div>
                  </li>

                  {/* Menu Items */}
                  <li>
                    <Link 
                      className="dropdown-item py-2" 
                      to="/dashboard"
                      onClick={() => setActiveNav('dashboard')}
                    >
                      <i className="fas fa-user-circle me-2"></i>
                      Profile Settings
                    </Link>
                  </li>
                  
                  {isAdmin() && (
                    <li>
                      <Link 
                        className="dropdown-item py-2" 
                        to="/admin"
                        onClick={() => setActiveNav('admin')}
                      >
                        <i className="fas fa-user-shield me-2"></i>
                        Admin Dashboard
                      </Link>
                    </li>
                  )}

                  <li><hr className="dropdown-divider" /></li>
                  
                  <li>
                    <button
                      className="dropdown-item py-2 text-danger"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Sign out
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link text-white px-3 py-2 rounded ${isActive('/login') ? 'bg-white bg-opacity-20' : ''}`}
                    to="/login"
                  >
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </Link>
                </li>
                <li className="nav-item ms-2">
                  <Link 
                    className="btn btn-light px-3 py-2"
                    style={{ borderRadius: '10px' }}
                    to="/register"
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;