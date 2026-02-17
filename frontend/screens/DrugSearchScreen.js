import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Card, Chip, Portal, Dialog, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { getMedications } from '../services/StorageService';
import AddMedicationModal from '../components/AddMedicationModal';
import { useLanguage } from '../services/LanguageContext';

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
        for (let i = 1; i <= len1; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    return matrix[len2][len1];
};

// Mock drug database
const DRUG_DATABASE = [
    { id: '1', name: 'Aspirin', category: 'Pain Relief', dosage: '100mg', description: 'Pain reliever and fever reducer', source: 'database' },
    { id: '2', name: 'Ibuprofen', category: 'Pain Relief', dosage: '200mg', description: 'Anti-inflammatory pain reliever', source: 'database' },
    { id: '3', name: 'Paracetamol', category: 'Pain Relief', dosage: '500mg', description: 'Pain and fever reducer', source: 'database' },
    { id: '4', name: 'Amoxicillin', category: 'Antibiotic', dosage: '500mg', description: 'Penicillin antibiotic', source: 'database' },
    { id: '5', name: 'Metformin', category: 'Diabetes', dosage: '500mg', description: 'Type 2 diabetes medication', source: 'database' },
    { id: '6', name: 'Lisinopril', category: 'Blood Pressure', dosage: '10mg', description: 'ACE inhibitor for high blood pressure', source: 'database' },
    { id: '7', name: 'Atorvastatin', category: 'Cholesterol', dosage: '20mg', description: 'Cholesterol-lowering statin', source: 'database' },
    { id: '8', name: 'Omeprazole', category: 'Digestive', dosage: '20mg', description: 'Proton pump inhibitor for acid reflux', source: 'database' },
    // Cold & Flu Additions
    { id: '9', name: 'Cold & Flu Relief', category: 'Cold/Flu', dosage: '1 tablet', description: 'Multi-symptom relief for cold and flu', source: 'database' },
    { id: '10', name: 'Cetirizine', category: 'Allergy/Cold', dosage: '10mg', description: 'Antihistamine for allergy and cold symptoms', source: 'database' },
    { id: '11', name: 'Cough Syrup (Dextromethorphan)', category: 'Cold/Flu', dosage: '10ml', description: 'Suppressant for dry coughs', source: 'database' },
    { id: '12', name: 'Nasal Decongestant', category: 'Cold/Flu', dosage: '1 spray', description: 'Relief for stuffy nose and congestion', source: 'database' },
    { id: '13', name: 'Vitamin C + Zinc', category: 'Supplement', dosage: '1000mg', description: 'Immune support for cold prevention', source: 'database' },
];

