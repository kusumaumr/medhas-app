const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Medication = require('./models/Medication');
const User = require('./models/User');

const fs = require('fs');

const logToFile = (message) => {
    fs.appendFileSync(path.join(__dirname, 'populate-log.txt'), message + '\n');
};

const populateTestData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        logToFile('Connected to MongoDB');

        // Find the existing user
        const user = await User.findOne({ email: 'kusumaumr@gmail.com' });

        if (!user) {
            console.log('User not found.');
            logToFile('User not found.');
            return;
        }

        console.log(`Updating user: ${user.name}`);
        logToFile(`Updating user: ${user.name}`);

        // Update user with full profile details
        user.bloodGroup = 'O+';
        user.dateOfBirth = new Date('1995-05-15');
        user.gender = 'female';

        user.allergies = [
            'Penicillin',
            'Pollen',
            'Peanuts'
        ];

        user.medicalConditions = [
            {
                name: 'Hypertension',
                diagnosedDate: new Date('2020-03-10'),
                status: 'active'
            },
            {
                name: 'Type 2 Diabetes',
                diagnosedDate: new Date('2019-08-22'),
                status: 'active'
            }
        ];

        user.emergencyContacts = [
            {
                name: 'Rajesh Kadimisetty',
                phone: '+919876543210',
                relationship: 'Spouse',
                email: 'rajesh@example.com',
                priority: 1
            },
            {
                name: 'Dr. Vinay Kumar',
                phone: '+919123456789',
                relationship: 'Doctor',
                email: 'dr.vinay@hospital.com',
                priority: 2
            }
        ];

        await user.save();
        console.log('User updated with full profile details!');
        logToFile('User updated with full profile details!');

        // Find and update a medication
        const medication = await Medication.findOne({ user: user._id, isActive: true });

        if (medication) {
            console.log(`Updating medication: ${medication.name}`);
            logToFile(`Updating medication: ${medication.name}`);

            // Update inventory with full details
            medication.inventory = {
                enabled: true,
                currentQuantity: 25,
                lowStockThreshold: 10,
                lastRefillDate: new Date()
            };

            // Add side effects
            medication.sideEffects = [
                {
                    name: 'Nausea',
                    severity: 'mild',
                    experienced: true,
                    notes: 'Occurs occasionally after taking on empty stomach',
                    reportedAt: new Date()
                },
                {
                    name: 'Dizziness',
                    severity: 'moderate',
                    experienced: false,
                    notes: 'Not experienced yet',
                    reportedAt: new Date()
                }
            ];

            // Add prescription details
            medication.prescription = {
                prescribedBy: 'Dr. Vinay Kumar',
                prescriptionDate: new Date('2024-01-15'),
                refills: {
                    total: 6,
                    remaining: 4
                },
                pharmacy: {
                    name: 'Apollo Pharmacy',
                    phone: '+914012345678',
                    address: 'MG Road, Hyderabad'
                }
            };

            await medication.save();
            console.log('Medication updated with full details!');
            logToFile('Medication updated with full details!');
        } else {
            console.log('No active medication found to update.');
            logToFile('No active medication found to update.');
        }

        console.log('ALL DONE!');
        logToFile('ALL DONE!');

    } catch (error) {
        console.error('Error:', error);
        logToFile(`Error: ${error.message}`);
        logToFile(error.stack);
    } finally {
        await mongoose.disconnect();
    }
};

populateTestData();
