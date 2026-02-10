# Card Pay | API Docs

Create Card Payment and Retrieve Order ID

Cards are available to users in [**supported regions**](https://docs.luxfintech.org/docs/api/rest-api/cardpay#support-currency). The available currencies depend on your region.

```
POST/card
```

### Authentication[​](https://docs.luxfintech.org/docs/api/rest-api/cardpay#authentication "Direct link to Authentication")

```
Authorization: Bearer <YOUR_API_key>
```

### Request Parameters[​](https://docs.luxfintech.org/docs/api/rest-api/cardpay#request-parameters "Direct link to Request Parameters")

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

Currency code (e.g., `USD`). [available currencies](https://docs.luxfintech.org/docs/api/rest-api/cardpay#support-currency)

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

### Supported currencies[​](https://docs.luxfintech.org/docs/api/rest-api/cardpay#support-currency "Direct link to Supported currencies")

USD works globally. You can charge users from all countries in USD.

Region

Available Currency

United States

USD

European Union

EUR

United Kingdom

GBP

Australia

AUD

Canada

CAD

Switzerland

CHF

Brazil

BRL

Denmark

DKK

Mexico

MXN

Norway

NOK

New Zealand

NZD

Thailand

THB

Turkey

TRY

### Response Fields[​](https://docs.luxfintech.org/docs/api/rest-api/cardpay#response-fields "Direct link to Response Fields")

-   200

-   400
-   401

```
  {      "order_url": "string",      "order_id": 0,      "amount": "string"  }  
```

### Behavior[​](https://docs.luxfintech.org/docs/api/rest-api/cardpay#behavior "Direct link to Behavior")

When you receive a `200 OK` response, you **must redirect the user** to the URL specified in the `order_url` field. This URL points to the Card Pay checkout page where the customer can complete the payment. Example:

```
window.location.href = response.order_url;
```

### Request Samples[​](https://docs.luxfintech.org/docs/api/rest-api/cardpay#request-samples "Direct link to Request Samples")

```
    curl -X POST https://luxfin.org/card \      -H "Authorization: Bearer YOUR_API_KEY" \      -H "Content-Type: application/json" \      -d '{            "amount": 100,            "currency": "USD",            "customer": "test@gmail.com",            "product": "test product",            "redirect_url": "https://your_domain.com/redirect_page"        }'
```

---
Source: [Card Pay | API Docs](https://docs.luxfintech.org/docs/api/rest-api/cardpay)