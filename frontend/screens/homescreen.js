import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  ActivityIndicator,
  FAB,
  List,
  Avatar,
  Badge,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { medicationAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData();
    fetchData();
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [medsResponse, statsResponse] = await Promise.all([
        medicationAPI.getAll(),
        medicationAPI.getStats(),
      ]);

      if (medsResponse.success) {
        setMedications(medsResponse.data);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTakeMedication = async (medication) => {
    Alert.alert(
      `Take ${medication.name}`,
      `Have you taken ${medication.dosage.value} ${medication.dosage.unit} of ${medication.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Taken',
          onPress: async () => {
            try {
              await medicationAPI.markAsTaken(medication._id);
              fetchData(); // Refresh data
              Alert.alert('Success', 'Medication marked as taken!');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark medication as taken.');
            }
          },
        },
      ]
    );
  };

  const handleMissedMedication = async (medication) => {
    Alert.alert(
      `Missed ${medication.name}`,
      'Mark this dose as missed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Missed',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationAPI.markAsMissed(medication._id);
              fetchData();
              Alert.alert('Noted', 'Missed dose recorded.');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as missed.');
            }
          },
        },
      ]
    );
  };

  const getUpcomingMedications = () => {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

    return medications
      .filter(med => {
        if (!med.nextReminder) return false;
        const reminderTime = new Date(med.nextReminder);
        return reminderTime > now && reminderTime <= nextHour;
      })
      .sort((a, b) => new Date(a.nextReminder) - new Date(b.nextReminder));
  };

  const getTimeUntilReminder = (reminderTime) => {
    const now = new Date();
    const reminder = new Date(reminderTime);
    const diffMs = reminder - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins <= 0) return 'Now';
    if (diffMins < 60) return `in ${diffMins} min`;
    if (diffMins < 1440) return `in ${Math.floor(diffMins / 60)} hours`;
    return 'Tomorrow';
  };

  const renderMedicationCard = (medication) => (
    <TouchableOpacity
      key={medication._id}
      onPress={() => navigation.navigate('MedicationDetail', { medication })}
    >
      <Card style={styles.medicationCard}>
        <Card.Content>
          <View style={styles.medicationHeader}>
            <View style={styles.medicationInfo}>
              <Title style={styles.medicationName}>{medication.name}</Title>
              <Paragraph>
                💊 {medication.dosage.value} {medication.dosage.unit}
              </Paragraph>
            </View>
            <Badge
              size={24}
              style={[
                styles.adherenceBadge,
                { backgroundColor: getAdherenceColor(medication.adherence.adherenceRate) }
              ]}
            >
              {Math.round(medication.adherence.adherenceRate)}%
            </Badge>
          </View>

          <View style={styles.medicationDetails}>
            <View style={styles.detailRow}>
              <Icon name="clock-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {medication.schedule.frequency}
              </Text>
            </View>

            {medication.nextReminder && (
              <View style={styles.detailRow}>
                <Icon name="bell-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Next: {getTimeUntilReminder(medication.nextReminder)}
                </Text>
              </View>
            )}

            {medication.interactions && medication.interactions.length > 0 && (
              <View style={styles.detailRow}>
                <Icon name="alert-circle" size={16} color="#ff6b6b" />
                <Text style={[styles.detailText, styles.warningText]}>
                  {medication.interactions.length} interaction warning(s)
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              compact
              style={styles.takeButton}
              onPress={() => handleTakeMedication(medication)}
            >
              Mark Taken
            </Button>
            <Button
              mode="outlined"
              compact
              style={styles.missButton}
              onPress={() => handleMissedMedication(medication)}
            >
              Mark Missed
            </Button>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const getAdherenceColor = (rate) => {
    if (rate >= 90) return '#4CAF50'; // Green
    if (rate >= 70) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading your medications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Header */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <View>
                <Title style={styles.welcomeTitle}>
                  Welcome back, {user?.name || 'User'}! 👋
                </Title>
                <Paragraph>
                  {medications.length} active medications
                </Paragraph>
              </View>
              <Avatar.Text
                size={50}
                label={user?.name?.charAt(0) || 'U'}
                style={styles.avatar}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Stats Overview */}
        {stats && (
          <Card style={styles.statsCard}>
            <Card.Content>
              <Title style={styles.statsTitle}>Your Adherence</Title>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {stats.overview.takenDoses || 0}
                  </Text>
                  <Text style={styles.statLabel}>Taken Doses</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {stats.overview.missedDoses || 0}
                  </Text>
                  <Text style={styles.statLabel}>Missed Doses</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {Math.round(stats.overview.averageAdherence || 0)}%
                  </Text>
                  <Text style={styles.statLabel}>Adherence Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {stats.overview.totalMedications || 0}
                  </Text>
                  <Text style={styles.statLabel}>Medications</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Upcoming Reminders */}
        {getUpcomingMedications().length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Title style={styles.sectionTitle}>
                  ⏰ Upcoming in Next Hour
                </Title>
                <Badge>{getUpcomingMedications().length}</Badge>
              </View>
              {getUpcomingMedications().map(renderMedicationCard)}
            </Card.Content>
          </Card>
        )}

        {/* All Medications */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📋 All Medications</Title>
            {medications.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="pill" size={60} color="#e0e0e0" />
                <Title style={styles.emptyTitle}>No Medications Added</Title>
                <Paragraph style={styles.emptyText}>
                  Add your first medication to get started with reminders and safety checks.
                </Paragraph>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Add')}
                  style={styles.emptyButton}
                >
                  Add First Medication
                </Button>
              </View>
            ) : (
              medications.map(renderMedicationCard)
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Add')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
  },
  avatar: {
    backgroundColor: '#4a90e2',
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  medicationCard: {
    marginBottom: 12,
    elevation: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    marginBottom: 4,
  },
  adherenceBadge: {
    alignSelf: 'flex-start',
  },
  medicationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  warningText: {
    color: '#ff6b6b',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  takeButton: {
    flex: 1,
    marginRight: 8,
  },
  missButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 24,
  },
  emptyButton: {
    width: '100%',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4a90e2',
  },
});

export default HomeScreen;