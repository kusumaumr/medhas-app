/**
 * Mock Backend Service for MediSafe
 * Provides mock API responses for testing without a running backend server
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Simulate network delay
const simulateDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock Authentication API
 */
export const mockAuthAPI = {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response
     */
    register: async (userData) => {
        console.log('🔧 [MOCK API] Registration request received:', userData.email);

        // Simulate network delay
        await simulateDelay(1000);

        // Check if user already exists
        const existingUsers = await AsyncStorage.getItem('mock_users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];

        const userExists = users.find(u => u.email === userData.email);
        if (userExists) {
            console.log('❌ [MOCK API] User already exists');
            return {
                success: false,
                message: 'An account with this email already exists',
            };
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            dateOfBirth: userData.dateOfBirth,
            gender: userData.gender,
            bloodGroup: userData.bloodGroup,
            language: userData.language,
            createdAt: new Date().toISOString(),
        };

        // Generate mock JWT token
        const token = `mock_jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Store user in mock database
        users.push({ ...newUser, password: userData.password });
        await AsyncStorage.setItem('mock_users', JSON.stringify(users));

        console.log('✅ [MOCK API] User registered successfully:', newUser.email);

        return {
            success: true,
            data: {
                token,
                user: newUser,
            },
            message: 'Registration successful',
        };
    },

    /**
     * Login user
     * @param {Object} credentials - Login credentials
     * @returns {Promise<Object>} Login response
     */
    login: async (credentials) => {
        console.log('🔧 [MOCK API] Login request received:', credentials.email);

        // Simulate network delay
        await simulateDelay(800);

        // Get users from mock database
        const existingUsers = await AsyncStorage.getItem('mock_users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];

        const user = users.find(
            u => u.email === credentials.email && u.password === credentials.password
        );

        if (!user) {
            console.log('❌ [MOCK API] Invalid credentials');
            return {
                success: false,
                message: 'Invalid email or password',
            };
        }

        // Generate mock JWT token
        const token = `mock_jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        console.log('✅ [MOCK API] Login successful:', user.email);

        return {
            success: true,
            data: {
                token,
                user: userWithoutPassword,
            },
            message: 'Login successful',
        };
    },
};

/**
 * Mock Medication API
 */
export const mockMedicationAPI = {
    /**
     * Create a new medication
     * @param {Object} medication - Medication data
     * @returns {Promise<Object>} Creation response
     */
    create: async (medication) => {
        console.log('🔧 [MOCK API] Create medication request');
        await simulateDelay(600);

        const newMedication = {
            id: Date.now().toString(),
            ...medication,
            createdAt: new Date().toISOString(),
        };

        return {
            success: true,
            data: newMedication,
            message: 'Medication created successfully',
        };
    },

    /**
     * Get all medications
     * @returns {Promise<Object>} Medications list
     */
    getAll: async () => {
        console.log('🔧 [MOCK API] Get all medications request');
        await simulateDelay(400);

        // Return empty array for now - could extend to store medications
        return {
            success: true,
            data: [],
            message: 'Medications retrieved successfully',
        };
    },

    /**
     * Search for drugs in database
     * @param {string} name - Drug name to search
     * @returns {Promise<Object>} Search results
     */
    searchDrug: async (name) => {
        console.log('🔧 [MOCK API] Drug search request:', name);
        await simulateDelay(500);

        // Mock drug database results
        const mockResults = [
            { id: '1', name: 'Aspirin', category: 'Pain Relief', dosage: '100mg' },
            { id: '2', name: 'Ibuprofen', category: 'Pain Relief', dosage: '200mg' },
        ].filter(drug => drug.name.toLowerCase().includes(name.toLowerCase()));

        return {
            success: true,
            data: mockResults,
            message: 'Search completed successfully',
        };
    },
};

// Export flag to enable/disable mock mode
export const MOCK_MODE_ENABLED = false;

console.log('🔧 Mock Backend Service initialized');
