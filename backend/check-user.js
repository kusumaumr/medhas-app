const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');
        const user = await User.findOne({ email: 'kusumaumr@gmail.com' });
        if (user) {
            console.log(JSON.stringify({
                name: user.name,
                email: user.email,
                language: user.language,
                phone: user.phone
            }, null, 2));
        } else {
            console.log('User not found');
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
checkUser();
