const mongoose = require('mongoose');
require('dotenv').config();

async function checkStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../src/models/User');
    const Transaction = require('../src/models/Transaction');
    
    console.log('--- USERS ---');
    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    users.forEach(u => console.log(`${u.email}: ${u.subscriptionTier}`));
    
    console.log('\n--- TRANSACTIONS ---');
    const txs = await Transaction.find().sort({ createdAt: -1 }).limit(5);
    txs.forEach(t => console.log(`${t.razorpayOrderId}: ${t.status} (${t.tier})`));
    
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkStatus();
