import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const MedicationItem = ({ name, dosage, times, color, notes, frequency }) => {
    // Helper to format minutes into 12h time
    const formatTime = (minutesVal) => {
        if (typeof minutesVal !== 'number') return ''; // Safety check
        const h = Math.floor(minutesVal / 60);
        const m = minutesVal % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const displayM = m.toString().padStart(2, '0');
        return `${displayH}:${displayM} ${period}`;
    };

    return (
        <View style={styles.card}>
            <View style={[styles.colorStrip, { backgroundColor: color }]} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.dosage}>{dosage}</Text>
                    </View>
                    {/* Placeholder for future warnings integration 
                    {warnings && (
                        <View style={styles.warningBadge}>
                            <Icon name="alert-circle-outline" size={14} color="#d97706" />
                            <Text style={styles.warningText}>{warnings} warnings</Text>
                        </View>
                    )} 
                    */}
                </View>

                <View style={styles.footer}>
                    {/* Render all scheduled times */}
                    {times && times.map((timeMinutes, index) => (
                        <View key={index} style={[styles.timeBadge, { backgroundColor: color + '15' }]}>
                            <Icon name="clock-outline" size={16} color={color} style={{ marginRight: 4 }} />
                            <Text style={[styles.timeText, { color: color }]}>{formatTime(timeMinutes)}</Text>
                        </View>
                    ))}

                    {/* Show frequency if no specific times or as additional info */}
                    {!times?.length && frequency && (
                        <View style={[styles.timeBadge, { backgroundColor: color + '15' }]}>
                            <Icon name="repeat" size={16} color={color} style={{ marginRight: 4 }} />
                            <Text style={[styles.timeText, { color: color }]}>{frequency}</Text>
                        </View>
                    )}

                    {notes ? (
                        <Text style={styles.instructionText} numberOfLines={1}>{notes}</Text>
                    ) : null}
                </View>
            </View>
        </View>
    );
};

import { getMedications } from '../services/StorageService';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';

const MedicationList = () => {
    const { t } = useLanguage();
    const [medications, setMedications] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadMedications();
        }, [])
    );

    const loadMedications = async () => {
        try {
            // Updated to use StorageService instead of API for consistency
            const data = await getMedications();
            // Filter only active medications
            const activeMeds = data.filter(m => m.isActive !== false);
            setMedications(activeMeds || []);
        } catch (error) {
            console.error('Failed to load medications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Text>{t('loadingMedications') || 'Loading medications...'}</Text>
            </View>
        );
    }

    if (medications.length === 0) {
        return (
            <View style={[styles.container, { padding: 20, alignItems: 'center' }]}>
                <Text style={{ color: '#64748b', textAlign: 'center' }}>
                    {t('noMedicationsScheduled') || 'No medications scheduled for today.'}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.list}>
                {medications.map(med => (
                    <MedicationItem
                        key={med.id}
                        name={med.name}
                        dosage={med.dosage}
                        // 'times' is array of minutes from StorageService
                        times={med.times}
                        frequency={med.frequency}
                        color={med.color || '#4a90e2'}
                        notes={med.notes}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 16,
    },
    list: {
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
        flexDirection: 'row',
    },
    colorStrip: {
        width: 6,
        height: '100%',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    dosage: {
        fontSize: 14,
        color: '#64748b',
    },
    warningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffedd5',
        height: 28,
    },
    warningText: {
        fontSize: 12,
        color: '#d97706',
        marginLeft: 4,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap', // Allow times to wrap if many
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    instructionText: {
        fontStyle: 'italic',
        color: '#64748b',
        fontSize: 13,
        marginLeft: 8,
        flex: 1, // Allow notes to take remaining space
    }
});

export default MedicationList;