// Symptom to Medicine/Category Mapping (Supports English & Telugu)
const SYMPTOM_MAP = {
    // ========== English Symptoms ==========
    'pain': ['Pain Relief'],
    'headache': ['Pain Relief', 'Aspirin', 'Paracetamol'],
    'fever': ['Pain Relief', 'Paracetamol'],
    'cold': ['Cold/Flu'],
    'flu': ['Cold/Flu'],
    'cough': ['Cold/Flu', 'Cough Syrup'],
    'allergy': ['Allergy/Cold', 'Cetirizine'],
    'stomach': ['Digestive', 'Omeprazole'],
    'acidity': ['Digestive', 'Omeprazole'],
    'infection': ['Antibiotic', 'Amoxicillin'],
    'sugar': ['Diabetes', 'Metformin'],
    'diabetes': ['Diabetes', 'Metformin'],
    'bp': ['Blood Pressure', 'Lisinopril'],
    'pressure': ['Blood Pressure'],
    'cholesterol': ['Cholesterol', 'Atorvastatin'],

    // ========== English Body Parts ==========
    'hand': ['Pain Relief'],
    'leg': ['Pain Relief'],
    'back': ['Pain Relief'],
    'neck': ['Pain Relief'],
    'joint': ['Pain Relief'],
    'muscle': ['Pain Relief'],
    'head': ['Pain Relief'],
    'tooth': ['Pain Relief'],
    'ear': ['Pain Relief', 'Antibiotic'],
    'eye': ['Allergy/Cold'],
    'throat': ['Cold/Flu', 'Antibiotic'],
    'chest': ['Pain Relief'],
    'shoulder': ['Pain Relief'],
    'knee': ['Pain Relief'],
    'ankle': ['Pain Relief'],
    'wrist': ['Pain Relief'],
    'elbow': ['Pain Relief'],
    'hip': ['Pain Relief'],
    'finger': ['Pain Relief'],

    // ========== Telugu Symptoms (Romanized) ==========
    // Pain variations
    'nopi': ['Pain Relief'],
    'noppi': ['Pain Relief'],
    'nopu': ['Pain Relief'],
    'noppulu': ['Pain Relief'],

    // Fever
    'jwaram': ['Pain Relief', 'Paracetamol'],
    'jvaram': ['Pain Relief', 'Paracetamol'],
    'juram': ['Pain Relief', 'Paracetamol'],

    // Cold/Cough
    'daggu': ['Cold/Flu', 'Cough Syrup'],
    'daggulu': ['Cold/Flu', 'Cough Syrup'],
    'jalabu': ['Cold/Flu'],
    'jelabu': ['Cold/Flu'],
    'jalabu cheyyali': ['Cold/Flu'],

    // Headache
    'thalanopi': ['Pain Relief', 'Paracetamol', 'Aspirin'],
    'thalanoppi': ['Pain Relief', 'Paracetamol', 'Aspirin'],
    'thala nopi': ['Pain Relief', 'Paracetamol', 'Aspirin'],
    'thala noppi': ['Pain Relief', 'Paracetamol', 'Aspirin'],

    // Stomach
    'potta nopi': ['Digestive', 'Omeprazole', 'Pain Relief'],
    'pottanopi': ['Digestive', 'Omeprazole', 'Pain Relief'],
    'kadupu nopi': ['Digestive', 'Omeprazole', 'Pain Relief'],
    'kadupunopi': ['Digestive', 'Omeprazole', 'Pain Relief'],
    'kadupu': ['Digestive'],
    'potta': ['Digestive'],
    'acidity_telugu': ['Digestive', 'Omeprazole'],
    'manta': ['Digestive', 'Omeprazole'], // Burning sensation

    // Diabetes
    'sugar vyadhi': ['Diabetes', 'Metformin'],
    'madhumeham': ['Diabetes', 'Metformin'],

    // ========== Telugu Body Parts (Romanized) ==========
    // Head
    'thala': ['Pain Relief'],
    'tala': ['Pain Relief'],

    // Hand/Hands
    'cheyyi': ['Pain Relief'],
    'chethulu': ['Pain Relief'],
    'chetulu': ['Pain Relief'],
    'cheyi': ['Pain Relief'],

    // Leg/Legs
    'kaalu': ['Pain Relief'],
    'kalu': ['Pain Relief'],
    'kalllu': ['Pain Relief'],

    // Back
    'veepu': ['Pain Relief'],
    'vepu': ['Pain Relief'],
    'nadumu': ['Pain Relief'],
    'nadumu nopi': ['Pain Relief'],

    // Neck
    'meda': ['Pain Relief'],
    'medha': ['Pain Relief'],

    // Throat
    'gonthu': ['Cold/Flu', 'Antibiotic'],
    'gontu': ['Cold/Flu', 'Antibiotic'],
    'gonthu nopi': ['Cold/Flu', 'Pain Relief'],

    // Tooth
    'pallu': ['Pain Relief'],
    'pannu': ['Pain Relief'],
    'pallu nopi': ['Pain Relief'],

    // Eye
    'kallu': ['Allergy/Cold'],
    'kannu': ['Allergy/Cold'],
    'kallu nopi': ['Pain Relief', 'Allergy/Cold'],

    // Ear
    'chevi': ['Pain Relief', 'Antibiotic'],
    'chevu': ['Pain Relief', 'Antibiotic'],
    'chevi nopi': ['Pain Relief'],

    // Chest
    'raattu': ['Pain Relief'],
    'chathi': ['Pain Relief'],

    // Shoulder
    'bhujam': ['Pain Relief'],
    'bhuja': ['Pain Relief'],

    // Knee
    'mokalu': ['Pain Relief'],
    'mokalu nopi': ['Pain Relief'],

    // Joint
    'keelatlu': ['Pain Relief'],
    'sandulu': ['Pain Relief'],

    // Muscle
    'kanda': ['Pain Relief'],
    'kandaralu': ['Pain Relief'],
};

// Categories are now dynamic based on language
const getCategories = (t) => [
    t('categories.All'),
    t('categories.Pain Relief'),
    t('categories.Antibiotic'),
    t('categories.Diabetes'),
    t('categories.Blood Pressure'),
    t('categories.Cholesterol'),
    t('categories.Digestive'),
    t('categories.Cold/Flu'),
    t('categories.Your Medications')
];

