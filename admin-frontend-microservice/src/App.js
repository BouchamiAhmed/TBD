// admin-frontend-microservice/src/App.js
// NO AUTHENTICATION - Direct access for internal LAN/LoadBalancer
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="App admin-theme">
      <Router>
        <Routes>
          {/* Direct access to dashboard - no login required */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;