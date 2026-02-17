import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    Card,
    Title,
    Paragraph,
    HelperText,
} from 'react-native-paper';
import { useLanguage } from '../services/LanguageContext';

const ForgotPasswordScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const API_URL = 'http://localhost:5000/api/auth';

    const validateEmail = () => {
        if (!email.trim()) {
            setErrors({ email: 'Email is required' });
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setErrors({ email: 'Email is invalid' });
            return false;
        }
        setErrors({});
        return true;
    };

    const validateReset = () => {
        const newErrors = {};
        if (!otp.trim() || otp.length !== 6) {
            newErrors.otp = 'Enter a valid 6-digit OTP';
        }
        if (!newPassword || newPassword.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRequestOTP = async () => {
        if (!validateEmail()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', data.message);
                setStep(2);
            } else {
                Alert.alert('Error', data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Request OTP error:', error);
            Alert.alert('Error', 'Network error. check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!validateReset()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    otp: otp.trim(),
                    newPassword: newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Platform-specific handling for better web compatibility
                if (Platform.OS === 'web') {
                    // For web, navigate immediately without blocking alert
                    navigation.navigate('Login');
                } else {
                    // For native, use Alert with callback
                    Alert.alert(
                        'Success',
                        'Password reset successfully. Please login with your new password.',
                        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                    );
                }
            } else {
                Alert.alert('Error', data.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            Alert.alert('Error', 'Network error. check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>🔐</Text>
                    <Title style={styles.title}>
                        {step === 1 ? 'Forgot Password' : 'Reset Password'}
                    </Title>
                    <Paragraph style={styles.subtitle}>
                        {step === 1
                            ? 'Enter your email to receive a One-Time Password (OTP).'
                            : 'Enter the OTP sent to your email and your new password.'}
                    </Paragraph>
                </View>

                <Card style={styles.card}>
                    <Card.Content>
                        {step === 1 ? (
                            // Step 1: Request OTP
                            <View>
                                <TextInput
                                    label="Email Address"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setErrors({ ...errors, email: null });
                                    }}
                                    mode="outlined"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={!!errors.email}
                                    style={styles.input}
                                    left={<TextInput.Icon icon="email" />}
                                    placeholder="kusumaumr@gmail.com"
                                />
                                <HelperText type="error" visible={!!errors.email}>
                                    {errors.email}
                                </HelperText>

                                <Button
                                    mode="contained"
                                    onPress={handleRequestOTP}
                                    loading={isLoading}
                                    disabled={isLoading}
                                    style={styles.button}
                                >
                                    Send OTP
                                </Button>
                            </View>
                        ) : (
                            // Step 2: Reset Password
                            <View>
                                <TextInput
                                    label="OTP (6 digits)"
                                    value={otp}
                                    onChangeText={(text) => {
                                        setOtp(text);
                                        setErrors({ ...errors, otp: null });
                                    }}
                                    mode="outlined"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    error={!!errors.otp}
                                    style={styles.input}
                                    left={<TextInput.Icon icon="message-processing" />}
                                />
                                <HelperText type="error" visible={!!errors.otp}>
                                    {errors.otp}
                                </HelperText>

                                <TextInput
                                    label="New Password"
                                    value={newPassword}
                                    onChangeText={(text) => {
                                        setNewPassword(text);
                                        setErrors({ ...errors, password: null });
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
                                <HelperText type="error" visible={!!errors.password}>
                                    {errors.password}
                                </HelperText>

                                <TextInput
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        setErrors({ ...errors, confirmPassword: null });
                                    }}
                                    mode="outlined"
                                    secureTextEntry={!showPassword}
                                    error={!!errors.confirmPassword}
                                    style={styles.input}
                                    left={<TextInput.Icon icon="lock-check" />}
                                />
                                <HelperText type="error" visible={!!errors.confirmPassword}>
                                    {errors.confirmPassword}
                                </HelperText>

                                <Button
                                    mode="contained"
                                    onPress={handleResetPassword}
                                    loading={isLoading}
                                    disabled={isLoading}
                                    style={styles.button}
                                >
                                    Reset Password
                                </Button>

                                <Button
                                    mode="text"
                                    onPress={() => setStep(1)}
                                    disabled={isLoading}
                                    style={styles.textButton}
                                >
                                    Resend OTP
                                </Button>
                            </View>
                        )}

                        <Button
                            mode="outlined"
                            onPress={() => navigation.navigate('Login')}
                            disabled={isLoading}
                            style={styles.backButton}
                            icon="arrow-left"
                        >
                            Back to Login
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
        fontSize: 50,
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
        paddingHorizontal: 20,
    },
    card: {
        borderRadius: 15,
        marginBottom: 20,
        backgroundColor: 'white',
        elevation: 4,
    },
    input: {
        marginBottom: 5,
        backgroundColor: 'white',
    },
    button: {
        marginTop: 15,
        paddingVertical: 6,
        backgroundColor: '#4a90e2',
    },
    backButton: {
        marginTop: 15,
        borderColor: '#4a90e2',
    },
    textButton: {
        marginTop: 5,
    },
});

export default ForgotPasswordScreen;
