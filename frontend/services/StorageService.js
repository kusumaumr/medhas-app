// Storage service for managing app data
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform, Alert } from 'react-native';

// API Configuration
// Use 127.0.0.1 instead of localhost for better consistency across environments
const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://127.0.0.1:5000/api';

// Create axios instance with timeout to prevent hanging UI
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const getAuthHeader = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            console.warn('🔑 No token found in storage. Request will likely fail.');
            return {};
        }
        return { Authorization: `Bearer ${token}` };
    } catch (error) {
        console.error('Error getting auth token:', error);
        return {};
    }
};

const STORAGE_KEYS = {
    MEDICATIONS: '@medisafe_medications', // Keeping for fallback/offline if needed
    HEALTH_LOG: '@medisafe_health_log',
    CONTACTS: '@medisafe_contacts',
    SETTINGS: '@medisafe_settings',
};

// ==================== MEDICATIONS (API CONNECTED) ====================

export const getMedications = async () => {
    try {
        console.log('📡 [API] Fetching medications...');
        const headers = await getAuthHeader();

        if (!headers.Authorization) {
            console.warn('⚠️ [API] No auth token found. Redirect to login might be needed.');
            return [];
        }

        const response = await api.get('/medications', { headers });

        if (response.data && response.data.success) {
            // Map MongoDB _id to id for Frontend compatibility
            const mappedData = response.data.data.map(med => ({
                ...med,
                id: med._id || med.id
            }));
            console.log(`✅ [API] Fetched ${mappedData.length} medications`);
            return mappedData;
        }
        return [];
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('❌ [API] Error fetching medications:', errorMsg);

        if (error.code === 'ECONNABORTED') {
            Alert.alert('Connection Timeout', 'The server is taking too long to respond. Please check your internet or if the backend is running.');
        } else if (error.response?.status === 401) {
            console.warn('Authentication expired or invalid');
        } else if (Platform.OS !== 'web') {
            Alert.alert('Connection Error', `Could not fetch medications: ${errorMsg}`);
        }
        return [];
    }
};

export const saveMedications = async (medications) => {
    // Legacy function support - No-op for API mode, or maybe sync?
    // We don't save the whole list anymore, we add/update individually.
    console.warn('saveMedications called but we are in API mode. Ignoring.');
    return true;
};

export const addMedication = async (medication) => {
    try {
        console.log('💊 [API] Adding medication:', medication.name);
        const headers = await getAuthHeader();

        // Use api instance (with timeout)
        const response = await api.post('/medications', medication, { headers });
        console.log('📡 [API] Server response:', response.data);

        // CASE A: Success - Medication Saved
        if (response.data && response.data.success) {
            const newMed = {
                ...response.data.data,
                id: response.data.data._id || response.data.data.id
            };
            console.log('✅ [API] Medication added successfully:', newMed.id);
            return { success: true, data: newMed };
        }

        // CASE B: Confirmation Required - Interactions Found (NOT Saved yet)
        if (response.data && response.data.confirmationRequired) {
            console.log('⚠️ [API] Interaction confirmation required');
            return {
                success: false,
                confirmationRequired: true,
                warning: response.data.warning
            };
        }

        return { success: false };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('❌ [API] Error adding medication:', errorMsg);

        if (error.code === 'ECONNABORTED') {
            Alert.alert(
                'Connection Timeout',
                `The app couldn't reach the server at ${API_BASE_URL}. \n\n1. Ensure the Backend Terminal is running.\n2. If using a real phone, check your WiFi.`
            );
        } else if (error.response?.status === 400) {
            Alert.alert('Validation Error', `Ensure all fields are correct: ${errorMsg}`);
        } else if (error.response?.status !== 401) {
            Alert.alert('Server Error', 'Could not save medication to the database. Check your connection.');
        }
        return { success: false, error: errorMsg };
    }
};

