// src/utils/auth.js - Authentication utility functions for LDAP integration

/**
 * Get current authenticated user data
 * @returns {Object|null} User object or null if not authenticated
 */
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get current user's authentication type
 * @returns {string} 'internal', 'external', or 'local'
 */
export const getUserType = () => {
  return localStorage.getItem('userType') || 'local';
};

/**
 * Check if user authenticated via LDAP
 * @returns {boolean} True if LDAP authentication, false otherwise
 */
export const isLDAPAuthenticated = () => {
  return localStorage.getItem('ldapAuth') === 'true';
};

/**
 * Check if current user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  return !!(token && user);
};

/**
 * Check if current user has admin privileges
 * @returns {boolean} True if user is admin, false otherwise
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  const userType = getUserType();
  
  return user && (
    userType === 'internal' || // LDAP internal users are admins
    user.username === 'admin' || 
    user.email?.includes('admin') ||
    user.id === 1
  );
};

/**
 * Get user's namespace for Kubernetes operations
 * @returns {string} User namespace string
 */
export const getUserNamespace = () => {
  const user = getCurrentUser();
  return user ? `${user.id}${user.username}` : '';
};

/**
 * Get authentication token
 * @returns {string|null} JWT token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('ldapAuth');
};

/**
 * Set authentication data
 * @param {Object} userData - User data object
 * @param {string} token - JWT token
 * @param {string} userType - User type (internal/external)
 * @param {boolean} ldapAuth - Whether authenticated via LDAP
 */
export const setAuth = (userData, token, userType = null, ldapAuth = false) => {
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', token);
  
  if (userType) {
    localStorage.setItem('userType', userType);
  }
  
  localStorage.setItem('ldapAuth', ldapAuth.toString());
};

/**
 * Get user display name
 * @returns {string} Formatted user display name
 */
export const getUserDisplayName = () => {
  const user = getCurrentUser();
  if (!user) return 'Guest';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  return user.username || user.email || 'Unknown User';
};

/**
 * Get user avatar initials
 * @returns {string} User initials for avatar
 */
export const getUserInitials = () => {
  const user = getCurrentUser();
  if (!user) return 'G';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  
  if (user.username) {
    return user.username.substring(0, 2).toUpperCase();
  }
  
  return 'U';
};

/**
 * Validate authentication and redirect if needed
 * @param {Function} navigate - React Router navigate function
 * @returns {boolean} True if authenticated, false if redirected
 */
export const requireAuth = (navigate) => {
  if (!isAuthenticated()) {
    navigate('/login');
    return false;
  }
  return true;
};

/**
 * Validate admin privileges and redirect if needed
 * @param {Function} navigate - React Router navigate function
 * @returns {boolean} True if admin, false if redirected
 */
export const requireAdmin = (navigate) => {
  if (!isAuthenticated()) {
    navigate('/login');
    return false;
  }
  
  if (!isAdmin()) {
    navigate('/dashboard');
    return false;
  }
  
  return true;
};

/**
 * Get authorization headers for API requests
 * @returns {Object} Headers object with authorization
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Make authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise with auth headers
 */
export const authenticatedFetch = async (url, options = {}) => {
  const authHeaders = getAuthHeaders();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...authHeaders
  };
  
  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });
};