/**
 * Smart Dosage Rules - Demo/Mock Data
 * DISCLAIMER: This is for demonstration purposes only.
 * Always consult a healthcare professional for medical advice.
 */

export const DOSAGE_RULES = {
    // Paracetamol / Acetaminophen
    "paracetamol": {
        genericNames: ["paracetamol", "acetaminophen", "tylenol", "crocin", "dolo"],
        category: "Analgesic / Antipyretic",
        rules: [
            {
                ageGroup: "infant",
                minAge: 0,
                maxAge: 2,
                dosage: "10-15 mg/kg",
                frequency: "Every 4-6 hours",
                maxDaily: "60 mg/kg/day",
                notes: "Use infant drops. Consult pediatrician."
            },
            {
                ageGroup: "child",
                minAge: 2,
                maxAge: 12,
                dosage: "10-15 mg/kg",
                frequency: "Every 4-6 hours",
                maxDaily: "75 mg/kg/day (max 4g)",
                notes: "Use age-appropriate formulation (syrup/tablet)"
            },
            {
                ageGroup: "adult",
                minAge: 12,
                maxAge: 65,
                dosage: "500-1000 mg",
                frequency: "Every 4-6 hours",
                maxDaily: "4000 mg (4g)",
                notes: "Do not exceed 4g in 24 hours. Avoid with alcohol."
            },
            {
                ageGroup: "elderly",
                minAge: 65,
                maxAge: 150,
                dosage: "325-650 mg",
                frequency: "Every 6 hours",
                maxDaily: "3000 mg (3g)",
                notes: "Reduced dose recommended. Monitor liver function."
            }
        ]
    },

    // Ibuprofen
    "ibuprofen": {
        genericNames: ["ibuprofen", "advil", "motrin", "brufen"],
        category: "NSAID / Anti-inflammatory",
        rules: [
            {
                ageGroup: "child",
                minAge: 6,
                maxAge: 12,
                dosage: "5-10 mg/kg",
                frequency: "Every 6-8 hours",
                maxDaily: "40 mg/kg/day",
                notes: "Give with food. Not for children under 6 months."
            },
            {
                ageGroup: "adult",
                minAge: 12,
                maxAge: 65,
                dosage: "200-400 mg",
                frequency: "Every 4-6 hours",
                maxDaily: "1200 mg (OTC) / 3200 mg (Rx)",
                notes: "Take with food. Avoid if ulcer history."
            },
            {
                ageGroup: "elderly",
                minAge: 65,
                maxAge: 150,
                dosage: "200 mg",
                frequency: "Every 6-8 hours",
                maxDaily: "1200 mg",
                notes: "Use lowest effective dose. Monitor kidney function.",
                genderNote: { female: "Increased GI bleeding risk in elderly women." }
            }
        ]
    },

    // Amoxicillin
    "amoxicillin": {
        genericNames: ["amoxicillin", "amoxil", "moxatag"],
        category: "Antibiotic (Penicillin)",
        rules: [
            {
                ageGroup: "child",
                minAge: 0,
                maxAge: 12,
                dosage: "25-50 mg/kg/day",
                frequency: "Divided every 8 hours",
                maxDaily: "3000 mg",
                notes: "Complete full course. Use oral suspension for young children."
            },
            {
                ageGroup: "adult",
                minAge: 12,
                maxAge: 150,
                dosage: "250-500 mg",
                frequency: "Every 8 hours",
                maxDaily: "3000 mg",
                notes: "Complete full course (usually 7-10 days). Take with or without food."
            }
        ]
    },

    // Cetirizine
    "cetirizine": {
        genericNames: ["cetirizine", "zyrtec", "reactine", "alerid"],
        category: "Antihistamine",
        rules: [
            {
                ageGroup: "child",
                minAge: 2,
                maxAge: 6,
                dosage: "2.5 mg",
                frequency: "Once or twice daily",
                maxDaily: "5 mg",
                notes: "Use syrup formulation."
            },
            {
                ageGroup: "child",
                minAge: 6,
                maxAge: 12,
                dosage: "5-10 mg",
                frequency: "Once daily",
                maxDaily: "10 mg",
                notes: "Can cause drowsiness in some children."
            },
            {
                ageGroup: "adult",
                minAge: 12,
                maxAge: 150,
                dosage: "10 mg",
                frequency: "Once daily",
                maxDaily: "10 mg",
                notes: "May cause drowsiness. Take at bedtime if affected."
            }
        ]
    },

    // Omeprazole
    "omeprazole": {
        genericNames: ["omeprazole", "prilosec", "losec"],
        category: "Proton Pump Inhibitor (PPI)",
        rules: [
            {
                ageGroup: "child",
                minAge: 1,
                maxAge: 16,
                dosage: "0.7-1 mg/kg",
                frequency: "Once daily",
                maxDaily: "20 mg",
                notes: "Take before breakfast. Capsule must be swallowed whole."
            },
            {
                ageGroup: "adult",
                minAge: 16,
                maxAge: 150,
                dosage: "20-40 mg",
                frequency: "Once daily",
                maxDaily: "40 mg",
                notes: "Take 30 min before breakfast. Short-term use preferred."
            }
        ]
    },

    // Metformin
    "metformin": {
        genericNames: ["metformin", "glucophage", "fortamet"],
        category: "Antidiabetic (Biguanide)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 80,
                dosage: "500-850 mg",
                frequency: "2-3 times daily with meals",
                maxDaily: "2550 mg",
                notes: "Start low, increase gradually. Take with food to reduce GI upset."
            },
            {
                ageGroup: "elderly",
                minAge: 80,
                maxAge: 150,
                dosage: "500 mg",
                frequency: "Once or twice daily",
                maxDaily: "1000 mg",
                notes: "Assess kidney function before starting. Use with caution."
            }
        ]
    },

    // Aspirin
    "aspirin": {
        genericNames: ["aspirin", "ecosprin", "disprin", "acetylsalicylic acid"],
        category: "NSAID / Antiplatelet",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "75-325 mg (cardiac) / 325-650 mg (pain)",
                frequency: "Once daily (cardiac) / Every 4-6 hours (pain)",
                maxDaily: "4000 mg (pain use only)",
                notes: "Low-dose for heart. NOT for children (Reye's risk). Take with food."
            }
        ]
    },

    // Azithromycin
    "azithromycin": {
        genericNames: ["azithromycin", "zithromax", "z-pack", "azee"],
        category: "Antibiotic (Macrolide)",
        rules: [
            {
                ageGroup: "child",
                minAge: 6,
                maxAge: 12,
                dosage: "10 mg/kg Day 1, then 5 mg/kg",
                frequency: "Once daily",
                maxDaily: "500 mg Day 1, 250 mg after",
                notes: "3-5 day course. Take 1 hour before or 2 hours after food."
            },
            {
                ageGroup: "adult",
                minAge: 12,
                maxAge: 150,
                dosage: "500 mg Day 1, then 250 mg",
                frequency: "Once daily",
                maxDaily: "500 mg",
                notes: "Complete 3-5 day course. Can be taken with or without food."
            }
        ]
    },

    // Furosemide (Lasix)
    "furosemide": {
        genericNames: ["furosemide", "lasix", "frusimide"],
        category: "Diuretic (Water Pill)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "20-80 mg",
                frequency: "Once or twice daily",
                maxDaily: "600 mg (severe cases)",
                notes: "Take in the morning to avoid nighttime urination. Monitor potassium."
            }
        ]
    },

    // Atorvastatin (Lipitor)
    "atorvastatin": {
        genericNames: ["atorvastatin", "lipitor", "atorva", "stator"],
        category: "Statin (Cholesterol)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "10-80 mg",
                frequency: "Once daily",
                maxDaily: "80 mg",
                notes: "Can be taken at any time, but be consistent. Avoid grapefruit juice."
            }
        ]
    },

    // Lisinopril
    "lisinopril": {
        genericNames: ["lisinopril", "zestril", "prinivil", "lipril"],
        category: "ACE Inhibitor (Blood Pressure)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "10-40 mg",
                frequency: "Once daily",
                maxDaily: "80 mg",
                notes: "Take at the same time each day. Monitor kidney function and potassium."
            }
        ]
    },

    // Amlodipine
    "amlodipine": {
        genericNames: ["amlodipine", "norvasc", "amlovas", "stamlo"],
        category: "Calcium Channel Blocker (Blood Pressure)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "2.5-10 mg",
                frequency: "Once daily",
                maxDaily: "10 mg",
                notes: "May cause ankle swelling. Can be taken with or without food."
            }
        ]
    },

    // Pantoprazole
    "pantoprazole": {
        genericNames: ["pantoprazole", "protonix", "pantop", "pan", "pantocid"],
        category: "PPI (Acid Reflux)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "20-40 mg",
                frequency: "Once daily",
                maxDaily: "240 mg (severe ZES)",
                notes: "Take 30-60 minutes before breakfast."
            }
        ]
    },

    // Telmisartan
    "telmisartan": {
        genericNames: ["telmisartan", "micardis", "telma", "telsar"],
        category: "ARB (Blood Pressure)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "40-80 mg",
                frequency: "Once daily",
                maxDaily: "80 mg",
                notes: "Take consistently. Avoid potassium supplements unless advised."
            }
        ]
    },

    // Metoprolol
    "metoprolol": {
        genericNames: ["metoprolol", "lopressor", "toprol", "metolar"],
        category: "Beta Blocker (Heart/BP)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "25-100 mg",
                frequency: "Once or twice daily",
                maxDaily: "400 mg",
                notes: "Take with or immediately after meals. Monitor heart rate."
            }
        ]
    },

    // Losartan
    "losartan": {
        genericNames: ["losartan", "cozaar", "losar", "cosart"],
        category: "ARB (Blood Pressure)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "25-100 mg",
                frequency: "Once or twice daily",
                maxDaily: "100 mg",
                notes: "Maintain consistency. Monitor blood pressure regularly."
            }
        ]
    },

    // Gabapentin
    "gabapentin": {
        genericNames: ["gabapentin", "neurontin", "gaba"],
        category: "Anticonvulsant / Nerve Pain",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "300-600 mg",
                frequency: "Three times daily",
                maxDaily: "3600 mg",
                notes: "Do not stop abruptly. May cause drowsiness."
            }
        ]
    },

    // Prednisone
    "prednisone": {
        genericNames: ["prednisone", "deltasone", "rayos", "omnipred"],
        category: "Corticosteroid (Anti-inflammatory)",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "5-60 mg",
                frequency: "Once daily, usually in morning",
                maxDaily: "80 mg",
                notes: "Take with food to prevent stomach upset. Do not stop suddenly; must be tapered."
            }
        ]
    },

    // Dexamethasone
    "dexamethasone": {
        genericNames: ["dexamethasone", "decadron", "dexona"],
        category: "Corticosteroid",
        rules: [
            {
                ageGroup: "adult",
                minAge: 18,
                maxAge: 150,
                dosage: "0.75-9 mg",
                frequency: "Once daily",
                maxDaily: "40 mg",
                notes: "Powerful anti-inflammatory. Take with food."
            }
        ]
    }
};

/**
 * Get list of all supported medicine names for autocomplete/matching
 */
export const getAllMedicineNames = () => {
    const names = [];
    Object.entries(DOSAGE_RULES).forEach(([key, data]) => {
        names.push(key);
        if (data.genericNames) {
            names.push(...data.genericNames);
        }
    });
    return [...new Set(names)];
};
