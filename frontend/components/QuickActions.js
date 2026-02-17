import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useLanguage } from '../services/LanguageContext';

const ActionButton = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
            <Icon name={icon} size={28} color={color} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const QuickActions = ({ onNavigate }) => {
    const { t } = useLanguage();

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <Icon name="lightning-bolt" size={24} color="#0f172a" />
                    <Text style={styles.headerTitle}>{t('quickActions')}</Text>
                </View>

                <View style={styles.actionsGrid}>
                    <ActionButton
                        icon="pill-multiple"
                        label={t('addMedication')}
                        color="#10b981"
                        onPress={() => onNavigate('Medications')}
                    />
                    <ActionButton
                        icon="magnify"
                        label={t('searchDrugs')}
                        color="#3b82f6"
                        onPress={() => onNavigate('Drug Search')}
                    />
                    <ActionButton
                        icon="heart-pulse"
                        label={t('healthLog')}
                        color="#ec4899"
                        onPress={() => onNavigate('Health Log')}
                    />
                    <ActionButton
                        icon="account-group"
                        label={t('careNetwork')}
                        color="#8b5cf6"
                        onPress={() => onNavigate('Care Network')}
                    />
                    <ActionButton
                        icon="video"
                        label="Video Consult"
                        color="#f59e0b"
                        onPress={() => onNavigate('Video Consultation')}
                    />
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
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    actionButton: {
        alignItems: 'center',
        minWidth: 100,
        flex: 1,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#475569',
        textAlign: 'center',
    },
});

export default QuickActions;
