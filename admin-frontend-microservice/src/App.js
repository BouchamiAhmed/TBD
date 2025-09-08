import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('adminToken') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};
function App() {
  return (
    <div className="App admin-theme">
      <Router>
        <Routes>
          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route 
            path="/" 
            element={
              localStorage.getItem('adminToken') ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Public login route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected admin routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to dashboard */}
          <Route 
            path="*" 
            element={<Navigate to="/dashboard" replace />} 
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;