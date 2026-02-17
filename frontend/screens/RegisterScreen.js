import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  ActivityIndicator,
  RadioButton,
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
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: new Date(1990, 0, 1),
    gender: '',
    bloodGroup: '',
    language: 'en',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    console.log('🖱️ [WEB DEBUG] Create Account button CLICKED');
    console.log('📝 [WEB DEBUG] Form Data:', JSON.stringify(formData));

    if (!validateForm()) {
      console.log('⚠️ [WEB DEBUG] Validation failed:', errors);
      return;
    }

    console.log('🚀 [WEB DEBUG] Validation passed, starting API call...');
    setIsLoading(true);
    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth.toISOString(),
        gender: formData.gender || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        language: formData.language,
      };

      console.log('📡 [WEB DEBUG] Sending payload:', JSON.stringify(userData));

      const response = await authAPI.register(userData);
      console.log('✅ [WEB DEBUG] API Response:', JSON.stringify(response));

      if (response.success) {
        // Store token and user data
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('💾 [WEB DEBUG] Token saved');

        // Show success message and navigate
        // Show success message and navigate
        if (Platform.OS === 'web') {
          // For Web: Immediate navigation, no blocking alert
          console.log('✅ Account Created. Navigating...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } else {
          // For Mobile: Native Alert with callback
          Alert.alert(
            'Account Created Successfully',
            'Your account has been created! Please login to continue.',
            [
              {
                text: 'Login Now',
                onPress: () => {
                  navigation.navigate('Login');
                },
              },
            ]
          );
        }
      } else {
        console.error('❌ [WEB DEBUG] Registration failed:', response.message);
        Alert.alert('Registration Failed', response.message);
      }
    } catch (error) {
      console.error('❌ [WEB DEBUG] Registration error:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred during registration. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, dateOfBirth: selectedDate });
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Create Account</Title>

            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              mode="outlined"
              error={!!errors.name}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={!!errors.email}
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                if (errors.phone) setErrors({ ...errors, phone: null });
              }}
              mode="outlined"
              keyboardType="phone-pad"
              error={!!errors.phone}
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            {/* Date of Birth Picker Logic */}
            <View style={styles.row}>
              <TextInput
                label="Date of Birth"
                value={formatDate(formData.dateOfBirth)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                editable={false} // Always read-only, used only for display
                left={<TextInput.Icon icon="calendar" />}
              />
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                Select
              </Button>
            </View>

            {/* Input change handler to clear errors */}
            {/* Note: Other inputs updated below to clear errors on change */}

            {/* Platform specific Date Picker Handling */}
            {showDatePicker && (
              Platform.OS === 'web' ? (
                /* Web fallback: Simple date input for stability */
                <View style={styles.webDateContainer}>
                  <Text style={{ marginBottom: 5, color: '#666' }}>Enter Date (YYYY-MM-DD):</Text>
                  <input
                    type="date"
                    value={formData.dateOfBirth.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        setFormData({ ...formData, dateOfBirth: date });
                        setShowDatePicker(false); // Close after selection
                      }
                    }}
                    style={{
                      padding: 10,
                      borderRadius: 4,
                      border: '1px solid #ccc',
                      width: '100%',
                      fontSize: 16
                    }}
                  />
                  <Button onPress={() => setShowDatePicker(false)} compact style={{ marginTop: 5 }}>Close</Button>
                </View>
              ) : (
                /* Native DatePicker */
                DateTimePicker && (
                  <DateTimePicker
                    value={formData.dateOfBirth}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )
              )
            )}

            <Text style={styles.sectionTitle}>Gender</Text>
            <RadioButton.Group
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
              value={formData.gender}
            >
              <View style={styles.radioContainer}>
                <RadioButton.Item label="Male" value="male" />
                <RadioButton.Item label="Female" value="female" />
                <RadioButton.Item label="Other" value="other" />
                <RadioButton.Item label="Prefer not to say" value="prefer-not-to-say" />
              </View>
            </RadioButton.Group>

            <Text style={styles.sectionTitle}>Blood Group</Text>
            <View style={styles.bloodGroupContainer}>
              {bloodGroups.map((group) => (
                <Button
                  key={group}
                  mode={formData.bloodGroup === group ? 'contained' : 'outlined'}
                  onPress={() => setFormData({ ...formData, bloodGroup: group })}
                  style={styles.bloodGroupButton}
                  compact
                >
                  {group}
                </Button>
              ))}
            </View>

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => {
                setFormData({ ...formData, password: text });
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              error={!!errors.password}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, confirmPassword: text });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              error={!!errors.confirmPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <Button
              mode="contained"
              onPress={() => {
                if (!isLoading) {
                  handleRegister();
                }
              }}
              style={styles.registerButton}
              loading={isLoading}
              disabled={isLoading}
              testID="create-account-button"
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              Already have an account? Login
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center', // Center content if it's short
  },
  card: {
    elevation: 4,
    borderRadius: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  dateButton: {
    height: 56,
    justifyContent: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  bloodGroupButton: {
    margin: 2,
  },
  registerButton: {
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 5,
  },
  backButton: {
    marginBottom: 20,
  },
  termsContainer: {
    marginTop: 20,
    padding: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  webDateContainer: {
    marginBottom: 15,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default RegisterScreen;