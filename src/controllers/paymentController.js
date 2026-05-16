const Razorpay = require('razorpay');
const crypto = require('crypto');
const https = require('https');
const dns = require('dns');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { generateAndUploadReceipt } = require('../utils/receiptGenerator');

const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();

// Create a custom DNS resolver using Google DNS (8.8.8.8)
// This completely bypasses local DNS failures/blocks (ENOTFOUND)
const customResolver = new dns.promises.Resolver();
customResolver.setServers(['8.8.8.8', '8.8.4.4']);

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Direct API call using native HTTPS with Custom DNS to avoid SDK bugs and Local DNS blocks
 */
const createRazorpayOrderRest = (options) => {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const data = JSON.stringify(options);

    const reqOptions = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: '/v1/orders',
      method: 'POST',
      family: 4, 
      lookup: (hostname, lookupOptions, callback) => {
        console.log(`[DNS] Resolving ${hostname} via Google DNS...`);
        customResolver.resolve4(hostname)
          .then(addresses => {
            if (addresses && addresses.length > 0) {
              console.log(`[DNS] Resolved ${hostname} to ${addresses[0]}`);
              callback(null, addresses[0], 4);
            } else {
              console.warn(`[DNS] No addresses found for ${hostname}, falling back to system DNS`);
              dns.lookup(hostname, lookupOptions, callback);
            }
          })
          .catch(err => {
            console.error(`[DNS] Error resolving ${hostname}:`, err.message);
            console.log(`[DNS] Falling back to system DNS for ${hostname}`);
            dns.lookup(hostname, lookupOptions, callback);
          });
      },
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedBody);
          } else {
            reject({ 
              statusCode: res.statusCode, 
              error: parsedBody.error || parsedBody,
              message: parsedBody.error?.description || 'Razorpay API Error'
            });
          }
        } catch (e) {
          reject({ statusCode: res.statusCode, message: 'Invalid JSON response from Razorpay' });
        }
      });
    });

    req.on('error', (e) => reject({ message: e.message, code: e.code }));
    req.write(data);
    req.end();
  });
};

const createRazorpayPaymentLinkRest = (options) => {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const data = JSON.stringify(options);

    const reqOptions = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: '/v1/payment_links',
      method: 'POST',
      family: 4, 
      lookup: (hostname, lookupOptions, callback) => {
        customResolver.resolve4(hostname).then(addresses => {
          callback(null, addresses[0], 4);
        }).catch(() => dns.lookup(hostname, lookupOptions, callback));
      },
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(parsed);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let amountInUsd = 0;
    if (tier === 'premium') amountInUsd = 5; 
    else if (tier === 'professional') amountInUsd = 10; 
    else return res.status(400).json({ success: false, message: 'Invalid tier' });

    const conversionRate = 85; 
    const amountInInr = amountInUsd * conversionRate;
    const amountInPaise = Math.round(amountInInr * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { userId, tier, originalAmount: amountInUsd, originalCurrency: 'USD' }
    };

    console.log('[PAYMENT] Creating order via DNS-bypass REST...');
    const order = await createRazorpayOrderRest(orderOptions);

    // Also create a Payment Link as a fallback for users with browser DNS issues
    console.log('[PAYMENT] Creating fallback Payment Link...');
    let paymentLinkData = null;
    try {
      paymentLinkData = await createRazorpayPaymentLinkRest({
        amount: amountInPaise,
        currency: 'INR',
        description: `Unlock ${tier.charAt(0).toUpperCase() + tier.slice(1)} Report for ${user.fullName}`,
        customer: { name: user.fullName, email: user.email },
        notify: { email: true },
        callback_url: `http://localhost:5173/comprehensive?tier=${tier}`,
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

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentLink: paymentLinkData?.short_url,
      dnsHint: 'api.razorpay.com resolved to 15.206.197.168'
    });
  } catch (err) {
    console.error('Detailed Razorpay Order Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Payment initiation failed' });
  }
};


exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      // Fulfill the purchase
      const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
      if (transaction) {
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
            paymentId:  razorpay_payment_id,
            orderId:    razorpay_order_id,
            tier:       transaction.tier,
            amount:     transaction.amount,
            currency:   transaction.currency.toUpperCase(),
            userName:   user?.fullName || 'Customer',
            userEmail:  user?.email || '',
            date:       new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          });
          transaction.receiptUrl = receiptUrl;
          await transaction.save();
        } catch (receiptErr) {
          console.error('[Receipt] Failed to generate/upload receipt:', receiptErr.message);
          // Non-fatal — payment is still verified even if receipt fails
        }

        res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          receiptUrl,
        });
      } else {
        res.status(404).json({ success: false, message: 'Transaction not found' });
      }
    } else {
      console.error(`Signature mismatch. Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
      res.status(400).json({ success: false, message: 'Invalid signature', expected: expectedSignature, received: razorpay_signature });
    }
  } catch (err) {
    console.error('Razorpay Verification Error:', err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
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
      return res.status(404).json({ success: false, message: 'Receipt not yet generated' });
    }

    return res.status(200).json({ success: true, receiptUrl: transaction.receiptUrl });
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
