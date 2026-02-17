const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Medication = require('./models/Medication');
const User = require('./models/User'); // Assuming User model exists

const triggerLowStock = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find a user (using the one from previous context or just the first one)
        const user = await User.findOne({ email: 'kusuma@example.com' }); // Adjust email if known, or just findOne()
        const targetUser = user || await User.findOne();

        if (!targetUser) {
            console.log('❌ No user found to test with.');
            return;
        }

        console.log(`👤 Testing for user: ${targetUser.name} (${targetUser.email})`);

        // Find a medication for this user
        const medication = await Medication.findOne({ user: targetUser._id });

        if (!medication) {
            console.log('❌ No medication found for this user. Creating a test one...');
            // Create a dummy medication if none exists
            const newMed = new Medication({
                user: targetUser._id,
                name: 'Test Low Stock Pill',
                dosage: '10mg',
                schedule: { frequency: 'Daily', startDate: new Date() },
                inventory: { enabled: true, currentQuantity: 2, lowStockThreshold: 5 }
            });
            await newMed.save();
            console.log('✨ Created "Test Low Stock Pill" with Quantity: 2 (Threshold: 5)');
        } else {
            // Update existing medication
            medication.inventory = {
                enabled: true,
                currentQuantity: 3,
                lowStockThreshold: 10,
                lastRefillDate: new Date()
            };
            // Ensure it's active
            medication.status = 'active';
            medication.isActive = true;

            await medication.save();
            console.log(`scUpdated "${medication.name}" to have Low Stock.`);
            console.log(`   📉 Current Quantity: ${medication.inventory.currentQuantity}`);
            console.log(`   ⚠️ Threshold: ${medication.inventory.lowStockThreshold}`);
        }

        console.log('\n✅ SETUP COMPLETE!');
        console.log('👉 Please go to your Dashboard/Admin Shell.');
        console.log('   1. You should see "Active Warnings" count increase.');
        console.log('   2. You should see a "Low Stock Warning" in the Alerts Panel.');
        console.log('   3. Go to "My Medications" to see the "Stock: 3 remaining (Low)" badge.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

triggerLowStock();
