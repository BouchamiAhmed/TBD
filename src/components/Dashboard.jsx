import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
              <hr />
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Account created:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
              <button 
                className="btn btn-danger w-100 mt-3" 
                onClick={handleLogout}
              >
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
                <button className="btn btn-outline-primary" onClick={() => navigate('/services')}>
                  <i className="fas fa-database me-2"></i>
                  Manage Databases
                </button>
                <button className="btn btn-outline-secondary" onClick={() => navigate('/users')}>
                  <i className="fas fa-users me-2"></i>
                  Manage Users
                </button>
              </div>
              
              <div className="alert alert-info mt-4">
                <h6 className="alert-heading">Getting Started</h6>
                <p>
                  To create a new database, navigate to the Services page and select the database type you want to deploy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;