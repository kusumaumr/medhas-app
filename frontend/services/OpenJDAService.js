import axios from 'axios';

const BASE_URL = 'https://api.fda.gov/drug/label.json';

// OpenFDA API Service
export const searchDrugs = async (query) => {
    if (!query || query.length < 3) return [];

    try {
        // Search by brand_name, generic_name, purpose, OR indications
        // This allows users to search "Headache" and find relevant drugs
        const searchQuery = [
            `openfda.brand_name:"${query}"`,
            `openfda.generic_name:"${query}"`,
            `purpose:"${query}"`,
            `indications_and_usage:"${query}"`
        ].join('+');

        const searchUrl = `${BASE_URL}?search=${searchQuery}&limit=10`;

        const response = await axios.get(searchUrl);

        if (!response.data || !response.data.results) {
            return [];
        }

        // Transform OpenFDA data to our App's format
        return response.data.results.map(item => {
            const openfda = item.openfda || {};

            // Get best available name
            const name = (openfda.brand_name && openfda.brand_name[0]) ||
                (openfda.generic_name && openfda.generic_name[0]) ||
                'Unknown Medication';

            // Get category/purpose
            const category = (item.purpose && item.purpose[0]) ||
                (openfda.pharm_class_epc && openfda.pharm_class_epc[0]) ||
                'General Health';

            // Get Dosage info
            let dosageInfo = 'See instructions';
            if (item.dosage_and_administration) {
                // Try to find a concise part or just take the beginning
                const fullDosage = item.dosage_and_administration[0];
                if (fullDosage.length > 300) {
                    dosageInfo = fullDosage.substring(0, 300) + '...';
                } else {
                    dosageInfo = fullDosage;
                }
            }

            // Get Description/Indications
            const description = (item.indications_and_usage && item.indications_and_usage[0].substring(0, 200) + '...') ||
                'No description available.';

            return {
                id: item.set_id || Math.random().toString(),
                name: name,
                category: category.replace('EPcs', '').trim(),
                dosage: dosageInfo,
                description: description,
                source: 'OpenFDA',
                originalData: item
            };
        });

    } catch (error) {
        console.warn('OpenFDA Search Error:', error);
        return [];
    }
};
