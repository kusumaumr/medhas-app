import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
        console.log('🛡️ ErrorBoundary initialized');
    }

    static getDerivedStateFromError(error) {
        console.error('🔴 ErrorBoundary caught error:', error);
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        const platform = Platform.OS;
        console.error('❌ CRITICAL ERROR CAUGHT BY ERROR BOUNDARY');
        console.error('Platform:', platform);
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Error Stack:', error.stack);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    handleReload = () => {
        if (Platform.OS === 'web') {
            window.location.reload();
        } else {
            // Reset error state for native
            this.setState({ hasError: false, error: null, errorInfo: null });
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <ScrollView style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.title}>⚠️ Application Error</Text>
                        <Text style={styles.subtitle}>
                            The app encountered an error and couldn't render properly.
                        </Text>

                        <View style={styles.errorBox}>
                            <Text style={styles.errorLabel}>Error Message:</Text>
                            <Text style={styles.errorText}>
                                {this.state.error && this.state.error.toString()}
                            </Text>
                        </View>

                        {this.state.error && this.state.error.stack && (
                            <View style={styles.stackBox}>
                                <Text style={styles.stackLabel}>Error Stack:</Text>
                                <Text style={styles.stack}>
                                    {this.state.error.stack}
                                </Text>
                            </View>
                        )}

                        {this.state.errorInfo && (
                            <View style={styles.stackBox}>
                                <Text style={styles.stackLabel}>Component Stack:</Text>
                                <Text style={styles.stack}>
                                    {this.state.errorInfo.componentStack}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.reloadButton}
                            onPress={this.handleReload}
                        >
                            <Text style={styles.reloadButtonText}>
                                {Platform.OS === 'web' ? '🔄 Reload Page' : '🔄 Try Again'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.helpBox}>
                            <Text style={styles.helpText}>
                                💡 Open browser Developer Tools (F12) and check the Console tab for more details
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    content: {
        padding: 40,
        maxWidth: 800,
        alignSelf: 'center',
        paddingTop: 60
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 8,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 24
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        borderWidth: 1,
        padding: 16,
        borderRadius: 8,
        marginBottom: 16
    },
    errorLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#991b1b',
        marginBottom: 8
    },
    errorText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#dc2626',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier'
    },
    stackBox: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        maxHeight: 200
    },
    stackLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8
    },
    stack: {
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
        fontSize: 11,
        color: '#4b5563',
        lineHeight: 16
    },
    reloadButton: {
        backgroundColor: '#4a90e2',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 16,
        alignItems: 'center'
    },
    reloadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    helpBox: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        borderWidth: 1,
        padding: 16,
        borderRadius: 8,
        marginTop: 8
    },
    helpText: {
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 20
    }
});

export default ErrorBoundary;
