// src/components/Register.jsx - Enhanced Bootstrap with modern styling
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: 'external'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...dataToSend } = formData;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Registration failed');
      }

      const data = await response.json();
      
      if (data.success) {
        alert(data.message || 'Registration successful! Please login.');
        navigate('/login');
      } else if (data.user && data.token) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-5" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
              <div className="card-body p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{
                         width: '60px', 
                         height: '60px', 
                         background: 'linear-gradient(45deg, #764ba2, #667eea)',
                         borderRadius: '15px'
                       }}>
                    <i className="fas fa-user-plus text-white" style={{ fontSize: '24px' }}></i>
                  </div>
                  <h2 className="fw-bold text-dark mb-2">Create Account</h2>
                  <p className="text-muted">Join the DBSaaS platform today</p>
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

                {/* Registration Form */}
                <form onSubmit={handleSubmit}>
                  {/* Name Fields */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="firstName" className="form-label fw-medium">First Name</label>
                      <input
                        type="text"
                        className="form-control py-3"
                        style={{ borderRadius: '10px' }}
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="lastName" className="form-label fw-medium">Last Name</label>
                      <input
                        type="text"
                        className="form-control py-3"
                        style={{ borderRadius: '10px' }}
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="mb-3">
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
                        placeholder="johndoe"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-envelope text-muted"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 py-3"
                        style={{ borderRadius: '0 10px 10px 0' }}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* User Type */}
                  <div className="mb-3">
                    <label htmlFor="userType" className="form-label fw-medium">User Type</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                        <i className="fas fa-users text-muted"></i>
                      </span>
                      <select
                        className="form-select border-start-0 py-3"
                        style={{ borderRadius: '0 10px 10px 0' }}
                        id="userType"
                        name="userType"
                        value={formData.userType}
                        onChange={handleChange}
                        required
                      >
                        <option value="external">External User (Client)</option>
                        <option value="internal">Internal User (Admin)</option>
                      </select>
                    </div>
                    <div className="form-text text-muted small">
                      This determines your LDAP group and system permissions
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="row mb-4">
                    <div className="col-md-6">
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
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="confirmPassword" className="form-label fw-medium">Confirm Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                          <i className="fas fa-check text-muted"></i>
                        </span>
                        <input
                          type="password"
                          className="form-control border-start-0 py-3"
                          style={{ borderRadius: '0 10px 10px 0' }}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn w-100 py-3 fw-medium text-white border-0"
                    style={{
                      background: 'linear-gradient(45deg, #764ba2, #667eea)',
                      borderRadius: '10px',
                      fontSize: '16px'
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating LDAP Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>

                {/* Footer Links */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none fw-medium" style={{ color: '#764ba2' }}>
                      Sign in here
                    </Link>
                  </p>
                </div>

                {/* Info Box */}
                <div className="alert alert-info border-0 rounded-3 mt-4" style={{ backgroundColor: '#e3f2fd' }}>
                  <div className="d-flex align-items-start">
                    <i className="fas fa-info-circle text-info me-2 mt-1"></i>
                    <div>
                      <strong className="text-info">LDAP Integration</strong>
                      <p className="text-info mb-0 small">
                        Your account will be created in the LDAP directory and synchronized with the local database.
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

export default Register;