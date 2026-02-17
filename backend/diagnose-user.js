const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/user');

const fs = require('fs');

const diagnoseUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({ email: 'kusumaumr@gmail.com' });
        if (!user) {
            fs.writeFileSync('diagnose-log.txt', 'User not found');
        } else {
            const output = `User found: ${user.name}\n` +
                `Blood Group: ${user.bloodGroup}\n` +
                `Allergies: ${JSON.stringify(user.allergies)}\n` +
                `Medical Conditions: ${JSON.stringify(user.medicalConditions)}\n` +
                `Emergency Contacts: ${JSON.stringify(user.emergencyContacts)}\n` +
                `Full Object: ${JSON.stringify(user, null, 2)}`;
            fs.writeFileSync('diagnose-log.txt', output);
        }
    } catch (error) {
        fs.writeFileSync('diagnose-log.txt', `Error: ${error.message}`);
    } finally {
        await mongoose.disconnect();
    }
};

diagnoseUser();
