// admin-frontend-microservice/src/pages/Dashboard.jsx
// NO AUTHENTICATION - Direct LAN access via LoadBalancer
import React from 'react';
import EnhancedAdminDashboard from '../components/EnhancedAdminDashboard';

const Dashboard = () => {
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
                K3s Preprod
              </span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                gRPC :8032
              </span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                LoadBalancer LAN
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Internal Access
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <EnhancedAdminDashboard />
      </main>
    </div>
  );
};

export default Dashboard;