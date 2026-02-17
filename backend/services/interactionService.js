const medicationInteractions = [
    // Diabetes Interactions (Metformin key focus as per user request)
    {
        drugs: ['Metformin', 'Prednisone'],
        severity: 'high',
        description: 'Prednisone can significantly increase blood sugar levels, reducing the effect of Metformin.',
        recommendation: 'Monitor blood sugar closely. Dosage adjustment may be needed.'
    },
    {
        drugs: ['Metformin', 'Furosemide'],
        severity: 'medium',
        description: 'Furosemide may increase blood levels of Metformin, increasing risk of lactic acidosis.',
        recommendation: 'Monitor for signs of lactic acidosis.'
    },
    {
        drugs: ['Insulin', 'Aspirin'],
        severity: 'medium',
        description: 'Large doses of Aspirin may increase the hypoglycemic effect of Insulin.',
        recommendation: 'Monitor blood glucose.'
    },

    // Blood Pressure / Heart Interactions
    {
        drugs: ['Lisinopril', 'Ibuprofen'],
        severity: 'medium',
        description: 'NSAIDs like Ibuprofen may diminish the antihypertensive effect of Lisinopril and damage kidneys.',
        recommendation: 'Avoid chronic use. Monitor blood pressure and kidney function.'
    },
    {
        drugs: ['Lisinopril', 'Potassium'],
        severity: 'high',
        description: 'Taking Potassium supplements with Lisinopril can lead to dangerous hyperkalemia.',
        recommendation: 'Avoid potassium supplements unless prescribed.'
    },
    {
        drugs: ['Atorvastatin', 'Clarithromycin'],
        severity: 'high',
        description: 'Clarithromycin increases Atorvastatin levels, raising risk of muscle damage.',
        recommendation: 'Avoid combination or temporarily stop Atorvastatin.'
    },

    // Common Painkiller Interactions
    {
        drugs: ['Aspirin', 'Ibuprofen'],
        severity: 'medium',
        description: 'Ibuprofen may interfere with the anti-platelet effect of low-dose Aspirin.',
        recommendation: 'Take Aspirin at least 30 mins before or 8 hours after Ibuprofen.'
    },
    {
        drugs: ['Aspirin', 'Warfarin'],
        severity: 'critical',
        description: 'Significantly increased risk of bleeding.',
        recommendation: 'Avoid unless strictly monitored by specialist.'
    }
];

class InteractionService {
    /**
     * Check for interactions between a new drug and existing drugs
     * @param {string} newDrugName - The name of the drug being added
     * @param {Array} existingMedications - List of current medication objects
     * @returns {Array} List of detected interactions
     */
    checkInteraction(newDrugName, existingMedications) {
        const interactions = [];
        const normalizedNewDrug = newDrugName.toLowerCase();

        existingMedications.forEach(existingMed => {
            const normalizedExistingDrug = existingMed.name.toLowerCase();

            // Check our static database
            const match = medicationInteractions.find(interaction => {
                const drug1 = interaction.drugs[0].toLowerCase();
                const drug2 = interaction.drugs[1].toLowerCase();

                // Check if the pair matches (order doesn't matter)
                return (drug1 === normalizedNewDrug && drug2 === normalizedExistingDrug) ||
                    (drug1 === normalizedExistingDrug && drug2 === normalizedNewDrug);
            });

            if (match) {
                interactions.push({
                    withMedication: existingMed.name,
                    severity: match.severity,
                    description: match.description,
                    recommendation: match.recommendation,
                    confirmed: true,
                    source: 'MediSafe Database'
                });
            }
        });

        return interactions;
    }
}

module.exports = new InteractionService();
