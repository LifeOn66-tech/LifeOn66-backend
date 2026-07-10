const crypto = require('crypto');
const https = require('https');
const dns = require('dns');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { generateAndUploadReceipt } = require('../utils/receiptGenerator');
const {
  getReadingCompletionStatus,
  buildIncompleteReadingsMessage,
} = require('../utils/readingCompletion');
const { resolveFrontendUrl } = require('../config/allowedOrigins');

const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();

const customResolver = new dns.promises.Resolver();
customResolver.setServers(['8.8.8.8', '8.8.4.4']);

const razorpayDnsLookup = (hostname, lookupOptions, callback) => {
  customResolver
    .resolve4(hostname)
    .then((addresses) => {
      if (addresses?.length > 0) {
        callback(null, addresses[0], 4);
        return;
      }
      dns.lookup(hostname, lookupOptions, callback);
    })
    .catch(() => dns.lookup(hostname, lookupOptions, callback));
};

const razorpayApiRequest = (apiPath, body) =>
  new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const req = https.request(
      {
        hostname: 'api.razorpay.com',
        port: 443,
        path: apiPath,
        method: 'POST',
        family: 4,
        lookup: razorpayDnsLookup,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
          Authorization: `Basic ${auth}`,
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
              return;
            }
            reject({
              statusCode: res.statusCode,
              error: parsed.error || parsed,
              message: parsed.error?.description || 'Razorpay API Error',
            });
          } catch {
            reject({ statusCode: res.statusCode, message: 'Invalid JSON response from Razorpay' });
          }
        });
      }
    );

    req.on('error', (err) => reject({ message: err.message, code: err.code }));
    req.write(payload);
    req.end();
  });

const createRazorpayOrderRest = (options) => razorpayApiRequest('/v1/orders', options);
const createRazorpayPaymentLinkRest = (options) => razorpayApiRequest('/v1/payment_links', options);

function normalizeRazorpayPayload(body = {}) {
  return {
    razorpay_order_id:
      body.razorpay_order_id || body.order_id || body.orderId || body.razorpayOrderId || '',
    razorpay_payment_id:
      body.razorpay_payment_id || body.payment_id || body.paymentId || body.razorpayPaymentId || '',
    razorpay_signature:
      body.razorpay_signature || body.signature || body.razorpaySignature || '',
  };
}

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature.length !== String(signature).length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(String(signature), 'utf8')
    );
  } catch {
    return false;
  }
}

function assertRazorpayConfigured() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay is not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    error.code = 'RAZORPAY_NOT_CONFIGURED';
    throw error;
  }
}

function buildApiBase(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

function buildShareReceiptUrl(req, paymentId) {
  if (!paymentId) return null;
  return `${buildApiBase(req)}/api/payments/share/${paymentId}`;
}

function buildPaymentCheckoutPayload(req, order, tier, user, paymentLink) {
  return {
    success: true,
    orderId: order.id,
    razorpayOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    tier,
    // Public key — required by Razorpay Checkout on the frontend (fixes .../build/undefined)
    razorpayKeyId: RAZORPAY_KEY_ID,
    keyId: RAZORPAY_KEY_ID,
    key: RAZORPAY_KEY_ID,
    razorpayKey: RAZORPAY_KEY_ID,
    paymentLink: paymentLink || null,
    prefill: {
      name: user?.fullName || '',
      email: user?.email || '',
    },
    notes: {
      tier,
      userId: String(user?._id || ''),
    },
  };
}

exports.getPaymentConfig = (req, res) => {
  if (!RAZORPAY_KEY_ID) {
    return res.status(503).json({
      success: false,
      message: 'Razorpay is not configured on the server.',
      code: 'RAZORPAY_NOT_CONFIGURED',
    });
  }

  return res.status(200).json({
    success: true,
    razorpayKeyId: RAZORPAY_KEY_ID,
    keyId: RAZORPAY_KEY_ID,
    key: RAZORPAY_KEY_ID,
    currency: 'INR',
  });
};

exports.createOrder = async (req, res) => {
  try {
    assertRazorpayConfigured();
    const { tier } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let amountInUsd = 0;
    if (tier === 'premium') amountInUsd = 5;
    else if (tier === 'professional') amountInUsd = 10;
    else return res.status(400).json({ success: false, message: 'Invalid tier' });

    const readingStatus = await getReadingCompletionStatus(userId);
    if (!readingStatus.complete) {
      return res.status(400).json({
        success: false,
        message: buildIncompleteReadingsMessage(readingStatus),
        code: 'READINGS_INCOMPLETE',
        readings: readingStatus,
      });
    }

    const conversionRate = 85; 
    const amountInInr = amountInUsd * conversionRate;
    const amountInPaise = Math.round(amountInInr * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { userId, tier, originalAmount: amountInUsd, originalCurrency: 'USD' }
    };

    const order = await createRazorpayOrderRest(orderOptions);

    let paymentLinkData = null;
    try {
      paymentLinkData = await createRazorpayPaymentLinkRest({
        amount: amountInPaise,
        currency: 'INR',
        description: `Unlock ${tier.charAt(0).toUpperCase() + tier.slice(1)} Report for ${user.fullName}`,
        customer: { name: user.fullName, email: user.email },
        notify: { email: true },
        callback_url: `${resolveFrontendUrl()}/comprehensive?tier=${tier}`,
        callback_method: 'get',
        notes: { userId, tier }
      });
    } catch (linkErr) {
      console.warn('[PAYMENT] Could not create fallback link:', linkErr.message || linkErr);
    }

    // Save pending transaction
    await Transaction.create({
      user: userId,
      razorpayOrderId: order.id,
      tier,
      amount: amountInUsd,
      currency: 'USD',
      status: 'pending'
    });

    res.status(200).json(
      buildPaymentCheckoutPayload(req, order, tier, user, paymentLinkData?.short_url)
    );
  } catch (err) {
    console.error('[Payment] Order creation failed:', err);
    const status = err.code === 'RAZORPAY_NOT_CONFIGURED' ? 503 : 500;
    res.status(status).json({
      success: false,
      error: err.message || 'Payment initiation failed',
      code: err.code || 'ORDER_CREATE_FAILED',
    });
  }
};


exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = normalizeRazorpayPayload(req.body);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: missing order, payment, or signature.',
        code: 'PAYMENT_PAYLOAD_INCOMPLETE',
      });
    }

    const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    const isSignatureValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      secret
    );

    if (!isSignatureValid) {
      console.error('[Payment] Signature mismatch for order:', razorpay_order_id);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: invalid signature. Check Razorpay keys on the server.',
        code: 'INVALID_SIGNATURE',
      });
    }

    const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Payment verification failed: order not found. Please contact support with your payment ID.',
        code: 'ORDER_NOT_FOUND',
      });
    }

    if (
      transaction.status === 'completed' &&
      transaction.razorpayPaymentId === razorpay_payment_id
    ) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        receiptUrl: transaction.receiptUrl || null,
        shareUrl: buildShareReceiptUrl(req, razorpay_payment_id),
        tier: transaction.tier,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    }

    const readingStatus = await getReadingCompletionStatus(transaction.user);
    if (!readingStatus.complete) {
      return res.status(400).json({
        success: false,
        message: buildIncompleteReadingsMessage(readingStatus),
        code: 'READINGS_INCOMPLETE',
        readings: readingStatus,
      });
    }

    transaction.status = 'completed';
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    await transaction.save();

    const user = await User.findById(transaction.user);
    if (user) {
      user.subscriptionTier = transaction.tier;
      await user.save();
    }

    // Generate receipt PDF & upload to Cloudinary in the background
    let receiptUrl = null;
    try {
      receiptUrl = await generateAndUploadReceipt({
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        tier: transaction.tier,
        amount: transaction.amount,
        currency: transaction.currency.toUpperCase(),
        userName: user?.fullName || 'Customer',
        userEmail: user?.email || '',
        date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
      transaction.receiptUrl = receiptUrl;
      await transaction.save();
    } catch (receiptErr) {
      console.error('[Receipt] Failed to generate/upload receipt:', receiptErr.message);
      // Non-fatal — payment is still verified even if receipt fails
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      receiptUrl,
      shareUrl: buildShareReceiptUrl(req, razorpay_payment_id),
      tier: transaction.tier,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err) {
    console.error('[Payment] Verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed due to a server error.',
      error: err.message,
      code: 'VERIFICATION_SERVER_ERROR',
    });
  }
};

