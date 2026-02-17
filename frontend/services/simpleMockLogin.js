// SIMPLIFIED LOGIN HANDLER - MOCK AUTHENTICATION (No backend required)

export const handleSimpleLogin = async (email, password, AsyncStorage, Alert, onLogin, navigation) => {
    console.log('🎯 [SIMPLE LOGIN] Starting mock authentication...');

    // Simple validation
    if (!email || !password) {
        Alert.alert('Error', 'Please enter email and password');
        return false;
    }

    if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return false;
    }

    try {
        // Mock authentication - no backend needed!
        console.log('✅ Mock authentication successful!');

        // Create mock token
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6InVzZXJAZW1haWwuY29tIiwibmFtZSI6Imt1c3VtYSBrYWRpbWlzZXR0eSIsImlhdCI6MTczODY2MDAwMH0.mock' + Date.now();

        const userData = {
            email: email.trim(),
            name: 'Kusuma Kadimisetty',
            userId: 'user-' + Date.now()
        };

        // Save to storage
        await AsyncStorage.setItem('token', mockToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        console.log('✅ Login data saved to storage');

        // Show success
        Alert.alert('Success', `Welcome ${userData.name}!`);

        // Navigate
        if (onLogin && typeof onLogin === 'function') {
            console.log('📞 Calling onLogin callback...');
            onLogin();
        }

        // Emergency fallback navigation
        setTimeout(() => {
            if (navigation && navigation.reset) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }
        }, 500);

        return true;

    } catch (error) {
        console.error('❌ Login error:', error);
        Alert.alert('Error', 'Login failed: ' + error.message);
        return false;
    }
};
