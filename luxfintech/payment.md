# Payments | API Docs

## Getting a Payment URL

Initiate a payment request via the Luxfin API. The following uses PayPal as an example.  
For more APIs, please refer to the [API docs](https://docs.luxfintech.org/docs/api).

### 🔧 Method[​](https://docs.luxfintech.org/docs/tutorial/get-start/payments/#-method "Direct link to 🔧 Method")

```
POST
```

### 🚀 URL[​](https://docs.luxfintech.org/docs/tutorial/get-start/payments/#-url "Direct link to 🚀 URL")

```
/payment/paypal
```

### 🔐 Authentication[​](https://docs.luxfintech.org/docs/tutorial/get-start/payments/#-authentication "Direct link to 🔐 Authentication")

All requests must include the following HTTP header:

```
Authorization: Bearer <YOUR_API_key>### 📤 Request Headers| Header        | Value                        | Required ||---------------|------------------------------|----------|| Authorization | Bearer {your_api_key}        | ✅       || Content-Type  | application/json             | ✅       |### 📥 Request Body{  "amount": 0,  "currency": "string",  "customer": "string",  "product": "string",  "redirect_url": "string"}
```

### 📌 Request Parameters[​](https://docs.luxfintech.org/docs/tutorial/get-start/payments/#-request-parameters "Direct link to 📌 Request Parameters")

Field

Type

Description

Required

`amount`

number

Payment amount

✅

`currency`

string

Currency code (e.g., `USD`), **We only support USD**.

✅

`customer`

string

The customer ID should be your **customer's email**. This email should be unique for each customer.

✅

`product`

string

The product information you display to users

✅

`redirect_url`

string

Redirect URL after successful payment.

❌

### 📦 Response Fields[​](https://docs.luxfintech.org/docs/tutorial/get-start/payments/#-response-fields "Direct link to 📦 Response Fields")

-   Request(cURL)

-   Resonse 200(JSON)

```
curl -X POST https://api.example.com \  -H "Authorization: Bearer YOUR_API_KEY" \  -H "Content-Type: application/json" \  -d '{    "amount": 100,    "currency": "USD",    "customer": "test@gmail.com",    "product": "test product",    "redirect_url": "https://your_domain.com/redirect_page"  }'
```

---
Source: [Payments | API Docs](https://docs.luxfintech.org/docs/tutorial/get-start/payments/)