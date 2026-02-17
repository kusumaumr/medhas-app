/**
 * Smart Dosage Calculator Utility
 * Matches medicine names and returns age/gender-appropriate recommendations.
 */

import { DOSAGE_RULES, getAllMedicineNames } from '../data/dosageRules';

/**
 * Normalize string for fuzzy matching
 */
const normalize = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

/**
 * Simple fuzzy match - checks if query is contained in or similar to target
 */
const fuzzyMatch = (query, target) => {
    const normQuery = normalize(query);
    const normTarget = normalize(target);

    // Exact match
    if (normQuery === normTarget) return { match: true, score: 100 };

    // Starts with match (giving high score)
    if (normTarget.startsWith(normQuery)) {
        return { match: true, score: 90 };
    }

    // Contains match
    if (normTarget.includes(normQuery) || normQuery.includes(normTarget)) {
        return { match: true, score: 80 };
    }
    // Levenshtein distance for typo tolerance (simplified)
    const distance = levenshteinDistance(normQuery, normTarget);
    const maxLen = Math.max(normQuery.length, normTarget.length);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    if (similarity >= 65) { // Slightly lower threshold for better tolerance
        return { match: true, score: similarity };
    }

    return { match: false, score: 0 };
};

/**
 * Levenshtein distance calculation
 */
const levenshteinDistance = (a, b) => {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

/**
 * Find the medication key that best matches the query
 * @param {string} query - User-entered medicine name
 * @returns {object|null} - { key, medicineData, matchedName, score } or null
 */
export const findMedicine = (query) => {
    if (!query || query.length < 2) return null;

    let bestMatch = null;

    for (const [key, data] of Object.entries(DOSAGE_RULES)) {
        // Check main key
        const keyMatch = fuzzyMatch(query, key);
        if (keyMatch.match && (!bestMatch || keyMatch.score > bestMatch.score)) {
            bestMatch = { key, medicineData: data, matchedName: key, score: keyMatch.score };
        }

        // Check generic names
        if (data.genericNames) {
            for (const name of data.genericNames) {
                const nameMatch = fuzzyMatch(query, name);
                if (nameMatch.match && (!bestMatch || nameMatch.score > bestMatch.score)) {
                    bestMatch = { key, medicineData: data, matchedName: name, score: nameMatch.score };
                }
            }
        }
    }

    return bestMatch;
};

/**
 * Get dosage recommendation for a specific medicine, age, and gender
 * @param {string} medicineName - Medicine name to look up
 * @param {number} age - Patient age in years
 * @param {string} gender - Patient gender ('male', 'female', 'other')
 * @returns {object} - Recommendation result
 */
export const getDosageRecommendation = (medicineName, age, gender = 'other') => {
    const result = {
        found: false,
        medicineName: medicineName,
        category: null,
        recommendation: null,
        disclaimer: "⚠️ This is for demonstration only. Always consult a healthcare professional."
    };

    // Validate inputs
    if (!medicineName || medicineName.trim().length < 2) {
        result.error = "Please enter a valid medicine name.";
        return result;
    }

    const numAge = parseInt(age);
    if (isNaN(numAge) || numAge < 0 || numAge > 150) {
        result.error = "Please enter a valid age (0-150).";
        return result;
    }

    // Find medicine
    const medicine = findMedicine(medicineName);
    if (!medicine) {
        result.error = `No dosage information found for "${medicineName}". Try common names like Paracetamol, Ibuprofen, or Amoxicillin.`;
        return result;
    }

    result.found = true;
    result.matchedMedicine = medicine.matchedName;
    result.category = medicine.medicineData.category;

    // Find age-appropriate rule
    const rules = medicine.medicineData.rules;
    let matchingRule = null;

    for (const rule of rules) {
        if (numAge >= rule.minAge && numAge < rule.maxAge) {
            matchingRule = rule;
            break;
        }
    }

    if (!matchingRule) {
        // Default to last rule if age exceeds all ranges
        matchingRule = rules[rules.length - 1];
    }

    // Build recommendation
    result.recommendation = {
        ageGroup: matchingRule.ageGroup,
        dosage: matchingRule.dosage,
        frequency: matchingRule.frequency,
        maxDaily: matchingRule.maxDaily,
        notes: matchingRule.notes
    };

    // Add gender-specific notes if available
    if (matchingRule.genderNote && matchingRule.genderNote[gender]) {
        result.recommendation.genderNote = matchingRule.genderNote[gender];
    }

    return result;
};

/**
 * Format recommendation as a display string
 */
export const formatRecommendation = (result) => {
    if (!result.found) {
        return result.error || "No recommendation available.";
    }

    const rec = result.recommendation;
    let text = `💊 ${result.matchedMedicine.charAt(0).toUpperCase() + result.matchedMedicine.slice(1)}\n`;
    text += `📁 ${result.category}\n\n`;
    text += `📏 Dosage: ${rec.dosage}\n`;
    text += `⏰ Frequency: ${rec.frequency}\n`;
    text += `🚫 Max Daily: ${rec.maxDaily}\n`;

    if (rec.notes) {
        text += `\n📝 Notes: ${rec.notes}`;
    }

    if (rec.genderNote) {
        text += `\n⚠️ ${rec.genderNote}`;
    }

    return text;
};

export default {
    findMedicine,
    getDosageRecommendation,
    formatRecommendation,
    getAllMedicineNames
};
