const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`-------------------mongoDB Connected: ${conn.connection.host}----------------------`);
      return;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed: ${error.message}`);
      
      if (retries === maxRetries) {
        console.error('CRITICAL: Max retries reached for MongoDB connection. Exiting...');
        process.exit(1);
      }
      
      console.log('Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
