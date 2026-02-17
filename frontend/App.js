import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, Alert } from 'react-native';

// Import screens
import LoginScreen from './screens/loginscreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/homescreen';
import AddMedication from './screens/AddMedication';
import MedicationDetailScreen from './screens/MedicationDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import DashboardScreen from './screens/DashboardScreen';
import VideoConsultationScreen from './screens/VideoConsultationScreen';
import LockScreen from './components/LockScreen';
import ErrorBoundary from './ErrorBoundary';
import { Platform } from 'react-native';
import { LanguageProvider } from './services/LanguageContext';
import { isPasscodeSet } from './services/SecurityService';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for authenticated users
function MainTabs({ handleLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a90e2',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Intelligent Medication Adherence Health Safety System' }}
      />
      <Tab.Screen
        name="Add"
        component={AddMedication}
        options={{ title: 'Add Medication' }}
      />
      <Tab.Screen
        name="Profile"
      >
        {props => <ProfileScreen {...props} handleLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Web-specific startup logging
  if (Platform.OS === 'web') {
    console.log('🌐 App.js loaded on WEB platform');
  }

  useEffect(() => {
    console.log('🚀 App mounted - Starting authentication check...');
    if (Platform.OS === 'web') {
      console.log('💡 WEB: If you see this but still have a white page, check for rendering errors below');

      // Check for ?clear=true or ?logout=true URL parameter
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('clear') === 'true' || urlParams.get('logout') === 'true') {
          console.log('🧹 URL parameter detected - Clearing storage...');
          AsyncStorage.clear().then(() => {
            console.log('✅ Storage cleared - Redirecting to clean URL...');
            // Redirect to clean URL without parameters
            window.location.href = window.location.origin + window.location.pathname;
          });
          return; // Don't check auth status yet
        }
      }
    }
    checkAuthStatus();
  }, []);

  // Log when authentication state changes
  useEffect(() => {
    console.log('🔄 Authentication state changed:', isAuthenticated);
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    console.log('🔍 Checking authentication status...');

    // FOR TESTING: On Web, always force login (ignore stored token)
    if (Platform.OS === 'web') {
      console.log('🌐 Web Platform detected - Forcing Login for Testing');
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');

      console.log('📦 Token from storage:', token ? `✅ Found (${token.substring(0, 20)}...)` : '❌ Not found');
      console.log('👤 User data:', user ? '✅ Found' : '❌ Not found');

      const hasToken = !!token;
      console.log(`🔐 Setting isAuthenticated to: ${hasToken}`);
      setIsAuthenticated(hasToken);

      // Check if passcode is set
      if (hasToken) {
        const hasPasscode = await isPasscodeSet();
        console.log('🔒 Passcode is set:', hasPasscode);
        setIsLocked(hasPasscode);
      }


    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      Alert.alert('Error', 'Failed to check authentication status');
    } finally {
      console.log('✅ Auth check complete');
      setIsLoading(false);
    }
  };

  const handleUnlock = () => {
    console.log('🔓 App unlocked');
    setIsLocked(false);
  };

  const handleLogin = async () => {
    console.log('🔄 handleLogin called from LoginScreen');

    try {
      // Immediately check for token
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 Token in handleLogin:', token ? '✅ Exists' : '❌ Missing');

      if (token) {
        console.log('✅ Setting isAuthenticated to TRUE');
        setIsAuthenticated(true);

        // Verify the change
        setTimeout(() => {
          console.log('✅ After state update, isAuthenticated should be true');
        }, 100);
      } else {
        console.log('⚠️ No token found, will retry in 500ms');

        // Retry mechanism
        const maxRetries = 5;
        let retryCount = 0;

        const retryCheck = setInterval(async () => {
          retryCount++;
          const newToken = await AsyncStorage.getItem('token');

          if (newToken) {
            console.log(`✅ Found token on retry #${retryCount}`);
            setIsAuthenticated(true);
            clearInterval(retryCheck);
          } else if (retryCount >= maxRetries) {
            console.log(`❌ No token found after ${maxRetries} retries`);
            clearInterval(retryCheck);
            Alert.alert(
              'Login Issue',
              'Token not saved properly. Please try again.'
            );
          }
        }, 500);
      }

    } catch (error) {
      console.error('❌ Error in handleLogin:', error);
    }
  };

  const handleLogout = async () => {
    console.log('👋 Logging out...');
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('✅ Storage cleared');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  // Debug function to check current state
  const debugAppState = async () => {
    const token = await AsyncStorage.getItem('token');
    console.log('=== DEBUG APP STATE ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('Token exists:', !!token);
    console.log('Token value:', token);
    console.log('=====================');
  };

  // Call debug on mount
  useEffect(() => {
    debugAppState();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider>
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={{
              marginTop: 20,
              fontSize: 18,
              color: '#333',
              fontWeight: '500'
            }}>
              Loading MediSafe...
            </Text>
            <Text style={{
              marginTop: 10,
              fontSize: 14,
              color: '#666'
            }}>
              Checking your authentication
            </Text>
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  console.log('🎨 Rendering App. isAuthenticated:', isAuthenticated);
  if (Platform.OS === 'web') {
    console.log('🌐 WEB: About to render', isAuthenticated ? 'DashboardScreen' : 'LoginScreen');
  }



  try {
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <PaperProvider>
              <StatusBar style="auto" />
              <NavigationContainer
                linking={{
                  prefixes: ['medhas://', 'https://medhas.com'],
                  config: {
                    screens: {
                      Login: 'login',
                      Register: 'register',
                      MainTabs: {
                        screens: {
                          Home: 'home',
                          Add: 'add',
                          Profile: 'profile',
                          Settings: 'settings',
                        },
                      },
                      MedicationDetail: 'medication/:id',
                    },
                  },
                }}
              >
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  {!isAuthenticated ? (
                    // Auth screens - shown when NOT authenticated
                    <>
                      <Stack.Screen
                        name="Login"
                        options={{ headerShown: false }}
                      >
                        {props => <LoginScreen {...props} onLogin={handleLogin} />}
                      </Stack.Screen>
                      <Stack.Screen
                        name="Register"
                        component={RegisterScreen}
                        options={{
                          title: 'Create Account',
                          headerBackTitle: 'Login'
                        }}
                      />
                      <Stack.Screen
                        name="ForgotPassword"
                        component={ForgotPasswordScreen}
                        options={{
                          title: 'Reset Password',
                          headerBackTitle: 'Login'
                        }}
                      />
                    </>
                  ) : (
                    // Authenticated screens - shown when authenticated
                    <>
                      <Stack.Screen
                        name="MainTabs"
                        options={{ headerShown: false }}
                      >
                        {() => Platform.OS === 'web' ? <DashboardScreen /> : <MainTabs handleLogout={handleLogout} />}
                      </Stack.Screen>

                      {/* Modal screens */}
                      <Stack.Group screenOptions={{ presentation: 'modal' }}>

                        <Stack.Screen
                          name="MedicationDetail"
                          component={MedicationDetailScreen}
                          options={{ title: 'Medication Details' }}
                        />
                        <Stack.Screen
                          name="VideoConsultation"
                          component={VideoConsultationScreen}
                          options={{ title: 'Video Consultation', headerShown: false }}
                        />
                      </Stack.Group>
                    </>
                  )}
                </Stack.Navigator>
              </NavigationContainer>

              {/* Lock Screen Overlay */}
              {isAuthenticated && isLocked && (
                <LockScreen visible={true} onUnlock={handleUnlock} />
              )}
            </PaperProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  } catch (renderError) {
    console.error('❌ RENDER ERROR in App.js:', renderError);
    console.error('Stack:', renderError.stack);

    // Fallback UI for web
    if (Platform.OS === 'web') {
      return (
        <View style={{ flex: 1, padding: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, color: '#ef4444', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>⚠️ Render Error</Text>
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 24, textAlign: 'center' }}>The app encountered an error while rendering.</Text>
          <Text style={{ fontSize: 14, color: '#dc2626', fontFamily: 'monospace', marginBottom: 16 }}>{renderError.toString()}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Check the browser console (F12) for more details</Text>
        </View>
      );
    }
    throw renderError;
  }
}