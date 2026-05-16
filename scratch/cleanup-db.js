const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const transactionCollectionExists = collections.some(c => c.name === 'transactions');

    if (transactionCollectionExists) {
      const collection = mongoose.connection.db.collection('transactions');
      
      // Try to drop the stripeSessionId index
      try {
        await collection.dropIndex('stripeSessionId_1');
        console.log('Dropped stripeSessionId_1 index');
      } catch (e) {
        console.log('Index stripeSessionId_1 not found or already dropped');
      }
    }

    console.log('Cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
