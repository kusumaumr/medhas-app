import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  ActivityIndicator,
  SegmentedButtons,
  Checkbox,
  Chip,
  Divider,
} from 'react-native-paper';
// DateTimePicker is not compatible with web, only import on native platforms
let DateTimePicker;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.warn('DateTimePicker not available');
  }
}
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { medicationAPI } from '../services/api';

const AddMedication = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchingDrug, setSearchingDrug] = useState(false);
  const [drugInfo, setDrugInfo] = useState(null);
  const [interactions, setInteractions] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    dosage: {
      value: '',
      unit: 'mg',
      form: 'tablet',
    },
    schedule: {
      frequency: 'daily',
      timesPerDay: 1,
      specificTimes: ['08:00'],
      daysOfWeek: [],
      startDate: new Date(),
      endDate: null,
      duration: {
        value: '',
        unit: 'days',
      },
    },
    instructions: {
      takeWith: null,
      specialInstructions: '',
      storage: null,
    },
    reminders: {
      enabled: true,
      advanceTime: 30,
      methods: ['push'],
      snoozeDuration: 10,
      notifyEmergencyContacts: false,
    },
    prescription: {
      prescribedBy: '',
      prescriptionDate: new Date(),
      refills: {
        total: 0,
        remaining: 0,
      },
      pharmacy: {
        name: '',
        phone: '',
        address: '',
      },
    },
    inventory: {
      currentQuantity: '',
      lowStockThreshold: '5',
      enabled: true,
    },
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(null);

  // Frequency options
  const frequencyOptions = [
    { label: 'Once', value: 'once' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'As Needed', value: 'as-needed' },
  ];

  // Dosage units
  const dosageUnits = [
    { label: 'mg', value: 'mg' },
    { label: 'mcg', value: 'mcg' },
    { label: 'g', value: 'g' },
    { label: 'ml', value: 'ml' },
    { label: 'tablet', value: 'tablet' },
    { label: 'capsule', value: 'capsule' },
  ];

  // Dosage forms
  const dosageForms = [
    { label: 'Tablet', value: 'tablet' },
    { label: 'Capsule', value: 'capsule' },
    { label: 'Liquid', value: 'liquid' },
    { label: 'Injection', value: 'injection' },
    { label: 'Cream', value: 'cream' },
    { label: 'Inhaler', value: 'inhaler' },
    { label: 'Patch', value: 'patch' },
  ];

  // Take with options
  const takeWithOptions = [
    { label: 'Empty Stomach', value: 'empty-stomach' },
    { label: 'With Food', value: 'with-food' },
    { label: 'Before Food', value: 'before-food' },
    { label: 'After Food', value: 'after-food' },
    { label: 'With Milk', value: 'with-milk' },
  ];

  // Days of week
  const daysOfWeek = [
    { label: 'Mon', value: 'monday', short: 'M' },
    { label: 'Tue', value: 'tuesday', short: 'T' },
    { label: 'Wed', value: 'wednesday', short: 'W' },
    { label: 'Thu', value: 'thursday', short: 'T' },
    { label: 'Fri', value: 'friday', short: 'F' },
    { label: 'Sat', value: 'saturday', short: 'S' },
    { label: 'Sun', value: 'sunday', short: 'S' },
  ];

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Medication name is required';
    }

    if (!formData.dosage.value || isNaN(formData.dosage.value) || parseFloat(formData.dosage.value) <= 0) {
      newErrors.dosageValue = 'Valid dosage value is required';
    }

    if (formData.schedule.frequency === 'daily' && formData.schedule.specificTimes.length === 0) {
      newErrors.specificTimes = 'At least one time is required for daily schedule';
    }

    if (formData.schedule.frequency === 'weekly' && formData.schedule.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'At least one day is required for weekly schedule';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Search drug information
  const searchDrug = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a medication name first');
      return;
    }

    setSearchingDrug(true);
    try {
      const response = await medicationAPI.searchDrug(formData.name);

      if (response.success) {
        setDrugInfo(response.data);

        // Auto-fill form with drug info
        setFormData(prev => ({
          ...prev,
          genericName: response.data.genericName || prev.genericName,
          brandName: response.data.brandName || prev.brandName,
        }));

        Alert.alert(
          'Drug Information Found',
          `Found information for ${response.data.brandName || response.data.name}`
        );
      } else {
        Alert.alert('Information', 'No additional drug information found');
      }
    } catch (error) {
      console.error('Drug search error:', error);
      Alert.alert('Error', 'Failed to search drug information');
    } finally {
      setSearchingDrug(false);
    }
  };

  // Check interactions
  const checkInteractions = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a medication name first');
      return;
    }

    try {
      const response = await medicationAPI.checkInteractions([formData.name]);

      if (response.success && response.data.interactions.length > 0) {
        setInteractions(response.data.interactions);
        Alert.alert(
          'Interactions Found',
          `Found ${response.data.interactions.length} potential interaction(s)`
        );
      } else {
        Alert.alert('No Interactions', 'No potential interactions found');
      }
    } catch (error) {
      console.error('Interaction check error:', error);
      Alert.alert('Error', 'Failed to check interactions');
    }
  };

  // Handle time selection
  const handleTimeSelect = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const timeStr = selectedTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      if (currentTimeIndex !== null) {
        // Update existing time
        const newTimes = [...formData.schedule.specificTimes];
        newTimes[currentTimeIndex] = timeStr;
        setFormData(prev => ({
          ...prev,
          schedule: {
            ...prev.schedule,
            specificTimes: newTimes
          }
        }));
      } else {
        // Add new time
        setFormData(prev => ({
          ...prev,
          schedule: {
            ...prev.schedule,
            specificTimes: [...prev.schedule.specificTimes, timeStr]
          }
        }));
      }
    }
  };

  // Remove time
  const removeTime = (index) => {
    const newTimes = formData.schedule.specificTimes.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        specificTimes: newTimes
      }
    }));
  };

  // Toggle day selection
  const toggleDay = (day) => {
    const currentDays = formData.schedule.daysOfWeek;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];

    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        daysOfWeek: newDays
      }
    }));
  };

  // Add medication
  const handleAddMedication = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form for errors');
      return;
    }

    setIsLoading(true);
    try {
      const medicationData = {
        ...formData,
        dosage: {
          ...formData.dosage,
          value: parseFloat(formData.dosage.value)
        },
        inventory: {
          ...formData.inventory,
          currentQuantity: formData.inventory.currentQuantity ? parseInt(formData.inventory.currentQuantity) : 0,
          lowStockThreshold: formData.inventory.lowStockThreshold ? parseInt(formData.inventory.lowStockThreshold) : 5
        }
      };

      const response = await medicationAPI.create(medicationData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Medication added successfully!',
          [
            {
              text: 'View Details',
              onPress: () => navigation.navigate('MedicationDetail', {
                medication: response.data
              })
            },
            {
              text: 'Add Another',
              onPress: () => {
                // Reset form
                setFormData({
                  ...formData,
                  name: '',
                  dosage: { ...formData.dosage, value: '' },
                  notes: ''
                });
                setDrugInfo(null);
                setInteractions([]);
              },
              style: 'cancel'
            },
            {
              text: 'Go Home',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to add medication');
      }
    } catch (error) {
      console.error('Add medication error:', error);
      Alert.alert('Error', error.message || 'Failed to add medication');
    } finally {
      setIsLoading(false);
    }
  };

  // Render time chips
  const renderTimeChips = () => (
    <View style={styles.chipContainer}>
      {formData.schedule.specificTimes.map((time, index) => (
        <Chip
          key={index}
          mode="outlined"
          onClose={() => removeTime(index)}
          style={styles.chip}
        >
          {time}
        </Chip>
      ))}
      <Chip
        mode="outlined"
        icon="plus"
        onPress={() => {
          setCurrentTimeIndex(null);
          setShowTimePicker(true);
        }}
        style={[styles.chip, styles.addChip]}
      >
        Add Time
      </Chip>
    </View>
  );

  // Render day chips
  const renderDayChips = () => (
    <View style={styles.chipContainer}>
      {daysOfWeek.map((day) => (
        <Chip
          key={day.value}
          mode={formData.schedule.daysOfWeek.includes(day.value) ? 'flat' : 'outlined'}
          selected={formData.schedule.daysOfWeek.includes(day.value)}
          onPress={() => toggleDay(day.value)}
          style={styles.chip}
        >
          {day.short}
        </Chip>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Add New Medication</Title>

          {/* Medication Name */}
          <View style={styles.inputRow}>
            <TextInput
              label="Medication Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={[styles.input, styles.flex1]}
              error={!!errors.name}
            />
            <Button
              mode="outlined"
              loading={searchingDrug}
              onPress={searchDrug}
              style={styles.searchButton}
            >
              Search
            </Button>
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* Generic/Brand Name */}
          <View style={styles.row}>
            <TextInput
              label="Generic Name"
              value={formData.genericName}
              onChangeText={(text) => setFormData({ ...formData, genericName: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              label="Brand Name"
              value={formData.brandName}
              onChangeText={(text) => setFormData({ ...formData, brandName: text })}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
            />
          </View>

          {/* Dosage */}
          <Text style={styles.sectionLabel}>Dosage *</Text>
          <View style={styles.row}>
            <TextInput
              label="Amount"
              value={formData.dosage.value}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                dosage: { ...prev.dosage, value: text }
              }))}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.quarterInput]}
              error={!!errors.dosageValue}
            />
            <View style={[styles.input, styles.quarterInput]}>
              <SegmentedButtons
                value={formData.dosage.unit}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  dosage: { ...prev.dosage, unit: value }
                }))}
                buttons={dosageUnits.slice(0, 4).map(unit => ({
                  value: unit.value,
                  label: unit.label
                }))}
                density="small"
              />
            </View>
            <View style={[styles.input, styles.halfInput]}>
              <SegmentedButtons
                value={formData.dosage.form}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  dosage: { ...prev.dosage, form: value }
                }))}
                buttons={dosageForms.slice(0, 3).map(form => ({
                  value: form.value,
                  label: form.label
                }))}
                density="small"
              />
            </View>
          </View>
          {errors.dosageValue && (
            <Text style={styles.errorText}>{errors.dosageValue}</Text>
          )}

          {/* Frequency */}
          <Text style={styles.sectionLabel}>Frequency *</Text>
          <SegmentedButtons
            value={formData.schedule.frequency}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              schedule: { ...prev.schedule, frequency: value }
            }))}
            buttons={frequencyOptions}
            style={styles.segmentedButtons}
          />
          <Text style={styles.helperText}>Select 'Daily' to set specific reminder times</Text>

          {/* Daily Schedule */}
          {formData.schedule.frequency === 'daily' && (
            <>
              <Text style={styles.sectionLabel}>Schedule Times *</Text>
              {renderTimeChips()}
              {errors.specificTimes && (
                <Text style={styles.errorText}>{errors.specificTimes}</Text>
              )}
            </>
          )}

          {/* Weekly Schedule */}
          {formData.schedule.frequency === 'weekly' && (
            <>
              <Text style={styles.sectionLabel}>Select Days *</Text>
              {renderDayChips()}
              {errors.daysOfWeek && (
                <Text style={styles.errorText}>{errors.daysOfWeek}</Text>
              )}
            </>
          )}

          {/* Take With Instructions */}
          <Text style={styles.sectionLabel}>Take With</Text>
          <SegmentedButtons
            value={formData.instructions.takeWith || ''}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              instructions: {
                ...prev.instructions,
                takeWith: value || null
              }
            }))}
            buttons={[
              { value: '', label: 'None' },
              ...takeWithOptions
            ]}
            style={styles.segmentedButtons}
          />

          {/* Special Instructions */}
          <TextInput
            label="Special Instructions"
            value={formData.instructions.specialInstructions}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              instructions: { ...prev.instructions, specialInstructions: text }
            }))}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {/* Reminder Settings */}
          <Text style={styles.sectionLabel}>Reminder Settings</Text>
          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Enable Reminders"
              status={formData.reminders.enabled ? 'checked' : 'unchecked'}
              onPress={() => setFormData(prev => ({
                ...prev,
                reminders: { ...prev.reminders, enabled: !prev.reminders.enabled }
              }))}
            />
          </View>

          {/* Reminder Methods */}
          <Text style={styles.sectionLabel}>Communication Channels</Text>
          <View style={styles.methodsContainer}>
            <View style={styles.methodRow}>
              <Checkbox.Item
                label="Push Notification"
                status={formData.reminders.methods.includes('push') ? 'checked' : 'unchecked'}
                onPress={() => {
                  const methods = formData.reminders.methods.includes('push')
                    ? formData.reminders.methods.filter(m => m !== 'push')
                    : [...formData.reminders.methods, 'push'];
                  setFormData(prev => ({ ...prev, reminders: { ...prev.reminders, methods } }));
                }}
                style={styles.methodItem}
              />
              <Checkbox.Item
                label="SMS text"
                status={formData.reminders.methods.includes('sms') ? 'checked' : 'unchecked'}
                onPress={() => {
                  const methods = formData.reminders.methods.includes('sms')
                    ? formData.reminders.methods.filter(m => m !== 'sms')
                    : [...formData.reminders.methods, 'sms'];
                  setFormData(prev => ({ ...prev, reminders: { ...prev.reminders, methods } }));
                }}
                style={styles.methodItem}
              />
            </View>
            <View style={styles.methodRow}>
              <Checkbox.Item
                label="Email"
                status={formData.reminders.methods.includes('email') ? 'checked' : 'unchecked'}
                onPress={() => {
                  const methods = formData.reminders.methods.includes('email')
                    ? formData.reminders.methods.filter(m => m !== 'email')
                    : [...formData.reminders.methods, 'email'];
                  setFormData(prev => ({ ...prev, reminders: { ...prev.reminders, methods } }));
                }}
                style={styles.methodItem}
              />
              <Checkbox.Item
                label="Voice Call 📞"
                status={formData.reminders.methods.includes('voice') ? 'checked' : 'unchecked'}
                onPress={() => {
                  const methods = formData.reminders.methods.includes('voice')
                    ? formData.reminders.methods.filter(m => m !== 'voice')
                    : [...formData.reminders.methods, 'voice'];
                  setFormData(prev => ({ ...prev, reminders: { ...prev.reminders, methods } }));
                }}
                style={styles.methodItem}
              />
            </View>
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Notify Emergency Contacts"
              status={formData.reminders.notifyEmergencyContacts ? 'checked' : 'unchecked'}
              onPress={() => setFormData(prev => ({
                ...prev,
                reminders: {
                  ...prev.reminders,
                  notifyEmergencyContacts: !prev.reminders.notifyEmergencyContacts
                }
              }))}
            />
          </View>

          {/* Inventory Tracking */}
          <Text style={styles.sectionLabel}>Stock Tracking (Smart Refill)</Text>
          <View style={styles.row}>
            <TextInput
              label="Current Stock"
              value={formData.inventory.currentQuantity.toString()}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                inventory: { ...prev.inventory, currentQuantity: text }
              }))}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
              placeholder="e.g. 30"
            />
            <TextInput
              label="Alert Threshold"
              value={formData.inventory.lowStockThreshold.toString()}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                inventory: { ...prev.inventory, lowStockThreshold: text }
              }))}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
              placeholder="e.g. 5"
            />
          </View>
          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Enable Low Stock Alerts"
              status={formData.inventory.enabled ? 'checked' : 'unchecked'}
              onPress={() => setFormData(prev => ({
                ...prev,
                inventory: {
                  ...prev.inventory,
                  enabled: !prev.inventory.enabled
                }
              }))}
            />
          </View>

          {/* Notes */}
          <TextInput
            label="Notes (Optional)"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          {/* Drug Information Section */}
          {drugInfo && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.infoTitle}>Drug Information</Title>
              {drugInfo.sideEffects && drugInfo.sideEffects.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Common Side Effects:</Text>
                  <View style={styles.chipContainer}>
                    {drugInfo.sideEffects.slice(0, 5).map((effect, index) => (
                      <Chip key={index} mode="outlined" style={styles.infoChip}>
                        {effect}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
              {drugInfo.warnings && drugInfo.warnings.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Warnings:</Text>
                  <Text style={styles.infoText}>
                    {drugInfo.warnings[0]}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Interaction Warnings */}
          {interactions.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.warningTitle}>⚠️ Interaction Warnings</Title>
              {interactions.map((interaction, index) => (
                <Card key={index} style={styles.warningCard}>
                  <Card.Content>
                    <Text style={styles.warningDrugs}>
                      {interaction.drugs.join(' + ')}
                    </Text>
                    <Text style={styles.warningSeverity}>
                      Severity: {interaction.severity}
                    </Text>
                    <Text style={styles.warningDescription}>
                      {interaction.description}
                    </Text>
                    <Text style={styles.warningRecommendation}>
                      {interaction.recommendation}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={checkInteractions}
              style={styles.interactionButton}
              disabled={!formData.name.trim()}
            >
              Check Interactions
            </Button>
            <Button
              mode="contained"
              onPress={handleAddMedication}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
            >
              Add Medication
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Time Picker - only on native platforms */}
      {
        showTimePicker && Platform.OS !== 'web' && DateTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeSelect}
          />
        )
      }
      {
        Platform.OS === 'web' && showTimePicker && (
          <Card style={{ margin: 16 }}>
            <Card.Content>
              <TextInput
                label="Enter Time (HH:MM)"
                placeholder="14:30"
                mode="outlined"
                onChangeText={(text) => {
                  // Simple time parsing for web
                  const [hours, minutes] = text.split(':');
                  if (hours && minutes) {
                    const date = new Date();
                    date.setHours(parseInt(hours), parseInt(minutes));
                    handleTimeSelect(null, date);
                  }
                }}
              />
            </Card.Content>
          </Card>
        )
      }
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  flex1: {
    flex: 1,
  },
  searchButton: {
    marginLeft: 8,
    height: 56,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  quarterInput: {
    width: '23%',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    color: '#333',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 5,
  },
  segmentedButtons: {
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
    marginLeft: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    margin: 2,
  },
  addChip: {
    backgroundColor: '#e3f2fd',
  },
  checkboxContainer: {
    marginBottom: 4,
  },
  methodsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodItem: {
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  infoTitle: {
    fontSize: 16,
    marginBottom: 12,
    color: '#4a90e2',
  },
  infoSection: {
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  infoText: {
    color: '#666',
    fontSize: 14,
  },
  infoChip: {
    margin: 2,
    backgroundColor: '#f5f5f5',
  },
  warningTitle: {
    fontSize: 16,
    marginBottom: 12,
    color: '#ff6b6b',
  },
  warningCard: {
    marginBottom: 8,
    backgroundColor: '#fff3e0',
    borderColor: '#ffb74d',
    borderWidth: 1,
  },
  warningDrugs: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  warningSeverity: {
    color: '#ff6b6b',
    marginBottom: 4,
  },
  warningDescription: {
    color: '#666',
    marginBottom: 4,
  },
  warningRecommendation: {
    color: '#4a90e2',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  interactionButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#4a90e2',
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default AddMedication;