const express = require('express');
const { createOrder, verifyRazorpayPayment, getReceipt, shareReceiptHTML } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public route for WhatsApp/Telegram scrapers
router.get('/share/:paymentId', shareReceiptHTML);

// Protected routes
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyRazorpayPayment);
router.get('/receipt/:paymentId', protect, getReceipt);

module.exports = router;
