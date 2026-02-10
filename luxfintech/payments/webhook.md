Create webhook

We will send a POST notification to your webhook URL once we successfully verify your user's payment.
🔁 Retry Behavior

Upon receiving a notification, your server must respond with an HTTP 200 OK status code.
If Luxfin does not receive a valid response (e.g., due to timeout or a non-2xx status code), we will retry the notification up to 3 times using an exponential backoff strategy.
warning

To ensure our webhook requests reach your endpoint behind Cloudflare, please allowlist our fixed egress IPs and scope the rule to the specific path and method.

    Our egress IP: 35.172.189.167

🔐 Webhook Signature Verification

Every webhook request will include an HMAC-SHA256 signature in the HTTP header:

X-Luxfintech-Signature: <hex_signature>

To verify the payload:

    Retrieve the raw request body.
    Compute the HMAC-SHA256 hash using your API secret key.
    Compare the resulting hash with the value of the X-Luxfintech-Signature header.

✅ If they match, the request is authentic.


## 📦 Event Fields

| Field     | Type   | Description                     |
|-----------|--------|---------------------------------|
| `order_id`| string | Unique order number             |
| `status`  | string | Order transaction status        |
| `amount`  | number | Order transaction amount        |
| `product` | string | Order transaction product       |

📡 Webhook Quick Start

    Node.js
    Python
    PHP

import crypto from 'crypto';

/**
* @param {string} secret    Shared secret
* @param {Buffer|string} body     Raw request body
* @param {string} headerSig Header value, e.g. "sha256=abcdef..."
* @returns {boolean}
*/
function verifySignature(secret, body, signature) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const digest = hmac.digest('hex');
  // constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(digest, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// Usage in an Express.js handler
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.get('X-Luxfintech-Signature') || '';
  if (!verifySignature('YOUR_API_SECRET', req.body, sig)) {
    return res.status(403).send('Invalid signature');
  }
  // Process valid payload...
  res.sendStatus(200);
});

🛠️ Test webhook
Request

  curl -X POST https://luxfin.org/payment/test_webhook \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \

Response Fields

    SUCCESS
    ERROR

{"order_id": 0, "status": "SUCCESS", "amount": 0.01, "product": "test product"}
