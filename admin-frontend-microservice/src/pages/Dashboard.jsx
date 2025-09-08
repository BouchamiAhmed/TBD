import React, { useState, useEffect } from 'react';
import UnifiedAdminDashboard from '../components/admin/UnifiedAdminDashboard';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-red-600">
                🛡️ Admin Dashboard
              </h1>
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                Microservice
              </span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                gRPC
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username || 'Admin'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <UnifiedAdminDashboard />
      </main>
    </div>
  );
};

export default Dashboard;
