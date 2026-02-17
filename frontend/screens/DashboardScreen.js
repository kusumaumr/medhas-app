import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../components/Sidebar';
import StatisticsCards from '../components/StatisticsCards';
import TodaySchedule from '../components/TodaySchedule';
import QuickActions from '../components/QuickActions';
import AlertsPanel from '../components/AlertsPanel';
import { useLanguage } from '../services/LanguageContext';
import { getMedications } from '../services/StorageService';
import { useFocusEffect } from '@react-navigation/native';

// Import all feature screens
import MedicationsScreen from './MedicationsScreen';
import DrugSearchScreen from './DrugSearchScreen';
import HealthLogScreen from './HealthLogScreen';
import CareNetworkScreen from './CareNetworkScreen';
import VideoConsultationScreen from './VideoConsultationScreen';
import SettingsScreen from './SettingsScreen';
import { translateText } from '../services/TranslationService';






const DashboardScreen = ({ navigation }) => {
    const { t, language } = useLanguage();
    const isWeb = Platform.OS === 'web';
    const [userName, setUserName] = useState('User');
    const [displayUserName, setDisplayUserName] = useState('User');
    const [activeScreen, setActiveScreen] = useState('Dashboard');
    const [medications, setMedications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Load user data
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user');
                let name = 'Kusuma Kadimisetty';
                if (userJson) {
                    const user = JSON.parse(userJson);
                    name = user.name || 'Kusuma Kadimisetty';
                    setUserEmail(user.email || '');
                }
                setUserName(name);
                setDisplayUserName(name); // Set initial display name
            } catch (error) {
                console.error('Error loading user data:', error);
                setUserName('Kusuma Kadimisetty');
            }
        };
        loadUserData();
    }, []);

    // Translate User Name when language changes
    useEffect(() => {
        const translateName = async () => {
            if (language === 'en') {
                setDisplayUserName(userName);
            } else {
                const translated = await translateText(userName, language);
                setDisplayUserName(translated);
            }
        };
        translateName();
    }, [userName, language]);

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('goodMorning');
        if (hour < 18) return t('goodAfternoon');
        return t('goodEvening');
    };

    // Load medications on screen focus
    useFocusEffect(
        React.useCallback(() => {
            loadMedications();
        }, [])
    );

    // Reload medications when returning to Dashboard from other screens
    useEffect(() => {
        if (activeScreen === 'Dashboard') {
            loadMedications();
        }
    }, [activeScreen]);

    const loadMedications = async () => {
        try {
            const data = await getMedications();
            const activeMeds = data.filter(m => m.isActive !== false);
            setMedications(activeMeds || []);
        } catch (error) {
            console.error('Failed to load medications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate statistics
    const calculateStats = () => {
        const totalMeds = medications.length;

        // Count doses today
        let dosesToday = 0;
        medications.forEach(med => {
            const times = med.schedule?.times || med.times;
            if (times && times.length > 0) {
                dosesToday += times.length;
            }
        });

        // Calculate adherence rate
        let dosesTakenToday = 0;
        const todayStr = new Date().toDateString();

        medications.forEach(med => {
            if (med.history && med.history.length > 0) {
                // Count how many times it was taken TODAY
                const takenCount = med.history.filter(h => new Date(h.takenAt).toDateString() === todayStr).length;
                dosesTakenToday += takenCount;
            }
        });

        // Adherence = (Took / Scheduled) * 100
        // If 0 scheduled, 0% adherence (better than 100% which implies perfection for doing nothing)
        const adherenceRate = dosesToday > 0 ? Math.round((dosesTakenToday / dosesToday) * 100) : 0;

        // Count active warnings: Sum up all interactions from all medications
        let warningCount = 0;
        medications.forEach(med => {
            if (med.interactions && med.interactions.length > 0) {
                warningCount += med.interactions.length;
            }

            // Check for low stock
            if (med.inventory && med.inventory.enabled && (med.inventory.currentQuantity <= med.inventory.lowStockThreshold)) {
                warningCount += 1;
            }
        });

        return { totalMeds, adherenceRate, dosesToday, dosesTakenToday, warningCount };
    };

    const stats = calculateStats();

    const handleNavigate = (screen) => {
        console.log('🖱️ [DASHBOARD] Navigate clicked:', screen);
        setActiveScreen(screen);
    };

    const handleMarkTaken = async (medId, isTaken, takenAt) => {
        console.log(`📋 Marked medication ${medId} as ${isTaken ? 'taken' : 'not taken'}`);

        // 1. Optimistically update local state to reflect change immediately in UI/Stats
        setMedications(prevMeds => {
            return prevMeds.map(med => {
                const currentId = med._id || med.id;
                if (currentId === medId) {
                    let newHistory = med.history || [];
                    if (isTaken) {
                        // Add history entry
                        newHistory.push({ takenAt: takenAt.toISOString(), status: 'taken' });
                    } else {
                        // Remove today's history entry (simple logic: remove last taken today)
                        const todayStr = new Date().toDateString();
                        newHistory = newHistory.filter(h => new Date(h.takenAt).toDateString() !== todayStr);
                    }
                    return { ...med, history: newHistory };
                }
                return med;
            });
        });

        // 2. Persist to backend (fire and forget for now, or handle error if needed)
        // await markMedicationAsTaken(medId); // Implement in StorageService if not exists
    };

    // Render the appropriate screen based on activeScreen state
    const renderActiveScreen = () => {
        switch (activeScreen) {
            case 'Medications':
                return <MedicationsScreen onGoBack={() => setActiveScreen('Dashboard')} />;
            case 'Drug Search':
                return <DrugSearchScreen onGoBack={() => setActiveScreen('Dashboard')} />;
            case 'Health Log':
                return <HealthLogScreen onGoBack={() => setActiveScreen('Dashboard')} />;
            case 'Care Network':
                return <CareNetworkScreen onGoBack={() => setActiveScreen('Dashboard')} />;
            case 'Video Consultation':
                return <VideoConsultationScreen navigation={{ goBack: () => setActiveScreen('Dashboard') }} />;
            case 'Settings':
                return <SettingsScreen onGoBack={() => setActiveScreen('Dashboard')} />;
            case 'Dashboard':
            default:
                return renderDashboard();
        }
    };

    const renderDashboard = () => {
        const ScrollContainer = isWeb ? 'div' : ScrollView;
        const containerProps = isWeb
            ? { style: { flex: 1, overflowY: 'auto', padding: '32px' } }
            : { contentContainerStyle: styles.scrollContent };

        return (
            <ScrollContainer {...containerProps}>
                {/* Header */}
                <View style={styles.header}>
                    {isWeb && !isSidebarOpen && (
                        <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
                            <Icon name="menu" size={28} color="#0f172a" />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.welcomeText}>{getGreeting()}, {displayUserName}! 👋</Text>
                        <Text style={styles.subText}>{t('medicationOverview')}</Text>
                    </View>
                </View>

                {/* Statistics Cards */}
                <StatisticsCards
                    totalMeds={stats.totalMeds}
                    adherenceRate={stats.adherenceRate}
                    dosesToday={stats.dosesTakenToday}
                    activeWarnings={stats.warningCount}
                />

                {/* Today's Schedule */}
                <TodaySchedule
                    medications={medications}
                    onMarkTaken={handleMarkTaken}
                />

                {/* Quick Actions */}
                <QuickActions onNavigate={handleNavigate} />

                {/* Alerts & Warnings */}
                <AlertsPanel medications={medications} />
            </ScrollContainer>
        );
    };

    return (
        <View style={styles.container}>
            {/* Sidebar - Visible on Desktop/Tablet web */}
            {isWeb && <Sidebar activeItem={activeScreen} onNavigate={handleNavigate} userEmail={userEmail} isOpen={isSidebarOpen} onToggle={toggleSidebar} />}

            {/* Main Content Area - Conditionally render based on activeScreen */}
            <View style={styles.mainContent}>
                {renderActiveScreen()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        ...(Platform.OS === 'web' && {
            height: '100vh', // Force full viewport height
            overflow: 'hidden', // Prevent window scroll, handle inside mainContent
        })
    },
    mainContent: {
        flex: 1,
        ...(Platform.OS === 'web' ? {
            height: '100vh',
            overflowY: 'scroll', // FORCE scrollbar
            display: 'block', // Ensure block formatting context
        } : {
            height: '100%',
        }),
    },
    scrollContent: {
        padding: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    menuButton: {
        marginRight: 16,
        padding: 4,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#64748b',
    },
});

export default DashboardScreen;
