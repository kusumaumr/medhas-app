import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useLanguage } from '../services/LanguageContext';

const StatCard = ({ icon, iconColor, title, value, bgColor }) => (
    <Card style={[styles.statCard, { backgroundColor: bgColor || '#fff' }]}>
        <Card.Content style={styles.statContent}>
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                <Icon name={icon} size={28} color={iconColor} />
            </View>
            <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </Card.Content>
    </Card>
);

const StatisticsCards = ({ totalMeds, adherenceRate, dosesToday, activeWarnings }) => {
    const { t } = useLanguage();

    return (
        <View style={styles.container}>
            <StatCard
                icon="pill"
                iconColor="#10b981"
                title={t('activeMedications')}
                value={totalMeds || 0}
                bgColor="#fff"
            />
            <StatCard
                icon="chart-line"
                iconColor="#3b82f6"
                title={t('adherenceRate')}
                value={`${adherenceRate || 0}%`}
                bgColor="#fff"
            />
            <StatCard
                icon="clock-outline"
                iconColor="#f59e0b"
                title={t('dosesTaken')}
                value={dosesToday || 0}
                bgColor="#fff"
            />
            <StatCard
                icon="alert-circle"
                iconColor={activeWarnings > 0 ? '#ef4444' : '#94a3b8'}
                title={t('activeWarnings')}
                value={activeWarnings || 0}
                bgColor="#fff"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    statCard: {
        flex: 1,
        minWidth: 150,
        elevation: 2,
        borderRadius: 12,
    },
    statContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statTextContainer: {
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    statTitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
});

export default StatisticsCards;
