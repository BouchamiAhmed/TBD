// src/components/Login.jsx - Enhanced Bootstrap with modern styling
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAuthInfo(null);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Login failed');
      }

      const data = await response.json();
      
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      if (data.userType) {
        localStorage.setItem('userType', data.userType);
      }
      if (data.ldapAuth !== undefined) {
        localStorage.setItem('ldapAuth', data.ldapAuth.toString());
      }
      
      setAuthInfo({
        userType: data.userType || 'local',
        ldapAuth: data.ldapAuth || false
      });
      
      // Trigger navbar refresh
      window.dispatchEvent(new CustomEvent('refreshNavbar'));
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
              {/* Header */}
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{
                         width: '60px', 
                         height: '60px', 
                         background: 'linear-gradient(45deg, #667eea, #764ba2)',
                         borderRadius: '15px'
                       }}>
                    <i className="fas fa-lock text-white" style={{ fontSize: '24px' }}></i>
                  </div>
                  <h2 className="fw-bold text-dark mb-2">Welcome Back</h2>
                  <p className="text-muted">Sign in to your DBSaaS account</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger border-0 rounded-3" role="alert">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                    </div>
                  </div>
                )}

                {/* Success Alert */}
                {authInfo && (
                  <div className="alert alert-success border-0 rounded-3" role="alert">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-check-circle me-2"></i>
                      <strong>Authentication Successful!</strong>
                    </div>
                    <small>
                      <strong>Type:</strong> {authInfo.userType === 'internal' ? 'Internal User (Admin)' : 
                               authInfo.userType === 'external' ? 'External User (Client)' : 
                               'Local User'}<br/>
                      <strong>Method:</strong> {authInfo.ldapAuth ? 'LDAP Directory' : 'Local Database'}
                    </small>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="username" className="form-label fw-medium">Username</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-user text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 py-3"
                        style={{ borderRadius: '0 10px 10px 0' }}
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label fw-medium">Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-lock text-muted"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0 py-3"
                        style={{ borderRadius: '0 10px 10px 0' }}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 py-3 fw-medium text-white border-0"
                    style={{
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      borderRadius: '10px',
                      fontSize: '16px'
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Authenticating...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Footer Links */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-decoration-none fw-medium" style={{ color: '#667eea' }}>
                      Create one here
                    </Link>
                  </p>
                </div>

                {/* Info Box */}
                <div className="alert alert-info border-0 rounded-3 mt-4" style={{ backgroundColor: '#e3f2fd' }}>
                  <div className="d-flex align-items-start">
                    <i className="fas fa-info-circle text-info me-2 mt-1"></i>
                    <div>
                      <strong className="text-info">Authentication Method</strong>
                      <p className="text-info mb-0 small">
                        This system uses LDAP authentication with fallback to local database authentication.
                      </p>
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

export default Login;