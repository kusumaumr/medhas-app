import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// Simple Circular Progress Component equivalent
const CircularProgress = ({ percentage = 50 }) => {
    return (
        <View style={styles.circularContainer}>
            <View style={styles.outerCircle}>
                <View style={styles.innerCircle}>
                    <Text style={styles.percentageText}>{percentage}%</Text>
                    <Text style={styles.completeText}>Complete</Text>
                </View>
            </View>
            {/* Note: A real SVG implementation would be better for the actual arc */}
            <View style={[styles.progressArc, { borderTopColor: '#10b981', borderRightColor: '#10b981' }]} />
        </View>
    );
};

const QuickActionButton = ({ icon, label, color, backgroundColor, onPress }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor }]} onPress={onPress}>
        <Icon name={icon} size={24} color={color} style={{ marginBottom: 8 }} />
        <Text style={[styles.actionText, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const ProgressSection = () => {
    return (
        <View style={styles.container}>
            {/* Progress Card */}
            <View style={styles.progressCard}>
                <Text style={styles.cardTitle}>Today's Progress</Text>
                <View style={styles.chartContainer}>
                    <CircularProgress percentage={50} />
                    <Text style={styles.remainingText}>2 doses remaining</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
                <QuickActionButton
                    icon="plus"
                    label="Add Medication"
                    color="#0f766e"
                    backgroundColor="#e0f2f1"
                />
                <QuickActionButton
                    icon="shield-check-outline"
                    label="Check Interactions"
                    color="#ea580c"
                    backgroundColor="#fff7ed"
                />
                <QuickActionButton
                    icon="phone-outline"
                    label="Contact Caregiver"
                    color="#15803d"
                    backgroundColor="#dcfce7"
                />
                <QuickActionButton
                    icon="file-document-outline"
                    label="View Health Log"
                    color="#b45309"
                    backgroundColor="#fef3c7"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 16,
        flexWrap: 'wrap',
    },
    progressCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: 300,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circularContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    outerCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressArc: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: 'transparent',
        transform: [{ rotate: '-45deg' }],
    },
    innerCircle: {
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    completeText: {
        fontSize: 12,
        color: '#64748b',
    },
    remainingText: {
        color: '#64748b',
        fontSize: 14,
    },
    actionsContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 16,
        minWidth: 300,
    },
    actionButton: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 120,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    }
});

export default ProgressSection;
