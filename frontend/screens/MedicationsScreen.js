import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text, FAB, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { getMedications, deleteMedication, markMedicationTaken } from '../services/StorageService';
import MedicationCard from '../components/MedicationCard';
import AddMedicationModal from '../components/AddMedicationModal';
import { useLanguage } from '../services/LanguageContext';

const MedicationsScreen = ({ onGoBack }) => {
    const { t } = useLanguage();
    const [medications, setMedications] = useState([]);
    const [filteredMeds, setFilteredMeds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, paused
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingMedication, setEditingMedication] = useState(null);

    useEffect(() => {
        loadMedications();
    }, []);

    useEffect(() => {
        filterMedications();
    }, [medications, searchQuery, filter]);

    const loadMedications = async () => {
        console.log('🔄 Loading medications from server...');
        setIsLoading(true);
        const meds = await getMedications();
        console.log(`✅ Loaded ${meds.length} medications:`, meds.map(m => m.name));
        setMedications(meds);
        setIsLoading(false);
    };

    const filterMedications = () => {
        let filtered = medications;

        // Apply status filter
        if (filter === 'active') {
            filtered = filtered.filter(m => m.isActive);
        } else if (filter === 'paused') {
            filtered = filtered.filter(m => !m.isActive);
        }

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredMeds(filtered);
    };

    const handleMarkTaken = async (id) => {
        const success = await markMedicationTaken(id);
        if (success) {
            Alert.alert(t('success') || 'Success', t('medicationTaken'));
            loadMedications();
        } else {
            Alert.alert(t('error') || 'Error', t('failedToMarkTaken'));
        }
    };

    const handleDelete = async (id) => {
        // Immediate delete without confirmation as requested
        const success = await deleteMedication(id);
        if (success) {
            // Optimistic update
            const updatedMeds = medications.filter(m => m.id !== id);
            setMedications(updatedMeds);
            setFilteredMeds(filteredMeds.filter(m => m.id !== id));
            loadMedications();
        } else {
            Alert.alert(t('error') || 'Error', t('failedToDelete'));
        }
    };

    const handleMedicationAdded = () => {
        console.log('📋 handleMedicationAdded called - refreshing list');
        setIsAddModalVisible(false);
        setEditingMedication(null);
        loadMedications();
    };

    const handleEdit = (medication) => {
        setEditingMedication(medication);
        setIsAddModalVisible(true);
    };

    // Render content based on platform to ensure proper scrolling
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
                        <Text style={styles.title}>{t('myMedications')}</Text>
                        <Text style={styles.subtitle}>{medications.length} {t('medicationCount')}</Text>
                    </View>
                </View>
            </View>

            {/* Search Bar */}
            <Searchbar
                placeholder={t('searchMedications')}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <Chip
                    selected={filter === 'all'}
                    onPress={() => setFilter('all')}
                    style={[styles.chip, filter === 'all' && styles.chipSelected]}
                    textStyle={filter === 'all' && styles.chipTextSelected}
                >
                    {t('all')} ({medications.length})
                </Chip>
                <Chip
                    selected={filter === 'active'}
                    onPress={() => setFilter('active')}
                    style={[styles.chip, filter === 'active' && styles.chipSelected]}
                    textStyle={filter === 'active' && styles.chipTextSelected}
                >
                    {t('active')} ({medications.filter(m => m.isActive).length})
                </Chip>
                <Chip
                    selected={filter === 'paused'}
                    onPress={() => setFilter('paused')}
                    style={[styles.chip, filter === 'paused' && styles.chipSelected]}
                    textStyle={filter === 'paused' && styles.chipTextSelected}
                >
                    {t('paused')} ({medications.filter(m => !m.isActive).length})
                </Chip>
            </View>

            {/* Medications List */}
            <View style={styles.list}>
                {isLoading ? (
                    <View style={styles.emptyState}>
                        <Icon name="loading" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>{t('loadingMedications')}</Text>
                    </View>
                ) : filteredMeds.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="pill-off" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>
                            {searchQuery ? t('noMedicationsFound') : t('noMedicationsYet')}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery ? t('tryDifferentSearch') : t('tapToAdd')}
                        </Text>
                    </View>
                ) : (
                    filteredMeds.map((med) => (
                        <MedicationCard
                            key={med.id}
                            medication={med}
                            onMarkTaken={() => handleMarkTaken(med.id)}
                            onDelete={() => handleDelete(med.id)}
                            onEdit={() => handleEdit(med)}
                        />
                    ))
                )}
            </View>

            {/* Button at the end of page content */}
            <View style={styles.fabContainer}>
                <FAB
                    icon="plus"
                    style={styles.fabInline}
                    onPress={() => {
                        setEditingMedication(null);
                        setIsAddModalVisible(true);
                    }}
                    label={Platform.OS === 'web' ? t('addMedication') : undefined}
                />
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
                    {renderContent()}
                </ScrollView>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
                    {renderContent()}
                </ScrollView>
            )}

            {/* Add Medication Modal */}
            <AddMedicationModal
                visible={isAddModalVisible}
                onDismiss={() => {
                    setIsAddModalVisible(false);
                    setEditingMedication(null);
                }}
                onMedicationAdded={handleMedicationAdded}
                prefillData={editingMedication}
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
        paddingHorizontal: 24,
        paddingTop: 24,
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
    searchBar: {
        marginHorizontal: 24,
        marginBottom: 16,
        elevation: 2,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 16,
        gap: 8,
    },
    chip: {
        backgroundColor: '#ffffff',
    },
    chipSelected: {
        backgroundColor: '#10b981',
    },
    chipTextSelected: {
        color: '#ffffff',
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    listContent: {
        padding: 24,
        paddingTop: 8,
    },
    emptyState: {
        flex: 1,
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

export default MedicationsScreen;
