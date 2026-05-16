const https = require('https');
const dns = require('dns');
const dotenv = require('dotenv');
dotenv.config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const customResolver = new dns.promises.Resolver();
customResolver.setServers(['8.8.8.8', '8.8.4.4']);

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
        console.log('Resolving:', hostname);
        customResolver.resolve4(hostname).then(addresses => {
          console.log('Resolved to:', addresses);
          callback(null, addresses[0], 4);
        }).catch(err => {
          console.error('DNS Error:', err);
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
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        resolve(body);
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
};

createRazorpayOrderRest({ amount: 500, currency: 'INR', receipt: 'test' })
  .catch(err => console.error('Final Error:', err));
