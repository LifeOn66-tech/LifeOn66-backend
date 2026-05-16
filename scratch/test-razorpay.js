const Razorpay = require('razorpay');
const dotenv = require('dotenv');
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function test() {
  try {
    console.log('Testing Razorpay with Key:', process.env.RAZORPAY_KEY_ID);
    const order = await razorpay.orders.create({
      amount: 500, // 5 INR
      currency: 'INR',
      receipt: 'test_receipt'
    });
    console.log('Order created successfully:', order.id);
  } catch (err) {
    console.error('Razorpay Error:', err);
  }
}

test();
