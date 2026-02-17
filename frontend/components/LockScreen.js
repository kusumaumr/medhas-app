import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { verifyPasscode, authenticateWithBiometrics, isBiometricEnabled, isBiometricAvailable } from '../services/SecurityService';
import { useLanguage } from '../services/LanguageContext';

const LockScreen = ({ visible, onUnlock }) => {
    const { t } = useLanguage();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [isPinVisible, setIsPinVisible] = useState(false);

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        const available = await isBiometricAvailable();
        const enabled = await isBiometricEnabled();
        setBiometricAvailable(available.available);
        setBiometricEnabled(enabled);
    };

    const handleNumberPress = (num) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            setError('');
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const verifyPin = async (code) => {
        const isValid = await verifyPasscode(code);
        if (isValid) {
            setPin('');
            setError('');
            onUnlock();
        } else {
            setError(t('incorrectPasscode') || 'Incorrect passcode');
            setPin('');
        }
    };

    const handleBiometric = async () => {
        const result = await authenticateWithBiometrics();
        if (result.success) {
            onUnlock();
        } else {
            setError(t('biometricFailed') || 'Biometric authentication failed');
        }
    };

    if (!visible) return null;

    return (
        <Portal>
            <Modal
                visible={visible}
                dismissable={false}
                contentContainerStyle={styles.modal}
            >
                <View style={styles.container}>
                    <Icon name="lock" size={48} color="#10b981" style={styles.lockIcon} />
                    <Text style={styles.title}>{t('enterPasscode') || 'Enter Passcode'}</Text>
                    <Text style={styles.subtitle}>{t('unlockApp') || 'Unlock to access your health data'}</Text>

                    {/* PIN Dots / Text */}
                    <View style={styles.pinDisplayContainer}>
                        <View style={styles.dotsContainer}>
                            {[0, 1, 2, 3].map((i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        pin.length > i && styles.dotFilled,
                                        isPinVisible && styles.dotVisible, // Style for visible text container
                                    ]}
                                >
                                    {isPinVisible && pin.length > i ? (
                                        <Text style={styles.pinDigit}>{pin[i]}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsPinVisible(!isPinVisible)}
                            style={styles.eyeButton}
                        >
                            <Icon name={isPinVisible ? "eye-off" : "eye"} size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {/* Number Pad */}
                    <View style={styles.numpad}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.numButton}
                                onPress={() => handleNumberPress(num.toString())}
                            >
                                <Text style={styles.numText}>{num}</Text>
                            </TouchableOpacity>
                        ))}

                        {/* Biometric or Empty */}
                        <View style={styles.numButton}>
                            {biometricAvailable && biometricEnabled && (
                                <TouchableOpacity onPress={handleBiometric}>
                                    <Icon name="fingerprint" size={32} color="#10b981" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Zero */}
                        <TouchableOpacity
                            style={styles.numButton}
                            onPress={() => handleNumberPress('0')}
                        >
                            <Text style={styles.numText}>0</Text>
                        </TouchableOpacity>

                        {/* Delete */}
                        <TouchableOpacity
                            style={styles.numButton}
                            onPress={handleDelete}
                        >
                            <Icon name="backspace-outline" size={28} color="#64748b" />
                        </TouchableOpacity>

                        {/* Verify/OK Button - Full Width */}
                        <TouchableOpacity
                            style={[styles.okButton, pin.length !== 4 && styles.okButtonDisabled]}
                            onPress={() => verifyPin(pin)}
                            disabled={pin.length !== 4}
                        >
                            <Text style={styles.okButtonText}>{t('ok') || 'OK'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modal: {
        backgroundColor: 'white',
        margin: 0,
        padding: 0,
        ...(Platform.OS === 'web' && {
            maxWidth: 400,
            alignSelf: 'center',
            borderRadius: 16,
        }),
    },
    container: {
        padding: 32,
        alignItems: 'center',
        minHeight: 600,
        justifyContent: 'center',
    },
    lockIcon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 32,
        textAlign: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    error: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 280,
        marginTop: 16,
    },
    numButton: {
        width: 80,
        height: 80,
        margin: 6,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    numText: {
        fontSize: 28,
        fontWeight: '500',
        color: '#0f172a',
    },
    pinDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    eyeButton: {
        marginLeft: 16,
        padding: 8,
    },
    dotVisible: {
        backgroundColor: 'transparent',
        borderColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinDigit: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    okButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#10b981',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginHorizontal: 10,
    },
    okButtonDisabled: {
        backgroundColor: '#cbd5e1',
    },
    okButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LockScreen;
