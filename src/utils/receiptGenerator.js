const puppeteer = require('puppeteer');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Generates an HTML receipt page as a string.
 */
function buildReceiptHtml(data) {
  const { paymentId, orderId, tier, amount, currency, userName, userEmail, date } = data;
  const tierColors = {
    free:         { from: '#3b82f6', to: '#06b6d4', label: 'Cosmic Explorer' },
    premium:      { from: '#f59e0b', to: '#ef4444', label: 'Astral Navigator' },
    professional: { from: '#8b5cf6', to: '#ec4899', label: 'Cosmic Master'   },
  };
  const { from, to, label } = tierColors[tier] || tierColors.free;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0d0f1a;
      color: #fff;
      width: 600px;
      min-height: 780px;
      padding: 48px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .brand { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
    .brand span { 
      background: linear-gradient(135deg, ${from}, ${to});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      background: linear-gradient(135deg, ${from}, ${to});
      padding: 6px 18px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 28px 0; }
    .success-icon {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      font-size: 32px;
    }
    .title { text-align: center; font-size: 28px; font-weight: 900; margin-bottom: 8px; }
    .subtitle { text-align: center; color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 36px; }
    .amount-box {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 28px;
      text-align: center;
      margin-bottom: 28px;
    }
    .amount-label { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 8px; }
    .amount-value { font-size: 48px; font-weight: 900; letter-spacing: -1px; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
    }
    .row:last-child { border-bottom: none; }
    .row-label { color: rgba(255,255,255,0.4); }
    .row-value { font-weight: 600; font-family: monospace; font-size: 13px; }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: rgba(255,255,255,0.2);
      font-size: 12px;
      line-height: 1.8;
    }
    .gradient-bar {
      height: 4px;
      background: linear-gradient(90deg, ${from}, ${to});
      border-radius: 99px;
      margin-bottom: 40px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Life<span>On66</span></div>
    <div class="badge">${label}</div>
  </div>
  <div class="gradient-bar"></div>

  <div class="success-icon">✓</div>
  <div class="title">Payment Successful</div>
  <div class="subtitle">Your transaction has been securely processed</div>

  <div class="amount-box">
    <div class="amount-label">Amount Paid</div>
    <div class="amount-value">${currency} ${amount}</div>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Plan</span>
    <span class="row-value">${label}</span>
  </div>
  <div class="row">
    <span class="row-label">Payment ID</span>
    <span class="row-value">${paymentId}</span>
  </div>
  <div class="row">
    <span class="row-label">Order ID</span>
    <span class="row-value">${orderId}</span>
  </div>
  <div class="row">
    <span class="row-label">Customer</span>
    <span class="row-value">${userName}</span>
  </div>
  <div class="row">
    <span class="row-label">Email</span>
    <span class="row-value">${userEmail}</span>
  </div>
  <div class="row">
    <span class="row-label">Date</span>
    <span class="row-value">${date}</span>
  </div>

  <div class="footer">
    <p>Thank you for choosing LifeOn66</p>
    <p>This is a computer-generated receipt. No signature required.</p>
    <p style="margin-top:8px;">lifeon66.com</p>
  </div>
</body>
</html>`;
}

/**
 * Generates a receipt PDF and uploads it to Cloudinary.
 * Returns the secure Cloudinary URL of the uploaded PDF.
 */
async function generateAndUploadReceipt(receiptData) {
  let browser;
  try {
    console.log('[Receipt] Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ],
    });

    const page = await browser.newPage();
    await page.setContent(buildReceiptHtml(receiptData), { waitUntil: 'networkidle0' });

    const imageBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: false,
    });

    console.log(`[Receipt] Image generated — ${imageBuffer.length} bytes`);

    // Upload to Cloudinary as a standard PNG image
    // This perfectly bypasses Cloudinary's 401 block on PDFs and ensures rich WhatsApp previews
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder:        'lifeon66/receipts',
          public_id:     `receipt_${receiptData.paymentId}`,
          resource_type: 'image',
          format:        'png',
          overwrite:     true,
          tags:          ['receipt', receiptData.tier],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert Buffer to stream and pipe into upload
      const readable = new Readable();
      readable.push(imageBuffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });

    console.log('[Receipt] Uploaded to Cloudinary:', uploadResult.secure_url);
    return uploadResult.secure_url;

  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generateAndUploadReceipt };
