const mongoose = require('mongoose');
require('dotenv').config();
const Medication = require('./models/medication');
const User = require('./models/user');

async function testInventory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne();
        if (!user) throw new Error('No user found');

        // Create test med with inventory
        const med = new Medication({
            name: "Test Inventory Med",
            user: user._id,
            dosage: "1 Pill",
            inventory: {
                currentQuantity: 5,
                lowStockThreshold: 3,
                enabled: true
            },
            schedule: {
                frequency: "Daily",
                startDate: new Date()
            }
        });

        await med.save();
        console.log(`💊 Created med with ${med.inventory.currentQuantity} pills.`);

        // Take dose 1
        await med.markAsTaken();
        console.log(`🔻 Dose 1 taken. Remaining: ${med.inventory.currentQuantity}`);

        // Take dose 2
        await med.markAsTaken();
        console.log(`🔻 Dose 2 taken. Remaining: ${med.inventory.currentQuantity}`);

        // Take dose 3 (Should trigger low stock log)
        await med.markAsTaken();
        console.log(`🔻 Dose 3 taken. Remaining: ${med.inventory.currentQuantity}`);

        if (med.inventory.currentQuantity === 2) {
            console.log('✅ Inventory logic working correctly!');
        } else {
            console.error('❌ Inventory logic failed.');
        }

        // Cleanup
        await Medication.deleteOne({ _id: med._id });
        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

testInventory();
