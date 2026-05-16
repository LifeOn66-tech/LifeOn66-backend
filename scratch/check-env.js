const dotenv = require('dotenv');
dotenv.config();
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'LOADED (' + process.env.RAZORPAY_KEY_ID.substring(0, 8) + '...)' : 'MISSING');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'LOADED' : 'MISSING');
