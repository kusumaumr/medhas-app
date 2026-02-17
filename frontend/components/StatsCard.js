import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const StatsCard = ({ title, value, subtitle, icon, color, backgroundColor, warning }) => {
    return (
        <View style={[styles.card, { backgroundColor: backgroundColor || '#fff' }]}>
            <View style={styles.content}>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.value}>{value}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <View style={styles.iconContainer}>
                    {warning && (
                        <View style={styles.warningContainer}>
                            <Icon name="alert-outline" size={20} color="#d97706" />
                        </View>
                    )}
                    <View style={[styles.iconBubble, { backgroundColor: color + '20' }]}>
                        <Icon name={icon} size={24} color={color} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 20,
        flex: 1,
        minWidth: 200,
        marginRight: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        // Shadow for web
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 8,
    },
    value: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#94a3b8',
    },
    iconContainer: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '100%',
    },
    iconBubble: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    warningContainer: {
        marginBottom: 10,
    }
});

export default StatsCard;
