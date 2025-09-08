// src/services/api.js - Centralized API service for LDAP-enhanced backend
import { getAuthHeaders, clearAuth } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
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
    const response = await fetch(`${this.baseURL}/api/auth/register`, {
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
    const response = await fetch(`${this.baseURL}/api/auth/health`);
    return response.json();
  }

  /**
   * Database management endpoints
   */
  async createDatabase(databaseData) {
    const response = await this.request('/api/databases', {
      method: 'POST',
      body: JSON.stringify(databaseData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create database');
    }

    return response.json();
  }

  async getDatabases(namespace) {
    const response = await this.request(`/api/databases/${namespace}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch databases');
    }

    return response.json();
  }

  async deleteDatabase(namespace, databaseName) {
    const response = await this.request(`/api/databases/${namespace}/${databaseName}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete database');
    }

    return response.json();
  }

  /**
   * User management endpoints
   */
  async getUsers() {
    const response = await this.request('/api/users');
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  async getUserById(userId) {
    const response = await this.request(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  }

  async updateUser(userId, userData) {
    const response = await this.request(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to update user');
    }

    return response.json();
  }

  async deleteUser(userId) {
    const response = await this.request(`/api/users/${userId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete user');
    }

    return response.json();
  }

  /**
   * Kubernetes pods endpoint
   */
  async getPods(namespace = '') {
    const endpoint = namespace ? `/api/pods/${namespace}` : '/api/pods';
    const response = await this.request(endpoint);
    
    if (!response.ok) {
      throw new Error('Failed to fetch pods');
    }

    return response.json();
  }

  /**
   * System health endpoint
   */
  async getHealth() {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }

  /**
   * YAML deployment endpoint
   */
  async deployYaml(yamlContent) {
    const response = await this.request('/api/deploy-yaml', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: yamlContent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to deploy YAML');
    }

    return response.json();
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;