const DrugSearchScreen = ({ onGoBack }) => {
    const { t } = useLanguage();
    // Dynamic Categories
    const categories = getCategories(t);
    // Initialize with first category
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredDrugs, setFilteredDrugs] = useState([]); // Start empty
    const [allDrugs, setAllDrugs] = useState(DRUG_DATABASE);
    const [userMedications, setUserMedications] = useState([]);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [spellingSuggestion, setSpellingSuggestion] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    // Recording Timer
    useEffect(() => {
        let interval;
        if (isListening) {
            setRecordingDuration(0); // Reset on start (redundant but safe)
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingDuration(0); // Reset on stop
        }
        return () => clearInterval(interval);
    }, [isListening]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Load user medications on mount
    useEffect(() => {
        loadUserMedications();
    }, []);

    // Manual Search: Clear results when query is empty, but don't auto-search on type
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredDrugs([]);
            setSpellingSuggestion(null);
        }
    }, [searchQuery]);



    const loadUserMedications = async () => {
        try {
            const medications = await getMedications();
            const userDrugs = medications.map(med => ({
                id: `user-${med.id}`, // Ensure unique ID
                name: med.name,
                category: 'Your Medications',
                dosage: med.dosage || 'N/A',
                description: med.notes || med.instructions?.specialInstructions || 'Your personal medication',
                source: 'user',
                schedule: med.schedule,
            }));

            setUserMedications(userDrugs);
            setAllDrugs([...DRUG_DATABASE, ...userDrugs]);
        } catch (error) {
            console.error('Error loading user medications:', error);
        }
    };

    const handleSearch = async (query) => {
        setIsSearching(true);
        await performSearch(query, selectedCategory);
        setIsSearching(false);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
    };

    // Voice Search with Web Speech API
    const startVoiceSearch = () => {
        // Only on web for now
        if (Platform.OS !== 'web') {
            Alert.alert(t('notSupported') || 'Not Supported', t('voiceWebOnly') || 'Voice search is only available on web.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            Alert.alert(
                t('notSupported') || 'Not Supported',
                t('browserNoVoice') || 'Your browser does not support voice recognition. Try Chrome or Edge.'
            );
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log('🎤 Voice recognition started');
                setRecordingDuration(0);
                setIsListening(true);
            };

            recognition.onend = () => {
                console.log('🎤 Voice recognition ended');
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('🎤 Voice recognition error:', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    Alert.alert(
                        t('permissionDenied') || 'Permission Denied',
                        t('micPermission') || 'Please allow microphone access to use voice search.'
                    );
                }
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎤 Recognized:', transcript);
                setSearchQuery(transcript);
                // Do NOT trigger search automatically, let user review and press enter
                setIsListening(false);
            };

            recognition.start();
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            setIsListening(false);
        }
    };

    // Fuzzy search with spell checking, symptom mapping, and OpenFDA
    const performSearch = async (query, category) => {
        if (!query.trim()) {
            setFilteredDrugs([]);
            return;
        }

        const lowerQuery = query.toLowerCase().trim();
        const queryWords = lowerQuery.split(/\s+/); // Split by spaces

        // --- Symptom Mapping ---
        // Check if any word in the query matches a symptom key
        let symptomMatches = new Set();
        queryWords.forEach(word => {
            if (SYMPTOM_MAP[word]) {
                SYMPTOM_MAP[word].forEach(match => symptomMatches.add(match.toLowerCase()));
            }
        });
        // Also check full query
        if (SYMPTOM_MAP[lowerQuery]) {
            SYMPTOM_MAP[lowerQuery].forEach(match => symptomMatches.add(match.toLowerCase()));
        }
        const symptomFilters = Array.from(symptomMatches);
        console.log('Symptom filters:', symptomFilters);

        let localResults = allDrugs;

        // Apply category filter first (for local drugs)
        if (category !== t('categories.All')) {
            if (category === t('categories.Your Medications')) {
                localResults = localResults.filter(d => d.source === 'user');
            } else {
                localResults = localResults.filter(d =>
                    d.category === category ||
                    t(`categories.${d.category}`) === category
                );
            }
        }

        // Fuzzy search on local data
        const scoredLocalResults = localResults.map(drug => {
            const drugName = drug.name.toLowerCase();
            const drugDesc = drug.description.toLowerCase();
            const drugCategory = drug.category.toLowerCase();

            let score = 0;

            // Exact match (highest priority)
            if (drugName === lowerQuery) score += 100;
            if (drugName.includes(lowerQuery)) score += 50;
            if (drugDesc.includes(lowerQuery)) score += 20;
            if (drugCategory.includes(lowerQuery)) score += 15;

            // --- Symptom Match Scoring ---
            symptomFilters.forEach(symptomKey => {
                if (drugName.includes(symptomKey)) score += 60;
                if (drugCategory.includes(symptomKey)) score += 50;
                if (drugDesc.includes(symptomKey)) score += 25;
            });

            // --- Word-by-Word Fuzzy Match ---
            queryWords.forEach(word => {
                if (word.length < 2) return; // Skip very short words
                if (drugName.includes(word)) score += 30;
                if (drugDesc.includes(word)) score += 15;
                if (drugCategory.includes(word)) score += 20;
                // Levenshtein for typo tolerance on each word
                const distance = levenshteinDistance(word, drugName);
                if (distance <= 2 && distance > 0) score += (8 - distance * 2);
            });

            // Partial word match (original)
            const words = drugName.split(' ');
            if (words.some(word => word.startsWith(lowerQuery))) {
                score += 30;
            }

            return { drug, score };
        })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(r => r.drug);

        // ---------------------------------------------------------
        // OpenFDA API Search (Global Search)
        // ---------------------------------------------------------
        let apiResults = [];
        if (query.length >= 3 && category === t('categories.All')) {
            setIsSearching(true);
            try {
                // Import dynamically to avoid top-level await issues if any
                const { searchDrugs } = require('../services/OpenJDAService');
                apiResults = await searchDrugs(query);
            } catch (error) {
                console.error('API Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }

        // Combine Results: Local matches first, then API matches
        // Remove duplicates between local and API (by name)
        const combinedResults = [...scoredLocalResults];

        apiResults.forEach(apiDrug => {
            const exists = combinedResults.some(
                local => local.name.toLowerCase() === apiDrug.name.toLowerCase()
            );
            if (!exists) {
                combinedResults.push(apiDrug);
            }
        });

        // Spell checking suggestion (only if no results found at all)
        if (combinedResults.length === 0) {
            const suggestions = allDrugs
                .map(drug => ({
                    name: drug.name,
                    distance: levenshteinDistance(lowerQuery, drug.name.toLowerCase())
                }))
                .filter(s => s.distance > 0 && s.distance <= 3)
                .sort((a, b) => a.distance - b.distance);

            if (suggestions.length > 0) {
                setSpellingSuggestion(suggestions[0].name);
            }
        }

        setFilteredDrugs(combinedResults);
    };

    const handleDrugSelect = (drug) => {
        console.log('🔍 Drug selected:', drug.name);

        // Check if it's already a user medication
        if (drug.source === 'user') {
            Alert.alert(
                'Already Added',
                t('alreadyAdded'),
                t('alreadyInYourList'),
                [{ text: t('ok') }]
            );
            return;
        }

        if (Platform.OS === 'web') {
            // Web friendly confirmation
            const confirm = window.confirm(t('addConfirmation').replace('{drug}', t(`drugNames.${drug.name}`) || drug.name));
            if (confirm) {
                setShowAddModal(true);
            }
        } else {
            Alert.alert(
                t('addMedication'),
                t('addConfirmation').replace('{drug}', t(`drugNames.${drug.name}`) || drug.name),
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('add'), onPress: () => setShowAddModal(true) }
                ]
            );
        }
    };

    const handleMedicationAdded = async () => {
        // Reload user medications after adding
        await loadUserMedications();
        setShowAddModal(false);
        setSelectedDrug(null);
    };

    const renderContent = () => (
        <>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {onGoBack && (
                        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                            <Icon name="arrow-left" size={24} color="#0f172a" />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.title}>{t('drugSearch')}</Text>
                        <Text style={styles.subtitle}>{t('searchForInfo')}</Text>
                    </View>
                </View>
            </View>

            {/* Info Banner - "Powered by OpenFDA" style */}
            <View style={styles.infoBanner}>
                <Icon name="information-outline" size={20} color="#0284c7" />
                <View style={styles.infoBannerContent}>
                    <Text style={styles.infoBannerTitle}>{t('poweredBy')}</Text>
                    <Text style={styles.infoBannerText}>
                        {t('fdaDisclaimer')}
                    </Text>
                </View>
            </View>

            {/* Search Bar with Internal Voice Button */}
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder={t('searchMeds')}
                    onChangeText={(text) => setSearchQuery(text)}
                    onIconPress={() => handleSearch(searchQuery)} // Search on left icon press
                    onSubmitEditing={() => handleSearch(searchQuery)} // Search on Enter
                    value={searchQuery}
                    style={[
                        styles.searchBar,
                        isListening && styles.searchBarListening
                    ]}
                    icon={isListening ? 'microphone' : 'magnify'}
                    iconColor={isListening ? '#ef4444' : undefined}
                    right={() => (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {searchQuery.length > 0 && (
                                <IconButton
                                    icon="close"
                                    size={20}
                                    onPress={() => {
                                        setSearchQuery('');
                                        setFilteredDrugs([]);
                                    }}
                                />
                            )}
                            <IconButton
                                icon={isListening ? 'stop-circle-outline' : 'microphone'}
                                iconColor={isListening ? '#ef4444' : '#10b981'}
                                size={24}
                                onPress={isListening ? () => setIsListening(false) : startVoiceSearch}
                                style={isListening ? styles.micIconListening : undefined}
                            />
                            {searchQuery.length > 0 && !isListening && (
                                <IconButton
                                    icon="arrow-right-circle"
                                    iconColor="#3b82f6"
                                    size={28}
                                    onPress={() => handleSearch(searchQuery)}
                                />
                            )}
                        </View>
                    )}
                />
                {isListening && (
                    <Text style={styles.listeningText}>
                        {t('listening') || 'Listening...'} ({formatTime(recordingDuration)})
                    </Text>
                )}
            </View>

            {/* Categories */}
            <View style={styles.chipsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((category) => (
                        <Chip
                            key={category}
                            selected={selectedCategory === category}
                            onPress={() => setSelectedCategory(category)}
                            style={styles.chip}
                            textStyle={selectedCategory === category ? styles.chipTextActive : styles.chipText}
                        >
                            {category}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {/* Spelling Suggestion */}
            {spellingSuggestion && (
                <View style={styles.suggestionContainer}>
                    <Text style={styles.suggestionText}>Did you mean: </Text>
                    <Chip
                        style={styles.suggestionChip}
                        textStyle={styles.suggestionChipText}
                        onPress={() => {
                            setSearchQuery(spellingSuggestion);
                            setSpellingSuggestion(null);
                        }}
                        icon="spell-check"
                    >
                        {spellingSuggestion}
                    </Chip>
                </View>
            )}

            {/* Loading State */}
            {isSearching && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text style={styles.loadingText}>Searching medications...</Text>
                </View>
            )}

            {/* Search Results */}
            <View style={styles.results}>
                {!isSearching && filteredDrugs.length === 0 && !searchQuery.trim() ? (
                    <View style={styles.emptyState}>
                        <Icon name="pill-multiple" size={80} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Start Searching</Text>
                        <Text style={styles.emptySubtext}>
                            Type a medication name or symptom to find information
                        </Text>
                    </View>
                ) : !isSearching && filteredDrugs.length === 0 && searchQuery.trim() ? (
                    <View style={styles.emptyState}>
                        <Icon name="magnify" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No Results Found</Text>
                        <Text style={styles.emptySubtext}>
                            Try a different search term or check spelling
                        </Text>
                    </View>
                ) : !isSearching ? (
                    filteredDrugs.map((drug) => (
                        <TouchableOpacity
                            key={drug.id}
                            onPress={() => handleDrugSelect(drug)}
                            activeOpacity={0.7}
                        >
                            <Card style={styles.drugCard} elevation={1}>
                                <Card.Content>
                                    <View style={styles.drugHeader}>
                                        <View style={[styles.drugIcon, drug.source === 'user' && styles.drugIconUser]}>
                                            <Icon name="pill" size={24} color={drug.source === 'user' ? '#3b82f6' : '#10b981'} />
                                        </View>
                                        <View style={styles.drugInfo}>
                                            <View style={styles.drugNameRow}>
                                                <Text style={styles.drugName}>{t(`drugNames.${drug.name}`) !== `drugNames.${drug.name}` ? t(`drugNames.${drug.name}`) : drug.name}</Text>
                                                {drug.source === 'user' && (
                                                    <Chip
                                                        mode="flat"
                                                        style={styles.userBadge}
                                                        textStyle={styles.userBadgeText}
                                                        compact
                                                    >
                                                        {t('yourMedication')}
                                                    </Chip>
                                                )}
                                            </View>
                                            <Text style={styles.drugCategory}>
                                                {t(`categories.${drug.category}`) || drug.category} • {drug.dosage}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.drugDescription}>{drug.description}</Text>

                                    {/* Source Badge */}
                                    <View style={styles.sourceContainer}>
                                        <Chip
                                            icon={drug.source === 'OpenFDA' ? 'check-decagram' : 'database'}
                                            style={[styles.sourceChip, drug.source === 'OpenFDA' ? styles.sourceChipFda : styles.sourceChipLocal]}
                                            textStyle={styles.sourceChipText}
                                            compact
                                        >
                                            {drug.source === 'OpenFDA' ? 'Verified Source (OpenFDA)' : t('localDatabase') || 'MediSafe Database'}
                                        </Chip>
                                    </View>

                                    {drug.source === 'user' && drug.schedule && (
                                        <Text style={styles.drugSchedule}>
                                            {t('schedule')}: {drug.schedule.times?.join(', ') || t('notSet')}
                                        </Text>
                                    )}
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    ))
                ) : null}
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <View style={{ flex: 1 }}>
                    {renderContent()}
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
                    {renderContent()}
                </ScrollView>
            )}

            {/* Add Medication Modal */}
            <AddMedicationModal
                visible={showAddModal}
                onDismiss={() => {
                    setShowAddModal(false);
                    setSelectedDrug(null);
                }}
                onMedicationAdded={() => {
                    setShowAddModal(false);
                    setSelectedDrug(null);
                    handleMedicationAdded(); // Call the original handler to reload meds
                }}
                prefillData={selectedDrug ? {
                    name: t(`drugNames.${selectedDrug.name}`) || selectedDrug.name,
                    dosage: selectedDrug.dosage
                } : null}
            />
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
        paddingBottom: 4,
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    listContent: {
        paddingBottom: 100, // Extra padding for scrolling
    },
    loader: {
        marginVertical: 20,
    },
    infoBanner: {
        marginHorizontal: 24,
        marginBottom: 20,
        marginTop: 16,
        padding: 12,
        backgroundColor: '#e0f2fe',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    infoBannerContent: {
        marginLeft: 10,
        flex: 1,
    },
    infoBannerTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0284c7',
        marginBottom: 2,
    },
    infoBannerText: {
        fontSize: 13,
        color: '#334155',
        lineHeight: 18,
    },
    searchContainer: {
        marginHorizontal: 24,
        marginBottom: 16,
    },
    searchBar: {
        elevation: 2,
        backgroundColor: '#ffffff',
        borderRadius: 28, // Rounder for modern look
    },
    searchBarListening: {
        borderColor: '#ef4444',
        borderWidth: 2,
    },
    micIconListening: {
        backgroundColor: '#fee2e2',
        ...(Platform.OS === 'web' && {
            animation: 'pulse 1.5s infinite',
        }),
    },
    listeningText: {
        textAlign: 'center',
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    categories: {
        paddingHorizontal: 24,
        marginBottom: 16,
        maxHeight: 40,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    categoryChipActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    categoryTextActive: {
        color: '#ffffff',
    },
    results: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    resultsContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    drugCard: {
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: '#ffffff',
    },
    drugHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    drugIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    drugInfo: {
        flex: 1,
    },
    drugNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        flexWrap: 'wrap',
        gap: 8,
    },
    drugName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    userBadge: {
        backgroundColor: '#dbeafe',
        height: 24,
    },
    userBadgeText: {
        fontSize: 10,
        color: '#1e40af',
        fontWeight: '700',
    },
    drugIconUser: {
        backgroundColor: '#dbeafe',
    },
    drugCategory: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    drugDescription: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
    },
    drugSchedule: {
        fontSize: 12,
        color: '#3b82f6',
        marginTop: 8,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    suggestionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    suggestionText: {
        fontSize: 14,
        color: '#64748b',
        marginRight: 8,
    },
    suggestionChip: {
        backgroundColor: '#fef3c7',
        borderColor: '#fbbf24',
        borderWidth: 1,
    },
    suggestionChipText: {
        color: '#92400e',
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 12,
    },
    chipsContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
    },
    chipText: {
        fontSize: 13,
        color: '#64748b',
    },
    chipTextActive: {
        fontSize: 13,
        color: '#10b981',
        fontWeight: '600',
    },
    sourceContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    sourceChip: {
        height: 24,
    },
    sourceChipFda: {
        backgroundColor: '#f1f5f9',
        borderColor: '#0f172a',
    },
    sourceChipLocal: {
        backgroundColor: '#fff7ed',
        borderColor: '#f97316',
    },
    sourceChipText: {
        fontSize: 10,
        marginVertical: -2, // Compact vertical
    }
});

export default DrugSearchScreen;
