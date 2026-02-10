# Venmo | API Docs

Create Venmo Payment and Retrieve Order ID

```
POST/payment/order
```

### Authentication[​](https://docs.luxfintech.org/docs/api/rest-api/venmo#authentication "Direct link to Authentication")

```
Authorization: Bearer <YOUR_API_key>
```

### Request Parameters[​](https://docs.luxfintech.org/docs/api/rest-api/venmo#request-parameters "Direct link to Request Parameters")

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

Currency code (e.g., `USD`). **We only support USD**.

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

### Response Fields[​](https://docs.luxfintech.org/docs/api/rest-api/venmo#response-fields "Direct link to Response Fields")

-   200
 {
      "order_url": "string",
      "order_id": 0,
      "amount": "string"
  }
  

-   400
-   401

```
  {      "order_url": "string",      "order_id": 0,      "amount": "string"  }  
```

### Behavior[​](https://docs.luxfintech.org/docs/api/rest-api/venmo#behavior "Direct link to Behavior")

When you receive a `200 OK` response, you **must redirect the user** to the URL specified in the `order_url` field. This URL points to the Venmo checkout page where the customer can complete the payment. Example:

```
window.location.href = response.order_url;
```

### Request Samples[​](https://docs.luxfintech.org/docs/api/rest-api/venmo#request-samples "Direct link to Request Samples")

```
    curl -X POST https://luxfin.org/payment/order \      -H "Authorization: Bearer YOUR_API_KEY" \      -H "Content-Type: application/json" \      -d '{            "amount": 100,            "currency": "USD",            "customer": "test@gmail.com",            "product": "test product",            "redirect_url": "https://your_domain.com/redirect_page"        }'
```

---
Source: [Venmo | API Docs](https://docs.luxfintech.org/docs/api/rest-api/venmo)