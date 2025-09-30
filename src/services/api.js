// src/services/api.js - Enhanced API service with relative URLs
import { getAuthHeaders, clearAuth, getCurrentUser } from '../utils/auth';

// Use relative URL - will work in both development and production
// For production deployment

// OR use environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://10.9.21.201:8080/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const authHeaders = getAuthHeaders();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        clearAuth();
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Authentication endpoints
   */
  async login(credentials) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Login failed');
    }

    return response.json();
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Registration failed');
    }

    return response.json();
  }

  async getAuthHealth() {
    const response = await fetch(`${this.baseURL}/auth/health`);
    return response.json();
  }

  /**
   * Database management endpoints
   */
  async createDatabase(databaseData) {
    // Get current user and ensure user context is included
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User authentication required for database creation');
    }

    // Ensure the request includes required user information
    const enhancedData = {
      ...databaseData,
      userId: currentUser.id,          // Required by backend
      userName: currentUser.username,   // Required for namespace creation
      // Keep backward compatibility
      userID: currentUser.id           
    };

    console.log('🔄 Creating database with enhanced data:', enhancedData);

    const response = await this.request('/databases', {
      method: 'POST',
      body: JSON.stringify(enhancedData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create database');
    }

    return response.json();
  }

  async getDatabases(namespace) {
    // If no namespace provided, use current user's namespace
    if (!namespace) {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User authentication required');
      }
      namespace = `${currentUser.id}${currentUser.username}`;
    }

    const response = await this.request(`/databases/${namespace}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch databases');
    }

    return response.json();
  }

  async getUserDatabases(userId) {
    const response = await this.request(`/users/${userId}/databases`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user databases');
    }

    return response.json();
  }

  async deleteDatabase(namespace, databaseName) {
    // If no namespace provided, use current user's namespace
    if (!namespace) {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User authentication required');
      }
      namespace = `${currentUser.id}${currentUser.username}`;
    }

    const response = await this.request(`/databases/${namespace}/${databaseName}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete database');
    }

    return response.json();
  }

  /**
   * Helper method to get current user namespace
   */
  getCurrentUserNamespace() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User authentication required');
    }
    return `${currentUser.id}${currentUser.username}`;
  }

  /**
   * Helper method to get admin URL using current host
   */
  getAdminUrl(namespace, dbName, dbType) {
    const host = window.location.hostname;
    if (dbType === 'mysql') {
      return `http://${host}/${namespace}/${dbName}-phpmyadmin/`;
    } else if (dbType === 'postgresql' || dbType === 'postgres') {
      return `http://${host}/${namespace}/${dbName}-pgadmin/`;
    }
    return '';
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;