// src/App.js - Updated with LDAP-aware admin routing
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
import SimplifiedAdminDashboard from './components/SimplifiedAdminDashboard';
import PaymentInterface from './components/PaymentInterface';
// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Enhanced Admin Route component with LDAP support
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const userData = localStorage.getItem('user');
  const userType = localStorage.getItem('userType');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  try {
    const user = JSON.parse(userData);
    const isAdmin = user && (
      userType === 'internal' || // LDAP internal users are admins
      user.username === 'admin' || 
      user.email?.includes('admin') ||
      user.id === 1
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
         <Route path="/payment" element={<PaymentInterface />} />
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
        
        {/* Admin-only route with LDAP support */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <SimplifiedAdminDashboard />
            </AdminRoute>
          } 
        />
       
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;