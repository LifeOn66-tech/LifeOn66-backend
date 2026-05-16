const mongoose = require('mongoose');
require('dotenv').config();

async function resetAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    const User = require('../src/models/User');
    
    const result = await User.updateMany({}, { $set: { subscriptionTier: 'free' } });
    console.log('Reset all users to free tier:', result);
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Reset failed:', err);
    process.exit(1);
  }
}

resetAll();
