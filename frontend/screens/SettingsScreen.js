import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Text, Switch, Card, Button, Divider, Portal, Modal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings, saveSettings, updateProfile } from '../services/StorageService';
import { translateText } from '../services/TranslationService';
import { useLanguage } from '../services/LanguageContext';
import {
    setPasscode,
    verifyPasscode,
    removePasscode,
    isBiometricAvailable,
    authenticateWithBiometrics,
    enableBiometric,
    disableBiometric
} from '../services/SecurityService';

const SettingsScreen = ({ onGoBack }) => {
    const { language, changeLanguage, t } = useLanguage();
    const [settings, setSettings] = useState({
        notifications: { enabled: true, sound: true, vibration: true },
        display: { theme: 'light', fontSize: 'medium' },
        privacy: { passcode: false, biometric: false },
        language: 'en',
    });
    const [userName, setUserName] = useState('User');
    const [displayUserName, setDisplayUserName] = useState('User');

    // PIN Modal States
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinStep, setPinStep] = useState('create'); // 'create', 'confirm', 'verify'
    const [pinInput, setPinInput] = useState('');
    const [firstPin, setFirstPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [isPinVisible, setIsPinVisible] = useState(false); // New state for visibility


    // Sync language from context on mount
    useEffect(() => {
        if (language !== settings.language) {
            setSettings(prev => ({ ...prev, language }));
        }
    }, [language]);

    // Translate User Name when language or name changes
    useEffect(() => {
        const translateName = async () => {
            if (userName) {
                // If English, just use original name
                if (language === 'en') {
                    setDisplayUserName(userName);
                    return;
                }

                // Try to translate/transliterate
                try {
                    const translated = await translateText(userName, language);
                    setDisplayUserName(translated);
                } catch (error) {
                    console.error('Error translating name:', error);
                    setDisplayUserName(userName);
                }
            }
        };
        translateName();
    }, [userName, language]);

    useEffect(() => {
        loadSettings();
        loadUserInfo();
    }, []);

    const loadSettings = async () => {
        const data = await getSettings();
        setSettings(data);
    };

    const loadUserInfo = async () => {
        try {
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                // Default to 'Kusum' if name is missing or generic 'User'
                setUserName((user.name && user.name !== 'User') ? user.name : 'Kusum');
            } else {
                setUserName('Kusum');
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    };

    const updateSetting = async (category, key, value) => {
        let newSettings;

        // Handle language setting (which is not nested)
        if (category === 'language') {
            console.log('🌐 Changing language to:', key);
            // Update global language context
            await changeLanguage(key);

            // Sync with backend for Voice Reminders
            await updateProfile({ language: key });

            newSettings = {
                ...settings,
                language: key,
            };
        } else {
            // Handle nested settings (notifications, display, privacy)
            newSettings = {
                ...settings,
                [category]: { ...settings[category], [key]: value },
            };
        }

        setSettings(newSettings);
        await saveSettings(newSettings);
    };

    const handleLogout = async () => {
        const confirmed = Platform.OS === 'web'
            ? window.confirm(t('logoutConfirmMsg'))
            : await new Promise((resolve) => {
                Alert.alert(t('logoutConfirm'), t('logoutConfirmMsg'), [
                    { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
                    { text: t('logout'), style: 'destructive', onPress: () => resolve(true) },
                ]);
            });

        if (confirmed) {
            await AsyncStorage.multiRemove(['token', 'user']);
            if (Platform.OS === 'web') {
                window.location.href = window.location.origin + '?clear=true';
            }
        }
    };

    const handleClearAllData = async () => {
        const confirmed = Platform.OS === 'web'
            ? window.confirm(t('clearDataConfirmMsg'))
            : await new Promise((resolve) => {
                Alert.alert(
                    t('clearAllData'),
                    t('clearDataConfirmMsg'),
                    [
                        { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
                        { text: t('clearAllDataBtn'), style: 'destructive', onPress: () => resolve(true) },
                    ]
                );
            });

        if (confirmed) {
            try {
                // Clear all AsyncStorage data
                await AsyncStorage.clear();

                if (Platform.OS === 'web') {
                    alert(`✅ ${t('dataClearedSuccess')}`);
                    window.location.href = window.location.origin + '?clear=true';
                } else {
                    Alert.alert(t('success'), t('dataClearedSuccess'));
                }
            } catch (error) {
                console.error('Error clearing data:', error);
                if (Platform.OS === 'web') {
                    alert(`❌ ${t('dataClearError')}`);
                } else {
                    Alert.alert(t('error'), t('dataClearError'));
                }
            }
        }
    };

    // Security Handlers
    const handlePasscodeToggle = async (value) => {
        if (value) {
            // Enable passcode - show PIN creation modal
            setPinStep('create');
            setPinInput('');
            setFirstPin('');
            setPinError('');
            setShowPinModal(true);
        } else {
            // Disable passcode - verify current PIN first
            setPinStep('verify');
            setPinInput('');
            setPinError('');
            setShowPinModal(true);
        }
    };

    const handleBiometricToggle = async (value) => {
        if (value) {
            // Check availability first
            const available = await isBiometricAvailable();
            if (!available.available) {
                Alert.alert(t('error'), t('biometricUnavailable') || available.reason);
                return;
            }

            // Authenticate to enable
            const result = await authenticateWithBiometrics();
            if (result.success) {
                await enableBiometric();
                await updateSetting('privacy', 'biometric', true);
            } else {
                Alert.alert(t('error'), t('biometricFailed'));
            }
        } else {
            // Disable biometric
            await disableBiometric();
            await updateSetting('privacy', 'biometric', false);
        }
    };

    const handlePinSubmit = async () => {
        if (pinInput.length !== 4) {
            setPinError('Please enter 4 digits');
            return;
        }

        if (pinStep === 'create') {
            // Move to confirmation
            setFirstPin(pinInput);
            setPinInput('');
            setPinStep('confirm');
            setPinError('');
        } else if (pinStep === 'confirm') {
            // Verify match and save
            if (pinInput === firstPin) {
                const result = await setPasscode(pinInput);
                if (result.success) {
                    await updateSetting('privacy', 'passcode', true);
                    setShowPinModal(false);
                    Alert.alert(t('success'), t('passcodeCreated'));
                } else {
                    setPinError('Error saving passcode');
                }
            } else {
                setPinError(t('passcodesDontMatch'));
                setPinInput('');
            }
        } else if (pinStep === 'verify') {
            // Verify to disable
            const isValid = await verifyPasscode(pinInput);
            if (isValid) {
                await removePasscode();
                await updateSetting('privacy', 'passcode', false);
                setShowPinModal(false);
            } else {
                setPinError(t('incorrectPasscode'));
                setPinInput('');
            }
        }
    };

    const closePinModal = () => {
        setShowPinModal(false);
        setPinInput('');
        setFirstPin('');
        setPinError('');
        // If user was trying to enable but cancelled, ensure toggle is off
        if (pinStep === 'create' || pinStep === 'confirm') {
            setSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, passcode: false }
            }));
        }
    };


    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
        >
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {onGoBack && (
                        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                            <Icon name="arrow-left" size={24} color="#0f172a" />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.title}>{t('settings')}</Text>
                        <Text style={styles.subtitle}>{t('managePreferences')}</Text>
                    </View>
                </View>
            </View>

            {/* Profile Section */}
            <Card style={styles.card} elevation={2}>
                <Card.Content>
                    <View style={styles.profileSection}>
                        <View style={styles.avatar}>
                            <Icon name="account" size={40} color="#10b981" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{displayUserName}</Text>
                            <Text style={styles.profileDetail}>{t('manageProfile')}</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Notifications */}
            <Card style={styles.card} elevation={2}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>{t('notifications')}</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="bell-outline" size={24} color="#64748b" style={styles.settingIcon} />
                            <Text style={styles.settingLabel}>{t('enableNotifications')}</Text>
                        </View>
                        <Switch
                            value={settings.notifications.enabled}
                            onValueChange={(value) => updateSetting('notifications', 'enabled', value)}
                            color="#10b981"
                        />
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="volume-high" size={24} color="#64748b" style={styles.settingIcon} />
                            <Text style={styles.settingLabel}>{t('sound')}</Text>
                        </View>
                        <Switch
                            value={settings.notifications.sound}
                            onValueChange={(value) => updateSetting('notifications', 'sound', value)}
                            color="#10b981"
                            disabled={!settings.notifications.enabled}
                        />
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="vibrate" size={24} color="#64748b" style={styles.settingIcon} />
                            <Text style={styles.settingLabel}>{t('vibration')}</Text>
                        </View>
                        <Switch
                            value={settings.notifications.vibration}
                            onValueChange={(value) => updateSetting('notifications', 'vibration', value)}
                            color="#10b981"
                            disabled={!settings.notifications.enabled}
                        />
                    </View>
                </Card.Content>
            </Card>

            {/* Display */}
            <Card style={styles.card} elevation={2}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>{t('display')}</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="theme-light-dark" size={24} color="#64748b" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingLabel}>{t('theme')}</Text>
                                <Text style={styles.settingSubtext}>{t('current')}: {settings.display.theme}</Text>
                            </View>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="format-size" size={24} color="#64748b" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingLabel}>{t('fontSize')}</Text>
                                <Text style={styles.settingSubtext}>{t('current')}: {settings.display.fontSize}</Text>
                            </View>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Language */}
            <Card style={styles.card} elevation={2}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>{t('language')}</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="translate" size={24} color="#64748b" style={styles.settingIcon} />
                            <Text style={styles.settingLabel}>English</Text>
                        </View>
                        <Switch
                            value={settings.language === 'en'}
                            onValueChange={() => updateSetting('language', 'en', 'en')}
                            color="#10b981"
                        />
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="translate" size={24} color="#64748b" style={styles.settingIcon} />
                            <Text style={styles.settingLabel}>हिंदी (Hindi)</Text>
                        </View>
                        <Switch
                            value={settings.language === 'hi'}
                            onValueChange={() => updateSetting('language', 'hi', 'hi')}
                            color="#10b981"
                        />
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="translate" size={24} color="#64748b" style={styles.settingIcon} />
                            <Text style={styles.settingLabel}>తెలుగు (Telugu)</Text>
                        </View>
                        <Switch
                            value={settings.language === 'te'}
                            onValueChange={() => updateSetting('language', 'te', 'te')}
                            color="#10b981"
                        />
                    </View>
                </Card.Content>
            </Card>

            {/* Privacy */}
            <Card style={styles.card} elevation={2}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>{t('privacySecurity')}</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="lock-outline" size={24} color="#64748b" style={styles.settingIcon} />
                            <Text style={styles.settingLabel}>{t('passcodeLock')}</Text>
                        </View>
                        <Switch
                            value={settings.privacy.passcode}
                            onValueChange={handlePasscodeToggle}
                            color="#10b981"
                        />
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Icon name="fingerprint" size={24} color="#64748b" style={styles.settingIcon} />
                            <Text style={styles.settingLabel}>{t('biometricAuth')}</Text>
                        </View>
                        <Switch
                            value={settings.privacy.biometric}
                            onValueChange={handleBiometricToggle}
                            color="#10b981"
                        />
                    </View>
                </Card.Content>
            </Card>

            {/* About */}
            <Card style={styles.card} elevation={2}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>{t('about')}</Text>

                    <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>{t('version')}</Text>
                        <Text style={styles.aboutValue}>1.0.0</Text>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.aboutRow}>
                        <Text style={styles.aboutLabel}>{t('build')}</Text>
                        <Text style={styles.aboutValue}>2024.02.04</Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Data Management */}
            <Card style={styles.card} elevation={2}>
                <Card.Content>
                    <Text style={styles.sectionTitle}>{t('dataManagement')}</Text>
                    <Text style={styles.aboutLabel}>{t('dataManagementDesc')}</Text>

                    <Button
                        mode="outlined"
                        onPress={handleClearAllData}
                        style={styles.clearDataButton}
                        icon="delete-sweep"
                        buttonColor="transparent"
                        textColor="#ef4444"
                    >
                        {t('clearAllDataBtn')}
                    </Button>
                </Card.Content>
            </Card>

            {/* Logout Button */}
            <Button
                mode="contained"
                onPress={handleLogout}
                style={styles.logoutButton}
                icon="logout"
                buttonColor="#ef4444"
            >
                {t('logoutBtn')}
            </Button>

            <View style={{ height: 40 }} />

            {/* PIN Modal */}
            <Portal>
                <Modal
                    visible={showPinModal}
                    onDismiss={closePinModal}
                    contentContainerStyle={styles.pinModal}
                >
                    <View style={styles.pinModalContent}>
                        <Icon name="lock" size={40} color="#10b981" style={{ marginBottom: 16 }} />
                        <Text style={styles.pinModalTitle}>
                            {pinStep === 'create' ? t('createPasscode') :
                                pinStep === 'confirm' ? t('confirmPasscode') :
                                    t('enterCurrentPasscode')}
                        </Text>



                        <TextInput
                            mode="outlined"
                            value={pinInput}
                            onChangeText={setPinInput}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry={!isPinVisible}
                            right={<TextInput.Icon icon={isPinVisible ? "eye-off" : "eye"} onPress={() => setIsPinVisible(!isPinVisible)} />}
                            style={styles.pinInput}
                            placeholder="••••"
                            error={!!pinError}
                            autoFocus
                        />

                        {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

                        <View style={styles.pinModalActions}>
                            <Button
                                mode="outlined"
                                onPress={closePinModal}
                                style={styles.pinButton}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handlePinSubmit}
                                style={styles.pinButton}
                                buttonColor="#10b981"
                            >
                                {pinStep === 'confirm' ? t('save') : t('ok')}
                            </Button>
                        </View>
                    </View>
                </Modal>
            </Portal>
        </ScrollView>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        ...(Platform.OS === 'web' && {
            height: '100%',
            maxHeight: '100vh',
            overflow: 'hidden',
        }),
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 80, // Increased padding to ensure bottom content is visible
    },
    header: {
        padding: 24,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    card: {
        marginHorizontal: 24,
        marginBottom: 16,
        borderRadius: 12,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    profileDetail: {
        fontSize: 14,
        color: '#64748b',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 16,
        color: '#0f172a',
    },
    settingSubtext: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    divider: {
        marginVertical: 8,
    },
    aboutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    aboutLabel: {
        fontSize: 16,
        color: '#64748b',
    },
    aboutValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0f172a',
    },
    logoutButton: {
        marginHorizontal: 24,
        marginTop: 8,
        borderRadius: 8,
    },
    clearDataButton: {
        marginTop: 12,
        borderColor: '#ef4444',
        borderWidth: 1.5,
    },
    pinModal: {
        backgroundColor: 'white',
        padding: 24,
        marginHorizontal: 24,
        borderRadius: 16,
        ...(Platform.OS === 'web' && {
            maxWidth: 400,
            alignSelf: 'center',
        }),
    },
    pinModalContent: {
        alignItems: 'center',
    },
    pinModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 24,
        textAlign: 'center',
    },
    pinInput: {
        width: '100%',
        marginBottom: 8,
        fontSize: 24,
        letterSpacing: 8,
        textAlign: 'center',
    },
    pinError: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    pinModalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        width: '100%',
    },
    pinButton: {
        flex: 1,
    },
});

export default SettingsScreen;
