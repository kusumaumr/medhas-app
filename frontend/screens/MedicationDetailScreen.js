import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const MedicationDetailScreen = ({ route }) => {
    const { medication } = route.params || {};

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Medication Details</Text>
            <Text style={styles.text}>
                {medication ? JSON.stringify(medication, null, 2) : 'No details available'}
            </Text>
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
        marginTop: 20,
        textAlign: 'center',
    },
});

export default MedicationDetailScreen;