/**
 * GET /api/payments/receipt/:paymentId
 * Returns the Cloudinary receipt PDF URL for a given Razorpay payment ID.
 */
exports.getReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const transaction = await Transaction.findOne({
      razorpayPaymentId: paymentId,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (!transaction.receiptUrl) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not yet generated',
        shareUrl: `${buildApiBase(req)}/api/payments/share/${paymentId}`,
      });
    }

    return res.status(200).json({
      success: true,
      receiptUrl: transaction.receiptUrl,
      shareUrl: buildShareReceiptUrl(req, paymentId),
    });
  } catch (err) {
    console.error('[Receipt] getReceipt error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/payments/share/:paymentId
 * PUBLIC endpoint for WhatsApp/Telegram link scrapers.
 * Returns an HTML page with OpenGraph tags to generate a beautiful preview card,
 * and instantly redirects actual users to the Cloudinary image.
 */
exports.shareReceiptHTML = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const transaction = await Transaction.findOne({ razorpayPaymentId: paymentId }).populate('user');

    if (!transaction || !transaction.receiptUrl) {
      return res.status(404).send('Receipt not found or not yet generated.');
    }

    const tierLabels = { free: 'Cosmic Explorer', premium: 'Astral', professional: 'Cosmic Master' };
    const tierLabel = tierLabels[transaction.tier] || transaction.tier;
    const amount = `${transaction.currency.toUpperCase()} ${transaction.amount}`;
    
    // Cloudinary transformation for a smaller preview image (< 300KB) to ensure WhatsApp accepts it
    const previewUrl = transaction.receiptUrl.replace('/upload/', '/upload/w_800,q_80,f_auto/');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LifeOn66 Payment Receipt</title>
    
    <!-- OpenGraph Meta Tags for WhatsApp/Telegram/Facebook -->
    <meta property="og:title" content="LifeOn66 Receipt: ${tierLabel}" />
    <meta property="og:description" content="Amount: ${amount} | Payment ID: ${paymentId}" />
    <meta property="og:image" content="${previewUrl}" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="780" />
    <meta property="og:type" content="website" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="LifeOn66 Receipt: ${tierLabel}">
    <meta name="twitter:description" content="Amount: ${amount} | Payment ID: ${paymentId}">
    <meta name="twitter:image" content="${previewUrl}">

    <!-- Auto-redirect users to the actual high-res image -->
    <meta http-equiv="refresh" content="0; url=${transaction.receiptUrl}" />
    <style>
      body { font-family: sans-serif; background: #0d0f1a; color: white; text-align: center; padding: 50px; }
      a { color: #8b5cf6; }
    </style>
</head>
<body>
    <h2>Redirecting to your receipt...</h2>
    <p>If you are not redirected automatically, <a href="${transaction.receiptUrl}">click here</a>.</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    console.error('[Receipt] shareReceiptHTML error:', err);
    res.status(500).send('Server Error');
  }
};
