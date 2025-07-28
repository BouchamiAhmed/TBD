import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Services from './components/Services';
import Users from './components/Users';
// Make sure this is importing the NEW simplified admin dashboard
import SimplifiedAdminDashboard from './components/SimplifiedAdminDashboard.jsx';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const userData = localStorage.getItem('user');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  try {
    const user = JSON.parse(userData);
    const isAdmin = user && (
      user.username === 'admin' || 
      user.email?.includes('admin') ||
      user.id === 1 // customize this logic as needed
    );
    
    if (!isAdmin) {
      return <Navigate to="/dashboard" />;
    }
    
    return children;
  } catch (error) {
    return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        {/* Redirect root to dashboard if logged in, otherwise to login */}
        <Route 
          path="/" 
          element={
            localStorage.getItem('token') ? 
              <Navigate to="/dashboard" /> : 
              <Navigate to="/login" />
          } 
        />
        
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/services" 
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes - ONLY add these, don't change existing routes */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <SimplifiedAdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <SimplifiedAdminDashboard />
            </AdminRoute>
          } 
        />
        
        {/* Legacy admin route redirect */}
        <Route 
          path="/admin/databases" 
          element={<Navigate to="/admin" />}
        />
      </Routes>
    </div>
  );
}

export default App;