export const updateMedication = async (id, updates) => {
    try {
        console.log(`📝 [API] Updating medication ${id}...`);
        const headers = await getAuthHeader();
        const response = await api.put(`/medications/${id}`, updates, { headers });

        if (response.data && response.data.success) {
            console.log('✅ [API] Medication updated successfully');
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error('❌ [API] Error updating medication:', error.response?.data || error.message);
        return null;
    }
};

export const deleteMedication = async (id) => {
    try {
        console.log(`🗑️ [API] Deleting medication ${id}...`);
        const headers = await getAuthHeader();
        const response = await api.delete(`/medications/${id}`, { headers });

        if (response.data && response.data.success) {
            console.log('✅ [API] Medication deleted successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ [API] Error deleting medication:', error.message);
        return false;
    }
};

export const markMedicationTaken = async (id, timestamp = new Date().toISOString()) => {
    // Note: Backend might need a specific endpoint for 'take', or we use PUT
    // Current backend route doesn't seem to have specific 'take' endpoint, 
    // but updateMedication logic might handle history if we passed the whole object.
    // However, safest way with standard CRUD is to fetch, update history, and PUT.
    // OR: Create a specific /take endpoint on backend. 
    // For now, I'll simulate it via PUT.
    try {
        console.log(`✅ Marking medication ${id} as taken...`);
        const headers = await getAuthHeader();

        // 1. Fetch current (to get latest history)
        // Ideally backend handles this atomic operation. 
        // We will assume simpler logic for this immediate fix: 
        // Just note that without a dedicated endpoint, race conditions exist.
        // But for a single user app, it's acceptable.

        // Actually, looking at backend: medication.schema has 'markAsTaken' method but it's not exposed as a specific route action in routes.js
        // It's exposed via generic PUT if we update the adherence/history manually.
        // Let's rely on updateMedication for now.

        // We need to fetch it first to append to history?
        // Or can we trust the caller passed the right state? 
        // Caller usually just calls this function.

        // 1. Fetch current (to get latest history)
        const response = await api.get('/medications', { headers });
        const meds = response.data.data || [];
        const med = meds.find(m => m.id === id || m._id === id);

        if (med) {
            const newHistory = med.history || [];
            newHistory.push({ takenAt: timestamp, status: 'taken' });

            await updateMedication(id, { history: newHistory });
            return true;
        }
        return false;

    } catch (error) {
        console.error('Error marking taken:', error);
        return false;
    }
};

// ==================== USER PROFILE ====================

export const updateProfile = async (updates) => {
    try {
        console.log('👤 [API] Updating user profile...');
        const headers = await getAuthHeader();
        const response = await api.put('/auth/profile', updates, { headers });

        if (response.data && response.data.success) {
            console.log('✅ [API] Profile updated successfully');
            // Update local user data in AsyncStorage
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                const updatedUser = { ...user, ...response.data.user };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
            return response.data.user;
        }
        return null;
    } catch (error) {
        console.error('❌ [API] Error updating profile:', error.response?.data || error.message);
        return null;
    }
};

// ==================== HEALTH LOG ====================

export const getHealthLog = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_LOG);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting health log:', error);
        return [];
    }
};

export const addHealthEntry = async (entry) => {
    try {
        const log = await getHealthLog();
        const newEntry = {
            id: Date.now().toString(),
            ...entry,
            timestamp: entry.timestamp || new Date().toISOString(),
        };
        log.push(newEntry);
        await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_LOG, JSON.stringify(log));
        return newEntry;
    } catch (error) {
        console.error('Error adding health entry:', error);
        return null;
    }
};

export const deleteHealthEntry = async (id) => {
    try {
        const log = await getHealthLog();
        const filtered = log.filter(e => e.id !== id);
        await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_LOG, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting health entry:', error);
        return false;
    }
};

// ==================== CONTACTS ====================

export const getContacts = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting contacts:', error);
        return [];
    }
};

export const addContact = async (contact) => {
    try {
        const contacts = await getContacts();
        const newContact = {
            id: Date.now().toString(),
            ...contact,
        };
        contacts.push(newContact);
        await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
        return newContact;
    } catch (error) {
        console.error('Error adding contact:', error);
        return null;
    }
};

export const deleteContact = async (id) => {
    try {
        const contacts = await getContacts();
        const filtered = contacts.filter(c => c.id !== id);
        await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting contact:', error);
        return false;
    }
};

// ==================== SETTINGS ====================

export const getSettings = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            notifications: {
                enabled: true,
                sound: true,
                vibration: true,
            },
            display: {
                theme: 'light',
                fontSize: 'medium',
            },
            privacy: {
                passcode: false,
                biometric: false,
            },
        };
    } catch (error) {
        console.error('Error getting settings:', error);
        return {};
    }
};

export const saveSettings = async (settings) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
};
