const express = require('express');
const {
  createOrder,
  verifyRazorpayPayment,
  getReceipt,
  shareReceiptHTML,
  getPaymentConfig,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/config', getPaymentConfig);
router.get('/share/:paymentId', shareReceiptHTML);

// Protected routes
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyRazorpayPayment);
router.get('/receipt/:paymentId', protect, getReceipt);

module.exports = router;
