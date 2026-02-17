// API service module for MediSafe app
// This connects to the backend at localhost:5000
// Falls back to mock backend if real backend is unavailable

import { mockAuthAPI, mockMedicationAPI, MOCK_MODE_ENABLED } from './mockBackend';

// Dynamic API Base URL logic for "Same Host" support
const getApiBaseUrl = () => {
    // If running in browser
    if (typeof window !== 'undefined') {
        const { hostname } = window.location;

        // Development: Localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }

        // Production: Vercel/Netlify/GitHub Pages -> Render Backend
        return 'https://medhas-backend.onrender.com/api';
    }

    // Mobile (Android/iOS) -> Render Backend
    return 'https://medhas-backend.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();
let useMockBackend = false;

// Helper function for API calls with mock fallback
const apiCall = async (endpoint, options = {}) => {
    // If mock mode is forced or we've detected backend is down, use mock
    if (MOCK_MODE_ENABLED || useMockBackend) {
        console.log('⚠️ Using Mock Backend for:', endpoint);
        return handleMockRequest(endpoint, options);
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return { success: true, data, status: response.status };
    } catch (error) {
        console.error('❌ Backend API Error:', error.message);

        // If fetch failed (network error, timeout, etc.), switch to mock backend
        if (error.name === 'AbortError' || error.message.includes('fetch')) {
            console.log('🔄 Switching to Mock Backend due to connection failure');
            useMockBackend = true;
            return handleMockRequest(endpoint, options);
        }

        return { success: false, message: error.message, error };
    }
};

// Handle mock API requests
const handleMockRequest = async (endpoint, options) => {
    try {
        // Parse the request body if present
        const body = options.body ? JSON.parse(options.body) : {};

        // Route to appropriate mock handler
        if (endpoint === '/auth/register') {
            return await mockAuthAPI.register(body);
        } else if (endpoint === '/auth/login') {
            return await mockAuthAPI.login(body);
        } else if (endpoint === '/medications' && options.method === 'POST') {
            return await mockMedicationAPI.create(body);
        } else if (endpoint === '/medications') {
            return await mockMedicationAPI.getAll();
        } else if (endpoint.startsWith('/medications/search')) {
            const name = endpoint.split('name=')[1];
            return await mockMedicationAPI.searchDrug(decodeURIComponent(name));
        }

        // Default response for unhandled endpoints
        return {
            success: true,
            data: {},
            message: 'Mock response - endpoint not fully implemented',
        };
    } catch (error) {
        console.error('Mock API Error:', error);
        return { success: false, message: error.message, error };
    }
};

// Auth API
export const authAPI = {
    register: async (userData) => {
        return apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    login: async (credentials) => {
        return apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },
};

// Medication API
export const medicationAPI = {
    create: async (medication) => {
        return apiCall('/medications', {
            method: 'POST',
            body: JSON.stringify(medication),
        });
    },

    getAll: async () => {
        return apiCall('/medications');
    },

    getById: async (id) => {
        return apiCall(`/medications/${id}`);
    },

    update: async (id, medication) => {
        return apiCall(`/medications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(medication),
        });
    },

    delete: async (id) => {
        return apiCall(`/medications/${id}`, {
            method: 'DELETE',
        });
    },

    searchDrug: async (name) => {
        return apiCall(`/medications/search?name=${encodeURIComponent(name)}`);
    },

    checkInteractions: async (medications) => {
        return apiCall('/medications/interactions', {
            method: 'POST',
            body: JSON.stringify({ medications }),
        });
    },
};

// Log API service initialization
console.log('📡 API Service initialized with mock backend fallback');
