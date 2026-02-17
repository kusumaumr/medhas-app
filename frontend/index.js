import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

console.log('====================================');
console.log('🚀 MediSafe App Starting...');
console.log('Platform:', Platform.OS);
console.log('Environment:', process.env.NODE_ENV);
console.log('====================================');

try {
    console.log('📱 Registering root component...');

    // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
    // It also ensures that whether you load the app in Expo Go or in a native build,
    // the environment is set up appropriately
    registerRootComponent(App);

    console.log('✅ Root component registered successfully');

    if (Platform.OS === 'web') {
        console.log('🌐 Running on WEB platform');
        console.log('🔍 Check this console for any errors or warnings');
        console.log('💡 If you see a white page, check for errors below');
    }
} catch (error) {
    console.error('❌ CRITICAL ERROR during app registration:');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    // Display error on page for web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.body.innerHTML = `
            <div style="padding: 40px; max-width: 800px; margin: 0 auto; font-family: system-ui;">
                <h1 style="color: #ef4444; font-size: 28px; margin-bottom: 16px;">
                    ⚠️ App Registration Error
                </h1>
                <p style="color: #6b7280; margin-bottom: 24px;">
                    The app failed to register properly. This is a critical error.
                </p>
                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <strong style="color: #991b1b;">Error:</strong>
                    <pre style="color: #dc2626; font-size: 14px; white-space: pre-wrap; margin-top: 8px;">${error.toString()}</pre>
                </div>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
                    <pre style="font-size: 11px; color: #4b5563; white-space: pre-wrap; line-height: 16px;">${error.stack}</pre>
                </div>
                <button 
                    onclick="window.location.reload()" 
                    style="background: #4a90e2; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin-top: 16px; cursor: pointer;"
                >
                    🔄 Reload Page
                </button>
            </div>
        `;
    }

    throw error;
}
