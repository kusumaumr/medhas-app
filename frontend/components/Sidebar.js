import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useLanguage } from '../services/LanguageContext';

const Sidebar = ({ activeItem = 'Dashboard', onNavigate, userEmail, isOpen = true, onToggle }) => {
    const { t } = useLanguage();

    // If sidebar is closed, render only a minimal toggle button
    if (!isOpen) {
        return null; // Sidebar completely hidden when closed
    }

    const menuItems = [
        { name: 'Dashboard', label: t('dashboard'), icon: 'view-dashboard-outline', activeIcon: 'view-dashboard' },
        { name: 'Medications', label: t('myMedications'), icon: 'pill', activeIcon: 'pill' },
        { name: 'Drug Search', label: t('drugSearch'), icon: 'magnify', activeIcon: 'magnify' },
        { name: 'Health Log', label: t('healthLog'), icon: 'file-document-outline', activeIcon: 'file-document' },
        { name: 'Care Network', label: t('careNetwork'), icon: 'account-group-outline', activeIcon: 'account-group' },
        { name: 'Settings', label: t('settings'), icon: 'cog-outline', activeIcon: 'cog' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.logoContent}>
                    <View style={styles.logoIcon}>
                        <Icon name="heart-pulse" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.logoText}>Intelligent Medication Adherence Health Safety System</Text>
                        <Text style={styles.logoSubtext}>{t('mediSafeTagline')}</Text>
                    </View>
                </View>
                {/* Toggle Button Inside Sidebar */}
                <TouchableOpacity onPress={onToggle} style={styles.closeButton}>
                    <Icon name="menu-open" size={24} color="#64748b" />
                </TouchableOpacity>
            </View>

            <View style={styles.menuContainer}>
                {menuItems.map((item) => {
                    const isActive = activeItem === item.name;
                    return (
                        <TouchableOpacity
                            key={item.name}
                            style={[styles.menuItem, isActive && styles.activeMenuItem]}
                            onPress={() => {
                                console.log('🖱️ [SIDEBAR BUTTON] Clicked:', item.name);
                                onNavigate && onNavigate(item.name);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Navigate to ${item.name}`}
                        >
                            <Icon
                                name={isActive ? item.activeIcon : item.icon}
                                size={22}
                                color={isActive ? '#10b981' : '#64748b'}
                                style={styles.icon}
                            />
                            <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                                {item.label}
                            </Text>
                            {isActive && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.accountButton}
                    onPress={() => {
                        console.log('👤 My Account button clicked');
                        onNavigate && onNavigate('My Account');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="My Account"
                >
                    <Icon name="account-circle-outline" size={20} color="#10b981" />
                    <View style={styles.accountInfo}>
                        <Text style={styles.accountText}>{t('myAccount')}</Text>
                        {userEmail ? <Text style={styles.emailText}>{userEmail}</Text> : null}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => {
                        console.log('🚪 Logout button clicked');
                        if (typeof window !== 'undefined') {
                            window.location.href = window.location.origin + '?clear=true';
                        }
                    }}
                >
                    <Icon name="logout" size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>{t('logout')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 320,
        backgroundColor: '#ffffff',
        height: '100%',
        paddingVertical: 24,
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align start for wrapping text
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    logoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Allow text to take space
    },
    logoText: {
        fontSize: 15, // Slightly reduced
        fontWeight: 'bold',
        color: '#0f172a',
        flexWrap: 'wrap',
    },
    logoSubtext: {
        fontSize: 12,
        color: '#64748b',
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 4,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            userSelect: 'none',
        }),
    },
    activeMenuItem: {
        backgroundColor: '#ecfdf5',
    },
    icon: {
        marginRight: 12,
    },
    menuText: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    activeMenuText: {
        color: '#10b981',
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        backgroundColor: '#10b981',
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    accountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#a7f3d0',
        marginBottom: 12,
    },
    accountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
        marginLeft: 8,
    },
    accountInfo: {
        marginLeft: 8,
    },
    emailText: {
        fontSize: 10,
        color: '#64748b',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
        marginLeft: 8,
    }
});

export default Sidebar;
