import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Change to your backend URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear stored credentials
        await AsyncStorage.multiRemove(['token', 'user']);
        
        // You might want to navigate to login screen here
        // navigationRef.current?.navigate('Login');
        
        return Promise.reject({
          success: false,
          message: 'Session expired. Please login again.',
          code: 'SESSION_EXPIRED'
        });
      } catch (storageError) {
        return Promise.reject(storageError);
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      });
    }

    // Handle other errors
    const errorMessage = error.response.data?.message || 'An error occurred';
    const errorCode = error.response.data?.code || 'UNKNOWN_ERROR';

    return Promise.reject({
      success: false,
      message: errorMessage,
      code: errorCode,
      data: error.response.data
    });
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify-token'),
};

// Medication API calls
export const medicationAPI = {
  getAll: () => api.get('/medications'),
  getById: (id) => api.get(`/medications/${id}`),
  create: (medicationData) => api.post('/medications', medicationData),
  update: (id, medicationData) => api.put(`/medications/${id}`, medicationData),
  delete: (id) => api.delete(`/medications/${id}`),
  markAsTaken: (id, notes) => api.post(`/medications/${id}/take`, { notes }),
  markAsMissed: (id) => api.post(`/medications/${id}/miss`),
  getStats: () => api.get('/medications/stats/overview'),
  searchDrug: (drugName) => api.get(`/medications/search/drug/${drugName}`),
  checkInteractions: (medications) => api.post('/medications/check-interactions', { medications }),
};

// Export the api instance for custom requests
export default api;