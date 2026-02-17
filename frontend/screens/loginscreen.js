import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  Paragraph,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleSimpleLogin } from '../services/simpleMockLogin';
import { authAPI } from '../services/api';

import { useLanguage } from '../services/LanguageContext';

const LoginScreen = ({ navigation, onLogin }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('kusumaumr@gmail.com');
  const [password, setPassword] = useState(''); // Add your password here
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  const validateForm = () => {
    console.log('🔍 [WEB DEBUG] validateForm called');
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    console.log('🔍 [WEB DEBUG] Validation result:', Object.keys(newErrors).length === 0 ? 'PASSED' : 'FAILED', newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // DIRECT LOGIN FUNCTION
  const handleLogin = async () => {
    setLoginError(''); // Clear previous errors
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔒 [AUTH] Attempting login for:', email);

      const response = await authAPI.login({
        email: email.trim(),
        password: password
      });

      console.log('🔒 [AUTH] Response:', response);

      if (response.success) {
        // Success Path
        const token = response.data?.token || response.token;
        const userData = response.data?.user || response.user || { email, name: 'User' };

        if (token) {
          try {
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            console.log('✅ [AUTH] Login successful, token saved');

            if (onLogin && typeof onLogin === 'function') {
              onLogin();
            } else {
              // Fallback navigation if onLogin is not provided
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          } catch (storageError) {
            console.error('❌ Error saving to AsyncStorage:', storageError);
            setLoginError('Failed to save login data. Please try again.');
          }
        } else {
          setLoginError('Token not found in server response.');
        }
      } else {
        // Handle API errors
        setLoginError(response.message || 'Login failed. Please check your credentials.');
      }

    } catch (error) {
      console.error('❌ NETWORK ERROR:', error);
      setLoginError(`Cannot connect to server. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // TEST LOGIN WITH HARDCODED TOKEN
  const handleTestLogin = async () => {
    console.log('🧪 [WEB DEBUG] ===== TEST LOGIN CALLED =====');
    console.log('🧪 === TEST LOGIN STARTED ===');

    // Use the token from your screenshot
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTgxYTFkZGY1NTBmMjQyZTdkZjZmNmEiLCJlbWFpbCI6Imt1c3VtYXVtckBnbWFpbC5jb20iLCJuYW1lIjoia3VzdW1hIGthZGltaXNldHR5IiwiaWF0IjoxNzcwMTAzMzE1LCJleHAiOjE3NzA3MDgxMTV9.GyEfW6MUd9nbfR9YkWjcsK3XNQRmBO4DSyD8nNf7JZ8';

    try {
      console.log('💾 Saving test token...');
      await AsyncStorage.setItem('token', testToken);
      await AsyncStorage.setItem('user', JSON.stringify({
        email: 'kusumaumr@gmail.com',
        name: 'kusuma kadimisetty'
      }));

      console.log('✅ Test token saved');

      // Verify
      const savedToken = await AsyncStorage.getItem('token');
      console.log('🔍 Token verified:', savedToken ? '✅ YES' : '❌ NO');

      if (onLogin && typeof onLogin === 'function') {
        console.log('📞 Calling onLogin...');
        onLogin();

        Alert.alert(
          'Test Successful',
          'Hardcoded token saved. App should navigate to home screen now.'
        );
      } else {
        console.log('❌ onLogin is not available');
        Alert.alert('Test Failed', 'onLogin function not available');
      }

    } catch (error) {
      console.error('❌ Test error:', error);
    }
  };

  // DEBUG: Check AsyncStorage
  const debugCheckStorage = async () => {
    console.log('🔍 Checking AsyncStorage...');
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');

      console.log('Token:', token ? `✅ Exists (${token.substring(0, 20)}...)` : '❌ Missing');
      console.log('User:', user ? `✅ Exists (${user.substring(0, 50)}...)` : '❌ Missing');

      Alert.alert(
        'Storage Check',
        `Token: ${token ? '✅ EXISTS' : '❌ MISSING'}\n\n` +
        `User: ${user ? '✅ EXISTS' : '❌ MISSING'}\n\n` +
        `${token ? `Token preview: ${token.substring(0, 30)}...` : ''}`
      );

    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // Clear storage
  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      setEmail(''); // Reset local state
      setPassword(''); // Reset local state
      setErrors({}); // Clear errors
      console.log('🧹 Storage and state cleared');
      Alert.alert('Success', 'All local data and input fields have been cleared.');
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>💊</Text>
          <Title style={styles.title}>Intelligent Medication Adherence Health Safety System</Title>
          <Paragraph style={styles.subtitle}>
            {t('mediSafeTagline')}
          </Paragraph>
        </View>

        <Card style={styles.card} elevation={5}>
          <Card.Content>
            <Title style={styles.cardTitle}>{t('loginToAccount')}</Title>

            {/* Global Login Error */}
            {loginError ? (
              <Text style={{ color: '#d32f2f', textAlign: 'center', marginBottom: 10, fontWeight: 'bold' }}>
                {loginError}
              </Text>
            ) : null}

            {/* Email Input */}
            <TextInput
              label={t('email')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
                if (loginError) setLoginError('');
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={!!errors.email}
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              disabled={isLoading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            {/* Password Input */}
            <TextInput
              label={t('password')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
                if (loginError) setLoginError('');
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
              disabled={isLoading}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Main Login Button */}
            <Button
              mode="contained"
              onPress={() => {
                console.log('🖱️ [WEB DEBUG] Login button CLICKED');
                handleLogin();
              }}
              style={styles.loginButton}
              loading={isLoading}
              disabled={isLoading}
              icon="login"
              accessibilityLabel="Login to your account"
              accessibilityRole="button"
            >
              {isLoading ? t('loggingIn') : t('login')}
            </Button>

            {/* Clear Storage Button */}
            <Button
              mode="outlined"
              onPress={clearStorage}
              style={[styles.clearButton, { borderColor: '#f44336' }]}
              icon="delete"
              compact
              accessibilityLabel="Clear all stored data"
              accessibilityRole="button"
            >
              {t('clearAllData')}
            </Button>

            <Button
              mode="text"
              onPress={handleForgotPassword}
              style={styles.forgotButton}
              accessibilityLabel="Forgot password help"
              accessibilityRole="button"
            >
              {t('forgotPassword')}
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              onPress={() => {
                console.log('🖱️ [WEB DEBUG] Register button CLICKED');
                navigation.navigate('Register');
              }}
              style={styles.registerButton}
              icon="account-plus"
              accessibilityLabel="Create new account"
              accessibilityRole="button"
            >
              {t('createAccount')}
            </Button>
          </Card.Content>
        </Card>


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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 70,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    borderRadius: 15,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
    fontSize: 22,
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  loginButton: {
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 8,
    backgroundColor: '#4a90e2',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
    }),
  },
  clearButton: {
    marginBottom: 10,
    borderColor: '#f44336',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
    }),
  },
  forgotButton: {
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
    }),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontWeight: '600',
  },
  registerButton: {
    marginBottom: 20,
    borderColor: '#4a90e2',
    borderWidth: 1.5,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
    }),
  },
  instructionsCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#bbdefb',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
  },
  instructionsTitle: {
    fontSize: 16,
    color: '#1976d2',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 12,
    color: '#424242',
    lineHeight: 18,
  },
});

export default LoginScreen;