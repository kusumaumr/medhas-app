// SecurityService.js
// Handles app security: PIN lock and biometric authentication

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const PASSCODE_KEY = 'app_passcode';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

/**
 * Check if a passcode is currently set
 */
export const isPasscodeSet = async () => {
    try {
        const passcode = await AsyncStorage.getItem(PASSCODE_KEY);
        return passcode !== null;
    } catch (error) {
        console.error('Error checking passcode:', error);
        return false;
    }
};

/**
 * Save a new passcode
 * @param {string} code - 4-digit PIN
 */
export const setPasscode = async (code) => {
    try {
        if (!code || code.length !== 4) {
            throw new Error('Passcode must be 4 digits');
        }
        await AsyncStorage.setItem(PASSCODE_KEY, code);
        return { success: true };
    } catch (error) {
        console.error('Error setting passcode:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify a passcode
 * @param {string} code - 4-digit PIN to verify
 */
export const verifyPasscode = async (code) => {
    try {
        const savedCode = await AsyncStorage.getItem(PASSCODE_KEY);
        return code === savedCode;
    } catch (error) {
        console.error('Error verifying passcode:', error);
        return false;
    }
};

/**
 * Remove the passcode (requires verification first)
 */
export const removePasscode = async () => {
    try {
        await AsyncStorage.removeItem(PASSCODE_KEY);
        await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
        return { success: true };
    } catch (error) {
        console.error('Error removing passcode:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if biometric authentication is available on this device
 */
export const isBiometricAvailable = async () => {
    try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
            return { available: false, reason: 'No biometric hardware' };
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) {
            return { available: false, reason: 'No biometrics enrolled' };
        }

        return { available: true };
    } catch (error) {
        console.error('Error checking biometric availability:', error);
        return { available: false, reason: error.message };
    }
};

/**
 * Authenticate using biometrics
 */
export const authenticateWithBiometrics = async () => {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access your health data',
            fallbackLabel: 'Use Passcode',
            disableDeviceFallback: false,
        });

        return {
            success: result.success,
            error: result.error,
        };
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if biometric authentication is enabled for the app
 */
export const isBiometricEnabled = async () => {
    try {
        const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        return enabled === 'true';
    } catch (error) {
        console.error('Error checking biometric enabled status:', error);
        return false;
    }
};

/**
 * Enable biometric authentication
 */
export const enableBiometric = async () => {
    try {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        return { success: true };
    } catch (error) {
        console.error('Error enabling biometric:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Disable biometric authentication
 */
export const disableBiometric = async () => {
    try {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
        return { success: true };
    } catch (error) {
        console.error('Error disabling biometric:', error);
        return { success: false, error: error.message };
    }
};
