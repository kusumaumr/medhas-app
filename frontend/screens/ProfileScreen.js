import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

const ProfileScreen = ({ handleLogout }) => {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Profile</Text>
            <Text style={styles.text}>User profile details will appear here.</Text>
            <Button mode="contained" onPress={handleLogout} style={styles.button}>
                Logout
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        marginVertical: 20,
        textAlign: 'center',
    },
    button: {
        marginTop: 10,
    },
});

export default ProfileScreen;
