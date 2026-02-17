import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert, TouchableOpacity, Pressable } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, SegmentedButtons, Dialog, Paragraph, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { addMedication, updateMedication } from '../services/StorageService';
import { getDosageRecommendation, formatRecommendation } from '../utils/dosageCalculator';

import { useLanguage } from '../services/LanguageContext';
import { translateText } from '../services/TranslationService';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];

const AddMedicationModal = ({ visible, onDismiss, onMedicationAdded, prefillData }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('once');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [times, setTimes] = useState([{ hours: 9, minutes: 0 }]); // Default 9:00 AM
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [errors, setErrors] = useState({});

    // Inventory State
    const [enableInventory, setEnableInventory] = useState(false);
    const [currentQuantity, setCurrentQuantity] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('5');

    // Custom Warning Dialog State
    const [showWarningDialog, setShowWarningDialog] = useState(false);
    const [warningData, setWarningData] = useState(null);
    const [editingTimeIndex, setEditingTimeIndex] = useState(0);

    // Smart Dosage State
    const [showDosageDialog, setShowDosageDialog] = useState(false);
    const [dosageAge, setDosageAge] = useState('');
    const [dosageGender, setDosageGender] = useState('other');
    const [dosageResult, setDosageResult] = useState(null);
    const [isCheckingDosage, setIsCheckingDosage] = useState(false);

    // Update form when prefillData changes
    useEffect(() => {
        if (prefillData) {
            if (prefillData.name) setName(prefillData.name);
            if (prefillData.dosage) setDosage(prefillData.dosage);
            if (prefillData.notes) setNotes(prefillData.notes);
            if (prefillData.color) setSelectedColor(prefillData.color);

            // Handle both old flat structure and new nested schedule structure
            const timesArray = prefillData.schedule?.times || prefillData.times;
            if (timesArray && timesArray.length > 0) {
                // Convert minutes back to {hours, minutes}
                const convertedTimes = timesArray.map(minutesTotal => ({
                    hours: Math.floor(minutesTotal / 60),
                    minutes: minutesTotal % 60
                }));
                setTimes(convertedTimes);
            }

            // Prefill inventory
            if (prefillData.inventory) {
                setEnableInventory(prefillData.inventory.enabled || false);
                setCurrentQuantity(prefillData.inventory.currentQuantity?.toString() || '');
                setLowStockThreshold(prefillData.inventory.lowStockThreshold?.toString() || '5');
            }
        } else {
            resetForm();
        }
    }, [prefillData, visible]);

    const resetForm = () => {
        setName('');
        setDosage('');
        setFrequency('once');
        setSelectedColor(COLORS[0]);
        setNotes('');
        setTimes([{ hours: 9, minutes: 0 }]);
        setEnableInventory(false);
        setCurrentQuantity('');
        setLowStockThreshold('5');
        // Reset dosage check state
        setDosageResult(null);
        setDosageAge('');
        setDosageGender('other');
        setErrors({});
    };

    // Smart Dosage Functions
    const handleCheckDosage = () => {
        if (!name.trim()) {
            Alert.alert(t('error') || 'Error', t('enterMedNameFirst') || 'Please enter medication name first');
            return;
        }
        setShowDosageDialog(true);
    };

    const performDosageCheck = async () => {
        setIsCheckingDosage(true);
        try {
            // 1. Try local rules first
            let result = getDosageRecommendation(name, dosageAge, dosageGender);

            // 2. Fallback to OpenFDA if not found or errors
            if (!result.found) {
                const { searchDrugs } = require('../services/OpenJDAService');
                const results = await searchDrugs(name);

                if (results && results.length > 0) {
                    const drug = results[0];
                    result = {
                        found: true,
                        matchedMedicine: drug.name,
                        category: drug.category,
                        recommendation: {
                            dosage: drug.dosage,
                            frequency: "Consult FDA label instructions provided",
                            maxDaily: "See full prescribing info",
                            notes: drug.description
                        },
                        source: 'OpenFDA',
                        disclaimer: "⚠️ Source: OpenFDA. This information is for education only. Consult a doctor."
                    };
                }
            }

            setDosageResult(result);
        } catch (error) {
            console.error('Dosage check error:', error);
            setDosageResult({ found: false, error: 'An error occurred while checking dosage.' });
        } finally {
            setIsCheckingDosage(false);
        }
    };

    const applyRecommendation = () => {
        if (dosageResult && dosageResult.found && dosageResult.recommendation) {
            const rec = dosageResult.recommendation;
            // Apply the recommended dosage
            setDosage(rec.dosage);
            // Add frequency info to notes
            const newNote = `${rec.frequency}. Max: ${rec.maxDaily}. ${rec.notes || ''}`;
            setNotes(prev => prev ? `${prev}\n${newNote}` : newNote);
            setShowDosageDialog(false);
            setDosageResult(null);
        }
    };

    const addTimeSlot = () => {
        // Create a new time slot that doesn't immediately duplicate the previous one
        // Using the current time or a default if empty
        const now = new Date();
        const nextHour = (now.getHours() + 1) % 24;
        const newTime = { hours: nextHour, minutes: 0 };

        // Ensure we're creating a new array reference with a new object
        const updatedTimes = [...times, newTime];
        setTimes(updatedTimes);

        // Optional: Automatically open picker for the new slot
        setEditingTimeIndex(updatedTimes.length - 1);
        setShowTimePicker(true);
    };

    const removeTimeSlot = (index) => {
        const newTimes = times.filter((_, i) => i !== index);
        setTimes(newTimes);
    };

    const updateTime = (index, hours, minutes) => {
        const newTimes = [...times];
        newTimes[index] = { hours, minutes };
        setTimes(newTimes);
    };

    // ... (formatTime and others remain)



    const formatTime = (time) => {
        // Handle both minute integers (from storage) and {hours, minutes} objects
        if (typeof time === 'number') {
            const h = Math.floor(time / 60);
            const m = time % 60;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
        }

        const { hours, minutes } = time;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const timesToMinutes = () => {
        return times.map(t => t.hours * 60 + t.minutes);
    };

    const handleSubmit = async (overrideData = null) => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = t('enterMedName');
        if (!dosage.trim()) newErrors.dosage = t('enterDosage');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            // Map frequency to backend enum values
            const frequencyMap = {
                1: 'Once',
                2: 'Daily',
                default: 'Daily' // For 3+ times, use Daily with custom times
            };
            const backendFrequency = frequencyMap[times.length] || frequencyMap.default;

            const baseData = {
                name: name.trim(),
                dosage: dosage.trim(),
                schedule: {
                    frequency: backendFrequency,
                    times: timesToMinutes(), // User-selected times in minutes from midnight
                    startDate: new Date().toISOString()
                },
                color: selectedColor,
                notes: notes.trim(),
                isActive: true, // Ensure medication appears in active list
                inventory: {
                    enabled: enableInventory,
                    currentQuantity: enableInventory ? parseInt(currentQuantity) || 0 : 0,
                    lowStockThreshold: enableInventory ? parseInt(lowStockThreshold) || 5 : 5
                }
            };

            // Merge any override data (like ignoreWarnings: true)
            const medicationData = { ...baseData, ...(overrideData || {}) };

            let success = false;
            let confirmationRequired = false;
            let warningData = null;

            if (prefillData && prefillData.id) {
                // Update existing
                // Legacy: updateMedication returns data object or null
                const result = await updateMedication(prefillData.id, medicationData);
                if (result) {
                    success = true;
                }
            } else {
                // Add new
                // New: addMedication returns { success, data, confirmationRequired, warning }
                const result = await addMedication(medicationData);
                success = result.success;
                confirmationRequired = result.confirmationRequired;
                warningData = result.warning;
            }

            if (success) {
                console.log('✅ Medication saved successfully');
                resetForm();
                onMedicationAdded && onMedicationAdded();
            } else if (confirmationRequired) {
                console.log('⚠️ Interaction warning, requiring confirmation');

                try {
                    // SIMPLIFIED LOGIC: Show English details IMMEDIATELY, then translate in background
                    // This prevents the "Add" button from hanging
                    const warningDetails = warningData.details || [];
                    const englishDetails = warningDetails.map(d => {
                        const desc = d.description || '';
                        const drug = d.withMedication || '';
                        return `• ${drug}: ${desc}`;
                    }).join('\n');

                    let englishRec = '';
                    if (warningDetails.length > 0 && warningDetails[0].recommendation) {
                        englishRec = `\n\n${t('recommendationPrefix')} ${warningDetails[0].recommendation}`;
                    }

                    // 1. Show Dialog IMMEDIATELY (English details + Localized Headers)
                    const initialMessage = `${t('interactionDetectedMsg')}\n\n${englishDetails}${englishRec}\n\n${t('interactionProceedQuestion')}`;

                    setWarningData({
                        title: t('interactionDetectedTitle'),
                        message: initialMessage,
                        details: warningDetails
                    });
                    setShowWarningDialog(true);

                    // 2. Perform Translation in Background (if needed)
                    if (language !== 'en') {
                        // Fire-and-forget translation
                        (async () => {
                            try {
                                let translatedDetails = await translateText(englishDetails, language);
                                let translatedRec = '';
                                if (englishRec) {
                                    translatedRec = await translateText(englishRec, language);
                                }

                                // Custom Improvement for common medical terms
                                if (language === 'te' || language === 'hi') {
                                    translatedRec = translatedRec.replace(/Lactic Acidosis/gi, 'లాక్టిక్ అసిడోసిస్ (రక్తంలో ఆమ్ల స్థాయిలు పెరగడం)');
                                    translatedDetails = translatedDetails.replace(/Lactic Acidosis/gi, 'లాక్టిక్ అసిడోసిస్ (రక్తంలో ఆమ్ల స్థాయిలు పెరగడం)');
                                }

                                const finalMessage = `${t('interactionDetectedMsg')}\n\n${translatedDetails}${translatedRec}\n\n${t('interactionProceedQuestion')}`;

                                // Update dialog with translated text
                                setWarningData(prev => ({
                                    ...prev,
                                    message: finalMessage
                                }));
                            } catch (e) {
                                console.log('Background translation failed, staying in English');
                            }
                        })();
                    }
                } catch (alertError) {
                    console.error('Error preparing warning dialog:', alertError);
                    Alert.alert(t('error'), 'Error preparing warning dialog');
                }
            } else {
                // Handle generic failure (e.g. 401 or 500)
                console.log('❌ Medication addition failed');
                Alert.alert(t('error') || 'Error', t('failedToAddMedication') || 'Failed to add medication. Please try again.');
            }
        } catch (error) {
            console.error('Submit Error:', error);
            Alert.alert(t('error'), t('unexpectedError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        onDismiss && onDismiss();
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={handleCancel}
                contentContainerStyle={styles.modal}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>
                        {prefillData ? (t('editMedication') || 'Edit Medication') : (t('addMedication') || 'Add Medication')}
                    </Text>

                    {/* Medication Name */}
                    <TextInput
                        label={`${t('medName')} *`}
                        value={name}
                        onChangeText={(text) => { setName(text); setErrors({ ...errors, name: null }); }}
                        mode="outlined"
                        style={styles.input}
                        placeholder={t('placeholderMedName')}
                        error={!!errors.name}
                    />
                    {errors.name && <HelperText type="error" visible={true}>{errors.name}</HelperText>}

                    {/* Dosage */}
                    <TextInput
                        label={`${t('dosage')} *`}
                        value={dosage}
                        onChangeText={(text) => { setDosage(text); setErrors({ ...errors, dosage: null }); }}
                        mode="outlined"
                        style={styles.input}
                        placeholder={t('placeholderDosage')}
                        error={!!errors.dosage}
                    />
                    {errors.dosage && <HelperText type="error" visible={true}>{errors.dosage}</HelperText>}

                    {/* Smart Dosage Button */}
                    <Button
                        mode="outlined"
                        onPress={handleCheckDosage}
                        icon="lightbulb-on-outline"
                        style={styles.smartDosageButton}
                        textColor="#8b5cf6"
                        disabled={!name.trim()}
                    >
                        {t('checkRecommendedDosage') || '✨ Check Recommended Dosage'}
                    </Button>

                    {/* Medication Times */}
                    <Text style={styles.label}>{t('times')} *</Text>
                    <Text style={styles.helperText}>{t('setTimesInstruction')}</Text>
                    {times.map((time, index) => (
                        <View key={index} style={styles.timeRow}>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => {
                                    setEditingTimeIndex(index);
                                    setShowTimePicker(true);
                                }}
                            >
                                <Icon name="clock-outline" size={20} color="#10b981" />
                                <Text style={styles.timeText}>{formatTime(time)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => removeTimeSlot(index)}
                                style={styles.removeButton}
                            >
                                <Icon name="close-circle" size={24} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Web Time Picker - Custom Implementation */}
                    {Platform.OS === 'web' && showTimePicker && (
                        <View style={styles.webTimePicker}>
                            <Text style={styles.label}>{t('selectTime')}</Text>
                            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                                {/* Hours */}
                                {React.createElement('select', {
                                    value: times[editingTimeIndex].hours % 12 || 12,
                                    onChange: (e) => {
                                        const h = parseInt(e.target.value);
                                        const isPM = times[editingTimeIndex].hours >= 12;
                                        let newHour = h;
                                        if (isPM && h !== 12) newHour = h + 12;
                                        if (!isPM && h === 12) newHour = 0;
                                        updateTime(editingTimeIndex, newHour, times[editingTimeIndex].minutes);
                                    },
                                    style: styles.pickerSelect
                                }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h =>
                                    React.createElement('option', { key: h, value: h }, h)
                                ))}
                                <Text style={{ alignSelf: 'center', fontSize: 20 }}>:</Text>
                                {/* Minutes */}
                                {React.createElement('select', {
                                    value: times[editingTimeIndex].minutes,
                                    onChange: (e) => updateTime(editingTimeIndex, times[editingTimeIndex].hours, parseInt(e.target.value)),
                                    style: styles.pickerSelect
                                }, Array.from({ length: 60 }, (_, i) => i).map(m =>
                                    React.createElement('option', { key: m, value: m }, m.toString().padStart(2, '0'))
                                ))}
                                {/* AM/PM */}
                                {React.createElement('select', {
                                    value: times[editingTimeIndex].hours >= 12 ? 'PM' : 'AM',
                                    onChange: (e) => {
                                        const isPM = e.target.value === 'PM';
                                        let h = times[editingTimeIndex].hours % 12 || 12;
                                        if (isPM && h !== 12) h += 12;
                                        if (!isPM && h === 12) h = 0;
                                        updateTime(editingTimeIndex, h, times[editingTimeIndex].minutes);
                                    },
                                    style: styles.pickerSelect
                                }, [
                                    React.createElement('option', { key: 'AM', value: 'AM' }, 'AM'),
                                    React.createElement('option', { key: 'PM', value: 'PM' }, 'PM')
                                ])}
                            </View>
                            <Button
                                onPress={() => setShowTimePicker(false)}
                                mode="contained"
                                buttonColor="#10b981"
                            >
                                Done
                            </Button>
                        </View>
                    )}

                    <Button
                        mode="outlined"
                        onPress={addTimeSlot}
                        icon="plus"
                        style={styles.addTimeButton}
                        textColor="#10b981"
                    >
                        {t('addTime')}
                    </Button>

                    {/* Color Selection */}
                    <Text style={styles.label}>{t('color')}</Text>
                    <View style={styles.colorRow}>
                        {COLORS.map((color) => (
                            <Pressable
                                key={color}
                                style={({ pressed }) => [
                                    styles.colorOption,
                                    { backgroundColor: color },
                                    selectedColor === color && styles.colorSelected,
                                    pressed && { opacity: 0.7 }
                                ]}
                                onPress={() => setSelectedColor(color)}
                            >
                                {selectedColor === color && (
                                    <Text style={styles.colorCheck}>✓</Text>
                                )}
                            </Pressable>
                        ))}
                    </View>

                    {/* Notes */}
                    <TextInput
                        label={`${t('notes')} (${t('optional') || 'Optional'})`}
                        value={notes}
                        onChangeText={setNotes}
                        mode="outlined"
                        style={styles.input}
                        multiline
                        numberOfLines={3}
                        placeholder={t('placeholderNotes')}
                    />

                    {/* Inventory Section */}
                    <Text style={styles.label}>{t('smartRefillSection')}</Text>
                    <View style={styles.inventoryContainer}>
                        <TouchableOpacity
                            style={[styles.inventoryToggle, enableInventory && styles.inventoryToggleActive]}
                            onPress={() => setEnableInventory(!enableInventory)}
                        >
                            <Icon
                                name={enableInventory ? "checkbox-marked" : "checkbox-blank-outline"}
                                size={24}
                                color={enableInventory ? "#10b981" : "#64748b"}
                            />
                            <Text style={styles.inventoryToggleText}>
                                {t('enableInventoryTracking')}
                            </Text>
                        </TouchableOpacity>

                        {enableInventory && (
                            <View style={styles.inventoryInputs}>
                                <TextInput
                                    label={t('currentQuantity')}
                                    value={currentQuantity}
                                    onChangeText={setCurrentQuantity}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="e.g. 30"
                                />
                                <TextInput
                                    label={t('lowStockThreshold')}
                                    value={lowStockThreshold}
                                    onChangeText={setLowStockThreshold}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="e.g. 5"
                                />
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            onPress={handleCancel}
                            style={styles.button}
                            disabled={isSubmitting}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => handleSubmit()}
                            style={[styles.button, styles.submitButton]}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {prefillData ? (t('updateMedication') || 'Update') : (t('addMedication') || 'Add Medication')}
                        </Button>
                    </View>
                </ScrollView>
            </Modal>

            {/* Custom Warning Dialog */}
            <Dialog visible={showWarningDialog} onDismiss={() => setShowWarningDialog(false)} style={{ backgroundColor: '#fff' }}>
                <Dialog.Title style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    {warningData?.title || 'Warning'}
                </Dialog.Title>
                <Dialog.Content>
                    <Paragraph style={{ fontSize: 16, lineHeight: 24 }}>
                        {warningData?.message}
                    </Paragraph>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        onPress={() => {
                            setShowWarningDialog(false);
                            setIsSubmitting(false);
                        }}
                        textColor="#64748b"
                    >
                        {t('goBack')}
                    </Button>
                    <Button
                        onPress={() => {
                            setShowWarningDialog(false);
                            console.log('🔄 User proceeded despite warning');
                            handleSubmit({ ignoreWarnings: true });
                        }}
                        textColor="#ef4444"
                        labelStyle={{ fontWeight: 'bold' }}
                    >
                        {t('proceedAnyway')}
                    </Button>
                </Dialog.Actions>
            </Dialog>

            {/* Smart Dosage Dialog */}
            <Dialog visible={showDosageDialog} onDismiss={() => { setShowDosageDialog(false); setDosageResult(null); }} style={{ backgroundColor: '#fff' }}>
                <Dialog.Title style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                    {t('smartDosageTitle') || '💊 Smart Dosage Check'}
                </Dialog.Title>
                <Dialog.Content>
                    <Paragraph style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                        {t('smartDosageSubtitle') || `Get recommended dosage for "${name}" based on age and gender.`}
                    </Paragraph>

                    {/* Age Input */}
                    <TextInput
                        label={t('age') || 'Age (years)'}
                        value={dosageAge}
                        onChangeText={setDosageAge}
                        mode="outlined"
                        keyboardType="numeric"
                        style={{ marginBottom: 12 }}
                        placeholder="e.g. 25"
                    />

                    {/* Gender Selection */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>
                        {t('gender') || 'Gender'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        {['male', 'female', 'other'].map(g => (
                            <TouchableOpacity
                                key={g}
                                onPress={() => setDosageGender(g)}
                                style={[
                                    styles.genderOption,
                                    dosageGender === g && styles.genderOptionSelected
                                ]}
                            >
                                <Text style={[
                                    styles.genderOptionText,
                                    dosageGender === g && styles.genderOptionTextSelected
                                ]}>
                                    {t(g) || g.charAt(0).toUpperCase() + g.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Check Button */}
                    <Button
                        mode="contained"
                        onPress={performDosageCheck}
                        buttonColor="#8b5cf6"
                        loading={isCheckingDosage}
                        disabled={!dosageAge.trim() || isCheckingDosage}
                        style={{ marginBottom: 16 }}
                    >
                        {t('checkDosage') || 'Check Dosage'}
                    </Button>

                    {/* Result Display */}
                    {dosageResult && (
                        <View style={styles.dosageResultContainer}>
                            {dosageResult.found ? (
                                <>
                                    <Text style={styles.dosageResultTitle}>
                                        {t('recommendationFor') || 'Recommendation for'} {dosageResult.matchedMedicine}
                                    </Text>
                                    <Text style={styles.dosageResultCategory}>{dosageResult.category}</Text>
                                    <View style={styles.dosageResultRow}>
                                        <Icon name="pill" size={16} color="#8b5cf6" />
                                        <Text style={styles.dosageResultText}>Dosage: {dosageResult.recommendation.dosage}</Text>
                                    </View>
                                    <View style={styles.dosageResultRow}>
                                        <Icon name="clock-outline" size={16} color="#8b5cf6" />
                                        <Text style={styles.dosageResultText}>Frequency: {dosageResult.recommendation.frequency}</Text>
                                    </View>
                                    <View style={styles.dosageResultRow}>
                                        <Icon name="alert-circle-outline" size={16} color="#ef4444" />
                                        <Text style={styles.dosageResultText}>Max Daily: {dosageResult.recommendation.maxDaily}</Text>
                                    </View>
                                    {dosageResult.recommendation.notes && (
                                        <Text style={styles.dosageResultNotes}>📝 {dosageResult.recommendation.notes}</Text>
                                    )}
                                    {dosageResult.recommendation.genderNote && (
                                        <Text style={styles.dosageResultGenderNote}>⚠️ {dosageResult.recommendation.genderNote}</Text>
                                    )}
                                    <Text style={styles.dosageDisclaimer}>{dosageResult.disclaimer}</Text>
                                </>
                            ) : (
                                <Text style={styles.dosageResultError}>{dosageResult.error}</Text>
                            )}
                        </View>
                    )}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button
                        onPress={() => { setShowDosageDialog(false); setDosageResult(null); }}
                        textColor="#64748b"
                    >
                        {t('close') || 'Close'}
                    </Button>
                    {dosageResult && dosageResult.found && (
                        <Button
                            onPress={applyRecommendation}
                            textColor="#10b981"
                            labelStyle={{ fontWeight: 'bold' }}
                        >
                            {t('applyRecommendation') || '✓ Apply'}
                        </Button>
                    )}
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modal: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 16,
        maxHeight: '90%',
        ...(Platform.OS === 'web' && {
            maxWidth: 500,
            alignSelf: 'center',
        }),
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 24,
    },
    input: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        marginTop: 8,
    },
    helperText: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    segmented: {
        marginBottom: 16,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    timeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#d1fae5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#10b981',
        gap: 8,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    removeButton: {
        padding: 4,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    addTimeButton: {
        marginBottom: 16,
        borderColor: '#10b981',
        borderWidth: 2,
    },
    webTimePicker: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    colorRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: '#0f172a',
    },
    colorCheck: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#10b981',
    },
    // Smart Dosage Styles
    smartDosageButton: {
        marginBottom: 16,
        borderColor: '#8b5cf6',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    genderOption: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    genderOptionSelected: {
        borderColor: '#8b5cf6',
        backgroundColor: '#f3e8ff',
    },
    genderOptionText: {
        fontSize: 14,
        color: '#64748b',
    },
    genderOptionTextSelected: {
        color: '#8b5cf6',
        fontWeight: '600',
    },
    dosageResultContainer: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dosageResultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    dosageResultCategory: {
        fontSize: 12,
        color: '#8b5cf6',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    dosageResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    dosageResultText: {
        fontSize: 14,
        color: '#334155',
    },
    inventoryContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inventoryToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    inventoryToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    inventoryInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    dosageResultNotes: {
        fontSize: 13,
        color: '#475569',
        marginTop: 8,
        fontStyle: 'italic',
    },
    dosageResultGenderNote: {
        fontSize: 13,
        color: '#f59e0b',
        marginTop: 6,
    },
    dosageDisclaimer: {
        fontSize: 12,
        color: '#ef4444',
        fontStyle: 'italic',
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        textAlign: 'center',
    },
    dosageResultError: {
        fontSize: 14,
        color: '#ef4444',
        textAlign: 'center',
    },
});

export default AddMedicationModal;
