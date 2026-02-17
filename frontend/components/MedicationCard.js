import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const MedicationCard = ({ medication, onMarkTaken, onEdit, onDelete }) => {
    // Handle both nested schedule.times and flat times for backward compatibility
    const times = medication.schedule?.times || medication.times || [];
    const { name, dosage, frequency, color = '#10b981', isActive, notes, inventory } = medication;

    const frequencyLabels = {
        once: 'Once daily',
        twice: 'Twice daily',
        thrice: 'Three times daily',
        four_times: 'Four times daily',
        as_needed: 'As needed',
        custom: 'Custom schedule', // Added custom handling
    };

    const formatTime = (time) => {
        if (!time) return '';
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const wasTakenToday = () => {
        if (!medication.history || medication.history.length === 0) return false;
        const today = new Date().toDateString();
        return medication.history.some(h => {
            const takenDate = new Date(h.takenAt).toDateString();
            return takenDate === today;
        });
    };

    return (
        <Card style={[styles.card, !isActive && styles.cardInactive]} elevation={2}>
            <View style={styles.cardContent}>
                {/* Header: Icon & Name */}
                <View style={styles.header}>
                    <View style={styles.leftContent}>
                        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                            <Icon name="pill" size={24} color={color} />
                        </View>
                        <View>
                            <Text style={styles.name}>{name}</Text>
                            <Text style={styles.dosage}>{dosage}</Text>
                        </View>
                    </View>

                    {/* Status Badge (Taken/Action) */}
                    <View style={styles.statusContainer}>
                        {!wasTakenToday() && isActive && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={onMarkTaken}
                                accessibilityLabel="Mark as taken"
                            >
                                <Icon name="check-circle-outline" size={28} color="#10b981" />
                            </TouchableOpacity>
                        )}
                        {wasTakenToday() && (
                            <View style={styles.takenBadge}>
                                <Icon name="check" size={14} color="#10b981" />
                                <Text style={styles.takenText}>Taken</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Details Section */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Frequency</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{frequencyLabels[frequency] || frequency || 'As needed'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Schedule</Text>
                        <View style={styles.scheduleContainer}>
                            {times && times.length > 0 ? (
                                times.sort((a, b) => a - b).map((time, index) => (
                                    <View key={index} style={styles.timeBadge}>
                                        <Text style={styles.timeText}>{formatTime(time)}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noScheduleText}>No schedule</Text>
                            )}
                        </View>
                    </View>

                    {notes && (
                        <View style={styles.notesContainer}>
                            <Text style={styles.notesText}>{notes}</Text>
                        </View>
                    )}

                    {/* Inventory / stock Level */}
                    {inventory && inventory.enabled && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Stock</Text>
                            <View style={[
                                styles.badge,
                                inventory.currentQuantity <= inventory.lowStockThreshold ? styles.lowStockBadge : null
                            ]}>
                                <Text style={[
                                    styles.badgeText,
                                    inventory.currentQuantity <= inventory.lowStockThreshold ? styles.lowStockText : null
                                ]}>
                                    {inventory.currentQuantity} remaining
                                    {inventory.currentQuantity <= inventory.lowStockThreshold && ' (Low)'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={styles.bottomButton}
                    onPress={onEdit}
                >
                    <Icon name="pencil-outline" size={18} color="#64748b" />
                    <Text style={styles.bottomButtonText}>Edit</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.bottomButton}
                    onPress={onDelete}
                >
                    <Icon name="delete-outline" size={18} color="#ef4444" />
                    <Text style={[styles.bottomButtonText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardInactive: {
        opacity: 0.6,
    },
    cardContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 2,
    },
    dosage: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    statusContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    actionButton: {
        padding: 4,
    },
    takenBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1fae5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    takenText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
        marginLeft: 4,
    },
    detailsContainer: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Changed to flex-start for multiline schedules
    },
    detailLabel: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4, // Align with first badge
    },
    badge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    scheduleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        flex: 1,
        gap: 6,
        marginLeft: 16,
    },
    timeBadge: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    timeText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    noScheduleText: {
        fontSize: 13,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    notesContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    notesText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    bottomActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#f8fafc',
    },
    bottomButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    bottomButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginLeft: 6,
    },
    divider: {
        width: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 8,
    },
    lowStockBadge: {
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fdba74',
    },
    lowStockText: {
        color: '#c2410c',
        fontWeight: '700',
    },
});

export default MedicationCard;
