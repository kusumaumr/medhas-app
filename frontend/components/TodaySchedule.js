import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useLanguage } from '../services/LanguageContext';

import { translateText } from '../services/TranslationService';

const TodaySchedule = ({ medications, onMarkTaken }) => {
    const { t, language } = useLanguage();
    const [takenDoses, setTakenDoses] = useState({});
    const [translatedItems, setTranslatedItems] = useState({});

    // Use effect to translate names/dosages when meds or language change
    useEffect(() => {
        const translateContent = async () => {
            if (language === 'en') {
                setTranslatedItems({});
                return;
            }

            const newTranslated = {};
            for (const med of medications) {
                const medId = med._id || med.id;
                if (!newTranslated[medId]) {
                    try {
                        const name = await translateText(med.name, language);
                        const dosage = await translateText(med.dosage, language);
                        newTranslated[medId] = { name, dosage };
                    } catch (e) {
                        console.warn('Translation error:', e);
                        newTranslated[medId] = { name: med.name, dosage: med.dosage };
                    }
                }
            }
            setTranslatedItems(newTranslated);
        };

        translateContent();
    }, [medications, language]);

    // Format time from minutes since midnight
    const formatTime = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const displayM = m.toString().padStart(2, '0');
        return `${displayH}:${displayM} ${period}`;
    };

    // Get current time in minutes
    const getCurrentMinutes = () => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    };

    // Build schedule items from medications
    const buildSchedule = () => {
        const currentMinutes = getCurrentMinutes();
        const scheduleItems = [];

        medications.forEach(med => {
            const medId = med._id || med.id;
            const times = med.schedule?.times || med.times;
            if (times && times.length > 0) {
                times.forEach((timeMinutes, index) => {
                    const itemId = `${medId}-${timeMinutes}`;
                    const isOverdue = timeMinutes < currentMinutes && !takenDoses[itemId];
                    const isDue = Math.abs(timeMinutes - currentMinutes) < 30 && !takenDoses[itemId];

                    // Use translated values if available
                    const displayName = translatedItems[medId]?.name || med.name;
                    const displayDosage = translatedItems[medId]?.dosage || med.dosage;

                    scheduleItems.push({
                        id: itemId,
                        medId: medId,
                        name: displayName,
                        dosage: displayDosage,
                        time: timeMinutes,
                        timeDisplay: formatTime(timeMinutes),
                        color: med.color || '#10b981',
                        isOverdue,
                        isDue,
                        isTaken: takenDoses[itemId] || false,
                    });
                });
            }
        });

        // Sort by time
        return scheduleItems.sort((a, b) => a.time - b.time);
    };

    const handleToggle = (itemId, medId) => {
        // Update local state immediately for UI responsiveness
        const newTakenDoses = { ...takenDoses, [itemId]: !takenDoses[itemId] };
        setTakenDoses(newTakenDoses);

        // Propagate to parent to update stats
        if (onMarkTaken) {
            onMarkTaken(medId, !takenDoses[itemId], new Date());
        }
    };

    const schedule = buildSchedule();

    if (schedule.length === 0) {
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.emptyState}>
                        <Icon name="calendar-check" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>{t('noMedicationsScheduled')}</Text>
                    </View>
                </Card.Content>
            </Card>
        );
    }

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <Icon name="calendar-today" size={24} color="#0f172a" />
                    <Text style={styles.headerTitle}>{t('todaysSchedule')}</Text>
                </View>

                <View style={styles.scheduleList}>
                    {schedule.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.scheduleItem,
                                item.isOverdue && !item.isTaken && styles.overdueItem,
                                item.isDue && !item.isTaken && styles.dueItem,
                            ]}
                            onPress={() => handleToggle(item.id, item.medId)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.checkboxContainer}>
                                <Checkbox
                                    status={item.isTaken ? 'checked' : 'unchecked'}
                                    onPress={() => handleToggle(item.id, item.medId)}
                                    color={item.color}
                                />
                            </View>
                            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                            <View style={styles.medInfo}>
                                <Text style={[styles.medName, item.isTaken && styles.takenText]}>
                                    {item.name}
                                </Text>
                                <Text style={styles.medDosage}>{item.dosage}</Text>
                            </View>
                            <View style={styles.timeContainer}>
                                <Icon
                                    name="clock-outline"
                                    size={16}
                                    color={item.isOverdue ? '#ef4444' : item.isDue ? '#f59e0b' : '#64748b'}
                                />
                                <Text style={[
                                    styles.timeText,
                                    item.isOverdue && styles.overdueText,
                                    item.isDue && styles.dueText,
                                ]}>
                                    {item.timeDisplay}
                                </Text>
                                <Text style={styles.overdueLabel}>{item.isOverdue && !item.isTaken ? t('overdue') : ''}</Text>
                                <Text style={styles.dueLabel}>{item.isDue && !item.isTaken ? t('dueNow') : ''}</Text>
                            </View>
                        </TouchableOpacity>
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
    },
    scheduleList: {
        gap: 12,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    overdueItem: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },
    dueItem: {
        backgroundColor: '#fffbeb',
        borderColor: '#fde68a',
    },
    checkboxContainer: {
        marginRight: 8,
    },
    colorIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    medInfo: {
        flex: 1,
    },
    medName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 2,
    },
    takenText: {
        textDecorationLine: 'line-through',
        color: '#94a3b8',
    },
    medDosage: {
        fontSize: 13,
        color: '#64748b',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    overdueText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    dueText: {
        color: '#f59e0b',
        fontWeight: '600',
    },
    overdueLabel: {
        fontSize: 11,
        color: '#ef4444',
        fontWeight: '600',
        marginLeft: 4,
    },
    dueLabel: {
        fontSize: 11,
        color: '#f59e0b',
        fontWeight: '600',
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94a3b8',
    },
});

export default TodaySchedule;
