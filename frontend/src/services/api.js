import axios from 'axios';

// API Base URL - Use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        
        // Store new access token
        localStorage.setItem('access_token', access);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    
    // Store tokens
    if (response.data.tokens) {
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
    }
    
    return response.data;
  },

  // Login user
  login: async (username, password) => {
    const response = await api.post('/auth/token/', { username, password });
    
    // Store tokens
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

// User API functions
export const userAPI = {
  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/users/me/');
    return response.data;
  },

  // Update current user's profile (self-update)
  updateProfile: async (userData) => {
    const response = await api.patch('/users/me/', userData);
    return response.data;
  },

  // Get all users (admin only)
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.patch(`/users/${id}/`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  },

  // Verify user (admin only)
  verifyUser: async (id) => {
    const response = await api.post(`/users/${id}/verify/`);
    return response.data;
  },

  // Unverify user (admin only)
  unverifyUser: async (id) => {
    const response = await api.post(`/users/${id}/unverify/`);
    return response.data;
  },

  // Activate user (admin only)
  activateUser: async (id) => {
    const response = await api.post(`/users/${id}/activate/`);
    return response.data;
  },

  // Deactivate user (admin only)
  deactivateUser: async (id) => {
    const response = await api.post(`/users/${id}/deactivate/`);
    return response.data;
  },
};

export default api;
