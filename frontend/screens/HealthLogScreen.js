import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Text, FAB, Card, SegmentedButtons, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { getHealthLog, addHealthEntry, deleteHealthEntry } from '../services/StorageService';
import { useLanguage } from '../services/LanguageContext';

const HealthLogScreen = ({ onGoBack }) => {
    const { language, t } = useLanguage();
    const [entries, setEntries] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState('bloodPressure');
    const [showAddForm, setShowAddForm] = useState(false);
    const [value, setValue] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Metrics based on language
    const getMetrics = () => [
        { value: 'bloodPressure', label: t('metrics.bloodPressure'), icon: 'heart-pulse', unit: t('units.mmHg'), color: '#ef4444' },
        { value: 'weight', label: t('metrics.weight'), icon: 'weight', unit: t('units.kg'), color: '#3b82f6' },
        { value: 'bloodSugar', label: t('metrics.bloodSugar'), icon: 'water', unit: t('units.mgdL'), color: '#f59e0b' },
        { value: 'temperature', label: t('metrics.temperature'), icon: 'thermometer', unit: t('units.F'), color: '#ec4899' },
    ];

    const METRICS = getMetrics();

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        const log = await getHealthLog();
        setEntries(log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    };

    const handleAddEntry = async () => {
        if (!value.trim()) {
            Alert.alert(t('error') || 'Error', t('enterValue'));
            return;
        }

        setIsSubmitting(true);
        const metric = METRICS.find(m => m.value === selectedMetric);

        const entry = {
            metric: metric.label,
            metricType: selectedMetric,
            value: value.trim(),
            unit: metric.unit,
            notes: notes.trim(),
            color: metric.color,
        };

        const result = await addHealthEntry(entry);
        setIsSubmitting(false);

        if (result) {
            Alert.alert(t('success') || 'Success', t('entryAddedSuccess'));
            setValue('');
            setNotes('');
            setShowAddForm(false);
            loadEntries();
        } else {
            Alert.alert(t('error') || 'Error', t('failedToAddEntry'));
        }
    };

    const handleDelete = async (id) => {
        await deleteHealthEntry(id);
        loadEntries();
    };

    const currentMetric = METRICS.find(m => m.value === selectedMetric);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {onGoBack && (
                        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                            <Icon name="arrow-left" size={24} color="#0f172a" />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.title}>{t('healthLog')}</Text>
                        <Text style={styles.subtitle}>{t('trackYourHealth')}</Text>
                    </View>
                </View>
            </View>

            {showAddForm ? (
                <Card style={styles.addCard} elevation={3}>
                    <Card.Content>
                        <Text style={styles.formTitle}>{t('addEntry')}</Text>

                        <Text style={styles.label}>{t('metricType')}</Text>
                        <SegmentedButtons
                            value={selectedMetric}
                            onValueChange={setSelectedMetric}
                            buttons={METRICS.map(m => ({ value: m.value, label: m.label }))}
                            style={styles.segmented}
                        />

                        <TextInput
                            label={`${currentMetric.label} (${currentMetric.unit})`}
                            value={value}
                            onChangeText={setValue}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder={t('enterValue')}
                        />

                        <TextInput
                            label={t('notes')}
                            value={notes}
                            onChangeText={setNotes}
                            mode="outlined"
                            style={styles.input}
                            multiline
                            numberOfLines={2}
                        />

                        <View style={styles.formActions}>
                            <Button mode="outlined" onPress={() => setShowAddForm(false)} style={styles.formButton}>
                                {t('cancel')}
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleAddEntry}
                                style={[styles.formButton, styles.submitButton]}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {t('save')}
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            ) : null}

            <ScrollView style={styles.timeline} contentContainerStyle={styles.scrollContent}>
                {entries.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="chart-line" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>{t('noEntries')}</Text>
                        <Text style={styles.emptySubtext}>{t('tapToAddEntry')}</Text>
                    </View>
                ) : (
                    entries.map((entry) => {
                        // Translate metric name for display
                        let displayMetric;
                        if (entry.metricType) {
                            displayMetric = t(`metrics.${entry.metricType}`);
                        } else {
                            // Fallback for old entries without metricType - map English to translation key
                            const metricMap = {
                                'Blood Pressure': 'bloodPressure',
                                'Weight': 'weight',
                                'Blood Sugar': 'bloodSugar',
                                'Temperature': 'temperature'
                            };
                            const metricKey = metricMap[entry.metric];
                            displayMetric = metricKey ? t(`metrics.${metricKey}`) : entry.metric;
                        }

                        // Translate units
                        let displayUnit;
                        if (entry.unit === 'mmHg') {
                            displayUnit = t('units.mmHg');
                        } else if (entry.unit === 'kg') {
                            displayUnit = t('units.kg');
                        } else if (entry.unit === 'mg/dL') {
                            displayUnit = t('units.mgdL');
                        } else if (entry.unit === '°F') {
                            displayUnit = t('units.F');
                        } else {
                            displayUnit = entry.unit;
                        }

                        return (
                            <Card key={entry.id} style={styles.entryCard} elevation={2}>
                                <Card.Content>
                                    <View style={styles.entryHeader}>
                                        <View style={[styles.metricIcon, { backgroundColor: entry.color + '20' }]}>
                                            <Icon
                                                name={METRICS.find(m => m.value === entry.metricType)?.icon || 'heart-pulse'}
                                                size={24}
                                                color={entry.color}
                                            />
                                        </View>
                                        <View style={styles.entryInfo}>
                                            <Text style={styles.metricName}>{displayMetric}</Text>
                                            <Text style={styles.entryDate}>
                                                {new Date(entry.timestamp).toLocaleDateString(language)} {' '}
                                                {new Date(entry.timestamp).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDelete(entry.id)} style={styles.deleteButton}>
                                            <Icon name="delete-outline" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.valueContainer}>
                                        <Text style={styles.value}>{entry.value}</Text>
                                        <Text style={styles.unit}> {displayUnit}</Text>
                                    </View>
                                    {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}
                                </Card.Content>
                            </Card>
                        );
                    })
                )}

                {/* Button at the end of page content */}
                <View style={styles.fabContainer}>
                    <FAB
                        icon={showAddForm ? "close" : "plus"}
                        style={styles.fabInline}
                        onPress={() => setShowAddForm(!showAddForm)}
                        label={Platform.OS === 'web' && !showAddForm ? t('addEntry') : undefined}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
    addCard: {
        marginHorizontal: 24,
        marginBottom: 16,
        borderRadius: 12,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    segmented: {
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    formButton: {
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#10b981',
    },
    timeline: {
        flex: 1,
        paddingHorizontal: 24,
    },
    entryCard: {
        marginBottom: 16,
        borderRadius: 12,
    },
    entryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    metricIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    entryInfo: {
        flex: 1,
    },
    metricName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    entryDate: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    value: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    unit: {
        fontSize: 16,
        color: '#64748b',
    },
    notes: {
        fontSize: 14,
        color: '#475569',
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        backgroundColor: '#10b981',
    },
    fabCentered: {
        bottom: 200,
        left: 0,
        right: 0,
        marginHorizontal: 'auto',
        alignSelf: 'center',
    },
    fabBottomRight: {
        bottom: 0,
        alignSelf: 'center',
        margin: 0,
        marginBottom: 10,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    fabContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    fabInline: {
        backgroundColor: '#10b981',
    },
});

export default HealthLogScreen;
