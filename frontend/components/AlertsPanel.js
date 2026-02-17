import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useLanguage } from '../services/LanguageContext';
import { translateText } from '../services/TranslationService';

const AlertItem = ({ type, title, message, onDismiss }) => {
    const getAlertStyle = () => {
        switch (type) {
            case 'warning':
                return {
                    bg: '#fef2f2',
                    border: '#fecaca',
                    icon: 'alert-circle',
                    iconColor: '#ef4444',
                };
            case 'low-stock':
                return {
                    bg: '#fff7ed',
                    border: '#ffedd5',
                    icon: 'beaker-alert-outline',
                    iconColor: '#f97316',
                };
            case 'info':
                return {
                    bg: '#eff6ff',
                    border: '#bfdbfe',
                    icon: 'information',
                    iconColor: '#3b82f6',
                };
            case 'success':
                return {
                    bg: '#f0fdf4',
                    border: '#bbf7d0',
                    icon: 'check-circle',
                    iconColor: '#10b981',
                };
            default:
                return {
                    bg: '#fffbeb',
                    border: '#fde68a',
                    icon: 'alert',
                    iconColor: '#f59e0b',
                };
        }
    };

    const style = getAlertStyle();

    return (
        <View style={[styles.alertItem, { backgroundColor: style.bg, borderColor: style.border }]}>
            <View style={styles.alertContent}>
                <Icon name={style.icon} size={24} color={style.iconColor} style={styles.alertIcon} />
                <View style={styles.alertText}>
                    <Text style={styles.alertTitle}>{title}</Text>
                    <Text style={styles.alertMessage}>{message}</Text>
                </View>
            </View>
            {onDismiss && (
                <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
                    <Icon name="close" size={20} color="#64748b" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const AlertsPanel = ({ medications }) => {
    const { t, language } = useLanguage();
    const [dismissedAlerts, setDismissedAlerts] = useState([]);
    const [translatedAlerts, setTranslatedAlerts] = useState([]);

    // Find drug interactions and low stock alerts
    const findAlerts = () => {
        const alerts = [];

        // Iterate through all medications and collect their interactions
        medications.forEach(med => {
            if (med.interactions && med.interactions.length > 0) {
                med.interactions.forEach(interaction => {
                    // Create a unique ID for this specific interaction instance
                    const id = `interaction-${med._id || med.id}-${interaction.withMedication}`;

                    if (!dismissedAlerts.includes(id)) {
                        alerts.push({
                            id,
                            type: 'warning',
                            title: t('drugInteraction'),
                            // Original English message (will be translated below)
                            message: `${med.name} + ${interaction.withMedication}: ${interaction.description}`,
                            // Keep the raw description for translation
                            _rawDescription: interaction.description,
                            _medName: med.name,
                            _withMed: interaction.withMedication,
                        });
                    }
                });
            }
        });

        // Check for low stock
        medications.forEach(med => {
            if (med.inventory && med.inventory.enabled && med.inventory.currentQuantity <= med.inventory.lowStockThreshold) {
                const id = `low-stock-${med._id || med.id}`;
                if (!dismissedAlerts.includes(id)) {
                    alerts.push({
                        id,
                        type: 'low-stock',
                        title: t('lowStockWarning') || 'Low Stock Warning',
                        message: `${med.name}: ${t('onlyRemaining').replace('{{quantity}}', med.inventory.currentQuantity)}. ${t('refillIdeally') || 'Please refill soon.'}`
                    });
                }
            }
        });

        return alerts;
    };

    // Translate dynamic content when language changes or alerts change
    useEffect(() => {
        const rawAlerts = findAlerts();

        // If English, no translation needed
        if (language === 'en') {
            setTranslatedAlerts(rawAlerts);
            return;
        }

        // Translate dynamic descriptions (drug interaction messages)
        const translateAlerts = async () => {
            const translated = await Promise.all(
                rawAlerts.map(async (alert) => {
                    if (alert._rawDescription) {
                        // Translate the interaction description
                        const translatedDesc = await translateText(alert._rawDescription, language);
                        return {
                            ...alert,
                            message: `${alert._medName} + ${alert._withMed}: ${translatedDesc}`,
                        };
                    }
                    // Low stock alerts are already translated via t()
                    return alert;
                })
            );
            setTranslatedAlerts(translated);
        };

        translateAlerts();
    }, [medications, language, dismissedAlerts]);

    const handleDismiss = (alertId) => {
        setDismissedAlerts([...dismissedAlerts, alertId]);
    };

    if (translatedAlerts.length === 0) {
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.emptyState}>
                        <Icon name="shield-check" size={48} color="#10b981" />
                        <Text style={styles.emptyTitle}>{t('allClear')}</Text>
                        <Text style={styles.emptyText}>{t('noActiveWarnings')}</Text>
                    </View>
                </Card.Content>
            </Card>
        );
    }

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <Icon name="bell-alert" size={24} color="#ef4444" />
                    <Text style={styles.headerTitle}>{t('alertsAndWarnings')}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{translatedAlerts.length}</Text>
                    </View>
                </View>

                <View style={styles.alertsList}>
                    {translatedAlerts.map(alert => (
                        <AlertItem
                            key={alert.id}
                            type={alert.type}
                            title={alert.title}
                            message={alert.message}
                            onDismiss={() => handleDismiss(alert.id)}
                        />
                    ))}
                </View>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 24,
        elevation: 2,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        flex: 1,
    },
    badge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    alertsList: {
        gap: 12,
    },
    alertItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    alertContent: {
        flex: 1,
        flexDirection: 'row',
    },
    alertIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    alertText: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    alertMessage: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    dismissButton: {
        padding: 4,
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10b981',
        marginTop: 12,
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
    },
});

export default AlertsPanel;
